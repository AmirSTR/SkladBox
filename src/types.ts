export type StockStatus = 'В стопе' | 'Срочно' | 'Скоро' | 'Норма';

export interface InventoryRow {
  productName: string;
  currentStock: number;
  soldLast30Days: number;
  leadTimeDays: number;
  supplier?: string;
  cost?: number;
}

export interface InventoryItem extends InventoryRow {
  id: string;
  averageDailyUsage: number;
  stockDays: number;
  status: StockStatus;
  orderQuantity: number;
}

export interface ParsedInventory {
  rows: InventoryRow[];
  hasSupplierColumn: boolean;
  hasCostColumn: boolean;
}

export interface UploadedFileInfo {
  fileName: string;
  uploadedAt: Date;
}
