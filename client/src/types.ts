export type StockStatus = 'В стопе' | 'Срочно' | 'Скоро' | 'Норма';

export interface User {
  id: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
}

export interface InventoryItem {
  id: string;
  productName: string;
  currentStock: number;
  soldLast30Days: number;
  leadTimeDays: number;
  supplierName?: string | null;
  costPrice?: number | null;
  dailyUsage: number;
  stockDays: number;
  status: StockStatus;
  recommendedQty: number;
}

export interface Upload {
  id: string;
  fileName: string;
  totalItems: number;
  urgentCount: number;
  soonCount: number;
  stopCount: number;
  hasSupplierColumn: boolean;
  hasCostColumn: boolean;
  createdAt: string;
  items?: InventoryItem[];
}

export interface Supplier {
  id: string;
  name: string;
  createdAt: string;
}

export interface ConsumptionSyncSummary {
  rowsRead: number;
  rowsUsed: number;
  ignoredRows: number;
  productsUpdated: number;
  unmatchedProducts: string[];
  unmatchedProductsCount: number;
  periodDays: number;
  syncedAt: string;
}
