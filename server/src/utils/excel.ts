import * as XLSX from 'xlsx';
import type { ParsedInventoryRow } from './calculations';

const REQUIRED_HEADERS = [
  'Товар',
  'Остаток сейчас',
  'Продано за 30 дней',
  'Срок поставки, дней',
] as const;

const OPTIONAL_HEADERS = ['Поставщик', 'Себестоимость'] as const;

export interface ParsedWorkbook {
  rows: ParsedInventoryRow[];
  hasSupplierColumn: boolean;
  hasCostColumn: boolean;
}

export const EXCEL_READ_ERROR =
  'Не удалось прочитать файл. Проверьте названия колонок.';

export function parseInventoryWorkbook(buffer: Buffer): ParsedWorkbook {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

  if (!sheet) {
    throw new Error(EXCEL_READ_ERROR);
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  const headers = (rawRows[0] ?? []).map((value) => String(value));
  const headerIndex = createHeaderIndex(headers);
  const hasRequiredHeaders = REQUIRED_HEADERS.every((header) =>
    headerIndex.has(normalizeHeader(header)),
  );

  if (!hasRequiredHeaders) {
    throw new Error(EXCEL_READ_ERROR);
  }

  const hasSupplierColumn = headerIndex.has(normalizeHeader('Поставщик'));
  const hasCostColumn = headerIndex.has(normalizeHeader('Себестоимость'));
  const rows = rawRows
    .slice(1)
    .map((row) => toInventoryRow(row, headerIndex))
    .filter((row): row is ParsedInventoryRow => Boolean(row?.productName));

  return {
    rows,
    hasSupplierColumn,
    hasCostColumn,
  };
}

function toInventoryRow(
  row: unknown[],
  headerIndex: Map<string, number>,
): ParsedInventoryRow | null {
  const productName = readText(row, headerIndex, 'Товар');

  if (!productName) {
    return null;
  }

  return {
    productName,
    currentStock: readNumber(row, headerIndex, 'Остаток сейчас'),
    soldLast30Days: readNumber(row, headerIndex, 'Продано за 30 дней'),
    leadTimeDays: readNumber(row, headerIndex, 'Срок поставки, дней'),
    supplierName: readText(row, headerIndex, 'Поставщик') || undefined,
    costPrice: readOptionalNumber(row, headerIndex, 'Себестоимость'),
  };
}

function createHeaderIndex(headers: string[]): Map<string, number> {
  return headers.reduce((map, header, index) => {
    const normalized = normalizeHeader(header);

    if (normalized) {
      map.set(normalized, index);
    }

    return map;
  }, new Map<string, number>());
}

function normalizeHeader(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ru-RU');
}

function readText(
  row: unknown[],
  headerIndex: Map<string, number>,
  header: string,
): string {
  const value = readCell(row, headerIndex, header);
  return String(value ?? '').trim();
}

function readNumber(
  row: unknown[],
  headerIndex: Map<string, number>,
  header: string,
): number {
  return parseNumber(readCell(row, headerIndex, header));
}

function readOptionalNumber(
  row: unknown[],
  headerIndex: Map<string, number>,
  header: string,
): number | undefined {
  if (!headerIndex.has(normalizeHeader(header))) {
    return undefined;
  }

  return parseNumber(readCell(row, headerIndex, header));
}

function readCell(
  row: unknown[],
  headerIndex: Map<string, number>,
  header: string,
): unknown {
  const index = headerIndex.get(normalizeHeader(header));
  return index === undefined ? undefined : row[index];
}

function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}
