import type { InventoryItem, StockStatus } from '../types';

const ACTIONABLE_STATUSES: StockStatus[] = ['В стопе', 'Срочно', 'Скоро'];
const SAFETY_BUFFER_DAYS = 3;
export const UNASSIGNED_SUPPLIER = 'Без поставщика';

export interface LostSalesRisk {
  days: number;
  units: number;
  amount: number | null;
}

export interface SupplierOrderGroup {
  supplierName: string;
  items: InventoryItem[];
  positionsCount: number;
  totalQty: number;
  budget: number | null;
  riskUnits: number;
  lostSalesRisk: number | null;
}

export function getOrderItems(items: InventoryItem[] = []): InventoryItem[] {
  return items.filter((item) => ACTIONABLE_STATUSES.includes(item.status));
}

export function calculateLostSalesRisk(item: InventoryItem): LostSalesRisk {
  const dailyUsage = Math.max(0, item.dailyUsage);
  const leadTimeDays = Math.max(0, item.leadTimeDays);
  const stockDays =
    Number.isFinite(item.stockDays) && item.stockDays !== 999
      ? Math.max(0, item.stockDays)
      : Number.POSITIVE_INFINITY;
  const days = Math.max(0, leadTimeDays + SAFETY_BUFFER_DAYS - stockDays);
  const units = Math.ceil(dailyUsage * days);

  return {
    days: Math.round(days * 10) / 10,
    units,
    amount: item.costPrice === null || item.costPrice === undefined
      ? null
      : units * item.costPrice,
  };
}

export function groupOrderItemsBySupplier(
  items: InventoryItem[] = [],
): SupplierOrderGroup[] {
  const groups = items.reduce((map, item) => {
    const supplierName = item.supplierName?.trim() || UNASSIGNED_SUPPLIER;
    const supplierItems = map.get(supplierName) ?? [];
    supplierItems.push(item);
    map.set(supplierName, supplierItems);
    return map;
  }, new Map<string, InventoryItem[]>());

  return Array.from(groups, ([supplierName, supplierItems]) => {
    const risks = supplierItems.map(calculateLostSalesRisk);

    return {
      supplierName,
      items: supplierItems,
      positionsCount: supplierItems.length,
      totalQty: supplierItems.reduce((sum, item) => sum + item.recommendedQty, 0),
      budget: sumOrderBudget(supplierItems),
      riskUnits: risks.reduce((sum, risk) => sum + risk.units, 0),
      lostSalesRisk: sumRiskAmount(risks),
    };
  }).sort((a, b) => {
    if (a.supplierName === UNASSIGNED_SUPPLIER) {
      return 1;
    }

    if (b.supplierName === UNASSIGNED_SUPPLIER) {
      return -1;
    }

    const amountDifference = (b.lostSalesRisk ?? 0) - (a.lostSalesRisk ?? 0);

    if (amountDifference !== 0) {
      return amountDifference;
    }

    const unitDifference = b.riskUnits - a.riskUnits;

    if (unitDifference !== 0) {
      return unitDifference;
    }

    return a.supplierName.localeCompare(b.supplierName, 'ru');
  });
}

export function sumOrderBudget(items: InventoryItem[]): number | null {
  const hasAnyCost = items.some((item) => item.costPrice !== null && item.costPrice !== undefined);

  if (!hasAnyCost) {
    return null;
  }

  return items.reduce(
    (sum, item) => sum + item.recommendedQty * (item.costPrice ?? 0),
    0,
  );
}

export function sumLostSalesRisk(items: InventoryItem[]): number | null {
  return sumRiskAmount(items.map(calculateLostSalesRisk));
}

export function sumLostSalesUnits(items: InventoryItem[]): number {
  return items.reduce((sum, item) => sum + calculateLostSalesRisk(item).units, 0);
}

export function createSupplierOrderEmail(group: SupplierOrderGroup): string {
  const itemLines = group.items
    .map((item, index) => {
      const risk = calculateLostSalesRisk(item);
      const riskText = risk.units > 0
        ? `, риск дефицита ${formatCompactNumber(risk.units)} шт.`
        : '';

      return `${index + 1}. ${item.productName} — ${formatCompactNumber(item.recommendedQty)} шт. (остаток ${formatCompactNumber(item.currentStock)}, ${item.status}${riskText})`;
    })
    .join('\n');
  const budgetLine = group.budget === null
    ? ''
    : `\nОриентировочный бюджет: ${formatCurrency(group.budget)}.`;
  const riskLine = group.lostSalesRisk === null
    ? `\nРиск дефицита при задержке: ${formatCompactNumber(group.riskUnits)} шт.`
    : `\nРиск потери продаж при задержке: ${formatCurrency(group.lostSalesRisk)}.`;

  return `Здравствуйте!\n\nПросим подготовить заказ:\n\n${itemLines}\n${budgetLine}${riskLine}\n\nПодтвердите, пожалуйста, наличие и ближайшую дату отгрузки.`;
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: value < 10 && value % 1 !== 0 ? 1 : 0,
  }).format(value);
}

export function formatStockDays(value: number): string {
  if (value === 999) {
    return '999 дней';
  }

  if (!Number.isFinite(value)) {
    return '∞';
  }

  if (value < 1 && value > 0) {
    return '< 1 дня';
  }

  const rounded = Math.round(value * 10) / 10;
  return `${formatCompactNumber(rounded)} ${getDayLabel(rounded)}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
    style: 'currency',
    currency: 'RUB',
  }).format(value);
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function sumRiskAmount(risks: LostSalesRisk[]): number | null {
  const hasAnyAmount = risks.some((risk) => risk.amount !== null);

  if (!hasAnyAmount) {
    return null;
  }

  return risks.reduce((sum, risk) => sum + (risk.amount ?? 0), 0);
}

function getDayLabel(value: number): string {
  const absolute = Math.abs(Math.floor(value));
  const lastTwo = absolute % 100;
  const lastOne = absolute % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return 'дней';
  }

  if (lastOne === 1) {
    return 'день';
  }

  if (lastOne >= 2 && lastOne <= 4) {
    return 'дня';
  }

  return 'дней';
}
