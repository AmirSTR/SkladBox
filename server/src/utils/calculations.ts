export type StockStatus = 'В стопе' | 'Срочно' | 'Скоро' | 'Норма';

export interface ParsedInventoryRow {
  productName: string;
  currentStock: number;
  soldLast30Days: number;
  leadTimeDays: number;
  supplierName?: string;
  costPrice?: number;
}

export interface CalculatedInventoryItem extends ParsedInventoryRow {
  dailyUsage: number;
  stockDays: number;
  status: StockStatus;
  recommendedQty: number;
}

export function calculateInventoryItem(
  row: ParsedInventoryRow,
): CalculatedInventoryItem {
  const currentStock = row.currentStock;
  const soldLast30Days = Math.max(0, row.soldLast30Days);
  const leadTimeDays = Math.max(0, row.leadTimeDays);
  const dailyUsage = soldLast30Days / 30;

  if (soldLast30Days === 0) {
    return {
      ...row,
      currentStock,
      soldLast30Days,
      leadTimeDays,
      dailyUsage: 0,
      stockDays: 999,
      status: 'Норма',
      recommendedQty: 0,
    };
  }

  const stockDays = currentStock / dailyUsage;
  const status = getStatus(currentStock, stockDays, leadTimeDays);
  const recommendedQty = Math.max(
    0,
    Math.ceil(dailyUsage * 30 - currentStock),
  );

  return {
    ...row,
    currentStock,
    soldLast30Days,
    leadTimeDays,
    dailyUsage,
    stockDays,
    status,
    recommendedQty,
  };
}

export function getActionableStatuses(): StockStatus[] {
  return ['В стопе', 'Срочно', 'Скоро'];
}

function getStatus(
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
