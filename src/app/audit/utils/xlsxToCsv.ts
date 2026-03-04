/**
 * Section 39: XLSX upload support.
 * Convert .xlsx / .xls to CSV File so existing parser can consume.
 */

export const XLSX_EXT = /\.(xlsx|xls)$/i;

export function isExcelFile(file: File): boolean {
  return XLSX_EXT.test(file.name);
}

export async function normalizeToCsvFiles(files: File[]): Promise<File[]> {
  const out: File[] = [];
  const XLSX = await import('xlsx');
  for (const f of files) {
    if (isExcelFile(f)) {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const first = wb.SheetNames[0];
      const sheet = wb.Sheets[first];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      const blob = new Blob([csv], { type: 'text/csv' });
      const name = f.name.replace(XLSX_EXT, '.csv');
      out.push(new File([blob], name, { type: 'text/csv' }));
    } else {
      out.push(f);
    }
  }
  return out;
}
