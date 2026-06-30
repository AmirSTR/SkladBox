import type { InventoryItem } from '../types';
import {
  formatCompactNumber,
  formatCurrency,
  formatStockDays,
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
  const rows = items.map((item) => {
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
    };
  });
  const totalBudget = items.reduce(
    (sum, item) => sum + item.recommendedQty * (item.costPrice ?? 0),
    0,
  );
  const sheet = XLSX.utils.json_to_sheet(rows);
  const summaryStartRow = rows.length + 3;

  XLSX.utils.sheet_add_aoa(
    sheet,
    [
      ['Итого позиций', items.length],
      ['Всего к заказу, шт.', items.reduce((sum, item) => sum + item.recommendedQty, 0)],
      ['Ориентировочный бюджет', formatCurrency(totalBudget)],
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
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Заказ');
  XLSX.writeFile(workbook, `antistop-order-${getDateStamp()}.xlsx`);
}

function getDateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
