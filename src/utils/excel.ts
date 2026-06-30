import type { InventoryRow, ParsedInventory } from '../types';

const REQUIRED_HEADERS = [
  'Товар',
  'Остаток сейчас',
  'Продано за 30 дней',
  'Срок поставки, дней',
] as const;

const OPTIONAL_HEADERS = ['Поставщик', 'Себестоимость'] as const;

const TEMPLATE_HEADERS = [...REQUIRED_HEADERS, ...OPTIONAL_HEADERS];

export async function parseInventoryFile(file: File): Promise<ParsedInventory> {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

  if (!sheet) {
    throw new Error('Empty workbook');
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  const headers = (rows[0] ?? []).map((value) => String(value));
  const headerIndex = createHeaderIndex(headers);
  const hasRequiredHeaders = REQUIRED_HEADERS.every((header) =>
    headerIndex.has(normalizeHeader(header)),
  );

  if (!hasRequiredHeaders) {
    throw new Error('Missing required columns');
  }

  const hasSupplierColumn = headerIndex.has(normalizeHeader('Поставщик'));
  const hasCostColumn = headerIndex.has(normalizeHeader('Себестоимость'));
  const inventoryRows = rows
    .slice(1)
    .map((row) => toInventoryRow(row, headerIndex))
    .filter((row): row is InventoryRow => Boolean(row?.productName));

  return {
    rows: inventoryRows,
    hasSupplierColumn,
    hasCostColumn,
  };
}

export async function downloadTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const example = [
    'Молоко 3,2%',
    12,
    90,
    4,
    'Молочная база',
    85,
  ];
  const sheet = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, example]);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, sheet, 'Остатки');
  XLSX.writeFile(workbook, 'antistop-template.xlsx');
}

function toInventoryRow(
  row: unknown[],
  headerIndex: Map<string, number>,
): InventoryRow | null {
  const productName = readText(row, headerIndex, 'Товар');

  if (!productName) {
    return null;
  }

  return {
    productName,
    currentStock: readNumber(row, headerIndex, 'Остаток сейчас'),
    soldLast30Days: readNumber(row, headerIndex, 'Продано за 30 дней'),
    leadTimeDays: readNumber(row, headerIndex, 'Срок поставки, дней'),
    supplier: readText(row, headerIndex, 'Поставщик') || undefined,
    cost: readOptionalNumber(row, headerIndex, 'Себестоимость'),
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
  const normalizedHeader = normalizeHeader(header);

  if (!headerIndex.has(normalizedHeader)) {
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
