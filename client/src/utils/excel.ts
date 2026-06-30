import type { InventoryItem } from '../types';
import {
  calculateLostSalesRisk,
  formatCurrency,
  formatStockDays,
  groupOrderItemsBySupplier,
  type SupplierOrderGroup,
} from './calculations';

const TEMPLATE_HEADERS = [
  'Товар',
  'Остаток сейчас',
  'Продано за 30 дней',
  'Срок поставки, дней',
  'Поставщик',
  'Себестоимость',
] as const;

export async function downloadTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const example = ['Молоко 3,2%', 12, 90, 4, 'Молочная база', 85];
  const sheet = XLSX.utils.aoa_to_sheet([[...TEMPLATE_HEADERS], example]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, sheet, 'Остатки');
  XLSX.writeFile(workbook, 'antistop-template.xlsx');
}

export async function downloadOrder(items: InventoryItem[]): Promise<void> {
  if (items.length === 0) {
    return;
  }

  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const groups = groupOrderItemsBySupplier(items);
  const summarySheet = XLSX.utils.json_to_sheet(
    groups.map((group) => ({
      Поставщик: group.supplierName,
      Позиций: group.positionsCount,
      'Заказать, шт.': group.totalQty,
      'Ориентировочный бюджет': group.budget ?? '',
      'Риск дефицита, шт.': group.riskUnits,
      'Риск потери продаж': group.lostSalesRisk ?? '',
    })),
  );

  summarySheet['!cols'] = [
    { wch: 28 },
    { wch: 12 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводка');

  groups.forEach((group) => {
    appendSupplierSheet(XLSX, workbook, group);
  });

  XLSX.writeFile(workbook, `antistop-orders-${getDateStamp()}.xlsx`);
}

export async function downloadSupplierOrder(
  group: SupplierOrderGroup,
): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();

  appendSupplierSheet(XLSX, workbook, group);
  XLSX.writeFile(
    workbook,
    `antistop-order-${slugifyFileName(group.supplierName)}-${getDateStamp()}.xlsx`,
  );
}

function appendSupplierSheet(
  XLSX: typeof import('xlsx'),
  workbook: import('xlsx').WorkBook,
  group: SupplierOrderGroup,
): void {
  const rows = group.items.map((item) => {
    const risk = calculateLostSalesRisk(item);
    const costPrice = item.costPrice ?? null;
    const lineBudget = costPrice === null ? null : item.recommendedQty * costPrice;

    return {
      Товар: item.productName,
      Поставщик: item.supplierName ?? '',
      'Остаток сейчас': item.currentStock,
      'Продано за 30 дней': item.soldLast30Days,
      'Хватит на': formatStockDays(item.stockDays),
      'Срок поставки, дней': item.leadTimeDays,
      Статус: item.status,
      'Заказать, шт.': item.recommendedQty,
      Себестоимость: costPrice ?? '',
      'Бюджет строки': lineBudget ?? '',
      'Риск дефицита, дней': risk.days,
      'Риск дефицита, шт.': risk.units,
      'Риск потери продаж': risk.amount ?? '',
    };
  });
  const sheet = XLSX.utils.json_to_sheet(rows);
  const summaryStartRow = rows.length + 3;

  XLSX.utils.sheet_add_aoa(
    sheet,
    [
      ['Итого позиций', group.positionsCount],
      ['Всего к заказу, шт.', group.totalQty],
      ['Ориентировочный бюджет', group.budget === null ? '—' : formatCurrency(group.budget)],
      [
        'Риск потери продаж',
        group.lostSalesRisk === null ? '—' : formatCurrency(group.lostSalesRisk),
      ],
      ['Риск дефицита, шт.', group.riskUnits],
    ],
    { origin: `A${summaryStartRow}` },
  );

  sheet['!cols'] = [
    { wch: 32 },
    { wch: 22 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    sanitizeSheetName(group.supplierName),
  );
}

function getDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function sanitizeSheetName(value: string): string {
  const sanitized = value.replace(/[\][*?/\\:]/g, ' ').trim();

  return (sanitized || 'Поставщик').slice(0, 31);
}

function slugifyFileName(value: string): string {
  return value
    .toLocaleLowerCase('ru-RU')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) || 'supplier';
}
