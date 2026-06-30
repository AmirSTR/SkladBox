import type { InventoryItem, StockStatus } from '../types';

const ACTIONABLE_STATUSES: StockStatus[] = ['В стопе', 'Срочно', 'Скоро'];

export function getOrderItems(items: InventoryItem[] = []): InventoryItem[] {
  return items.filter((item) => ACTIONABLE_STATUSES.includes(item.status));
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
