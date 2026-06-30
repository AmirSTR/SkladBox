import * as XLSX from 'xlsx';

export interface ConsumptionProductTotal {
  productName: string;
  quantity: number;
}

export interface ParsedConsumptionSheet {
  totalsByProduct: Map<string, ConsumptionProductTotal>;
  rowsRead: number;
  rowsUsed: number;
  ignoredRows: number;
}

const PRODUCT_HEADERS = ['товар', 'наименование', 'product', 'sku'];
const QUANTITY_HEADERS = ['количество', 'кол-во', 'qty', 'quantity', 'расход'];
const DATE_HEADERS = ['дата', 'date'];
const TYPE_HEADERS = ['тип', 'операция', 'type', 'operation'];
const IGNORED_OPERATION_WORDS = ['возврат', 'приход', 'return', 'income'];
const SYNC_PERIOD_DAYS = 30;

export async function fetchConsumptionSheet(
  sheetUrl: string,
): Promise<ParsedConsumptionSheet> {
  const csvUrl = toGoogleSheetsCsvUrl(sheetUrl);
  const response = await fetch(csvUrl);

  if (!response.ok) {
    throw new Error('Не удалось получить Google Sheets.');
  }

  const csv = await response.text();

  if (!csv.trim() || csv.trimStart().startsWith('<')) {
    throw new Error('Google Sheets должен быть доступен по ссылке.');
  }

  return parseConsumptionCsv(csv);
}

export function normalizeProductName(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    .trim()
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/\s+/g, ' ');
}

function parseConsumptionCsv(csv: string): ParsedConsumptionSheet {
  const workbook = XLSX.read(csv, { type: 'string' });
  const firstSheetName = workbook.SheetNames[0];
  const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;

  if (!sheet) {
    throw new Error('Google Sheets пустой.');
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  const headers = (rawRows[0] ?? []).map((value) => String(value));
  const headerIndex = createHeaderIndex(headers);
  const productIndex = findHeaderIndex(headerIndex, PRODUCT_HEADERS);
  const quantityIndex = findHeaderIndex(headerIndex, QUANTITY_HEADERS);
  const dateIndex = findHeaderIndex(headerIndex, DATE_HEADERS);
  const typeIndex = findHeaderIndex(headerIndex, TYPE_HEADERS);

  if (productIndex === null || quantityIndex === null) {
    throw new Error('В Google Sheets нужны колонки "Товар" и "Количество".');
  }

  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - SYNC_PERIOD_DAYS);
  periodStart.setHours(0, 0, 0, 0);

  return rawRows.slice(1).reduce<ParsedConsumptionSheet>(
    (result, row) => {
      result.rowsRead += 1;

      const productName = String(row[productIndex] ?? '').trim();
      const quantity = parseNumber(row[quantityIndex]);
      const operationType = typeIndex === null ? '' : String(row[typeIndex] ?? '');
      const operationDate = dateIndex === null ? null : parseDate(row[dateIndex]);

      if (
        !productName ||
        quantity <= 0 ||
        shouldIgnoreOperation(operationType) ||
        (dateIndex !== null && (!operationDate || operationDate < periodStart))
      ) {
        result.ignoredRows += 1;
        return result;
      }

      const normalizedProductName = normalizeProductName(productName);
      const current = result.totalsByProduct.get(normalizedProductName);

      result.totalsByProduct.set(normalizedProductName, {
        productName,
        quantity: (current?.quantity ?? 0) + quantity,
      });
      result.rowsUsed += 1;
      return result;
    },
    {
      totalsByProduct: new Map<string, ConsumptionProductTotal>(),
      rowsRead: 0,
      rowsUsed: 0,
      ignoredRows: 0,
    },
  );
}

function toGoogleSheetsCsvUrl(value: string): string {
  let parsed: URL;

  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error('Некорректная ссылка на Google Sheets.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Google Sheets должен открываться по https-ссылке.');
  }

  if (parsed.hostname !== 'docs.google.com') {
    throw new Error('Поддерживаются ссылки docs.google.com/spreadsheets.');
  }

  const sheetId = parsed.pathname.match(/\/spreadsheets\/d\/([^/]+)/)?.[1];

  if (!sheetId) {
    throw new Error('Не удалось определить Google Sheets ID.');
  }

  const gid = parsed.searchParams.get('gid') ?? '0';
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
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

function findHeaderIndex(
  headerIndex: Map<string, number>,
  candidates: string[],
): number | null {
  for (const candidate of candidates) {
    const index = headerIndex.get(normalizeHeader(candidate));

    if (index !== undefined) {
      return index;
    }
  }

  return null;
}

function normalizeHeader(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ru-RU');
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

  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const text = String(value ?? '').trim();
  const ruMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);

  if (ruMatch) {
    const [, day, month, year] = ruMatch;
    const fullYear = Number(year.length === 2 ? `20${year}` : year);
    const date = new Date(fullYear, Number(month) - 1, Number(day));

    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function shouldIgnoreOperation(value: string): boolean {
  const normalized = value.toLocaleLowerCase('ru-RU');
  return IGNORED_OPERATION_WORDS.some((word) => normalized.includes(word));
}
