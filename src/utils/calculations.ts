import type { InventoryItem, InventoryRow, StockStatus } from '../types';

export const DESIRED_STOCK_DAYS = 30;

const ACTIONABLE_STATUSES: StockStatus[] = ['В стопе', 'Срочно', 'Скоро'];

export function calculateInventoryItems(
  rows: InventoryRow[],
  desiredStockDays = DESIRED_STOCK_DAYS,
): InventoryItem[] {
  return rows.map((row, index) => {
    const currentStock = row.currentStock;
    const soldLast30Days = Math.max(0, row.soldLast30Days);
    const leadTimeDays = Math.max(0, row.leadTimeDays);
    const averageDailyUsage = soldLast30Days / 30;
    const stockDays =
      averageDailyUsage > 0
        ? currentStock / averageDailyUsage
        : currentStock <= 0
          ? 0
          : Number.POSITIVE_INFINITY;

    const status = getStockStatus(currentStock, stockDays, leadTimeDays);
    const orderQuantity = Math.ceil(
      Math.max(0, averageDailyUsage * desiredStockDays - currentStock),
    );

    return {
      ...row,
      id: `${row.productName}-${index}`,
      currentStock,
      soldLast30Days,
      leadTimeDays,
      averageDailyUsage,
      stockDays,
      status,
      orderQuantity,
    };
  });
}

export function getOrderItems(items: InventoryItem[]): InventoryItem[] {
  return items.filter((item) => ACTIONABLE_STATUSES.includes(item.status));
}

function getStockStatus(
  currentStock: number,
  stockDays: number,
  leadTimeDays: number,
): StockStatus {
  if (currentStock <= 0) {
    return 'В стопе';
  }

  if (stockDays < leadTimeDays) {
    return 'Срочно';
  }

  if (stockDays <= leadTimeDays + 3) {
    return 'Скоро';
  }

  return 'Норма';
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: value < 10 && value % 1 !== 0 ? 1 : 0,
  }).format(value);
}

export function formatStockDays(value: number): string {
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
