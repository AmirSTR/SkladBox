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
