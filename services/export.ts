import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from '@/services/database';

function escapeCSV(val: string | number): string {
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const TYPE_LABEL: Record<string, string> = {
  income: 'Pemasukan',
  allocation: 'Alokasi',
  expense: 'Pengeluaran',
};

export async function exportTransactionsToCSV(db: SQLiteDatabase): Promise<string> {
  const rows = await db.getAllAsync<any>(
    `SELECT t.id, t.type, t.amount, t.note, t.created_at,
            s.name as income_source_name, a.name as allocation_name
     FROM transactions t
     LEFT JOIN income_sources s ON s.id = t.income_source_id
     LEFT JOIN allocations a ON a.id = t.allocation_id
     ORDER BY t.created_at DESC`
  );

  if (rows.length === 0) return '';

  const headers = ['Tanggal', 'Jenis', 'Keterangan', 'Sumber/Kantong', 'Nominal'];
  const csvLines: string[] = [headers.join(',')];

  for (const r of rows) {
    const label = r.income_source_name ?? r.allocation_name ?? '-';
    csvLines.push(
      [
        escapeCSV(r.created_at),
        escapeCSV(TYPE_LABEL[r.type] ?? r.type),
        escapeCSV(r.note ?? ''),
        escapeCSV(label),
        escapeCSV(r.amount),
      ].join(',')
    );
  }

  const csv = csvLines.join('\n');
  const filename = `financeku_riwayat_${Date.now()}.csv`;
  const file = new File(Paths.cache, filename);
  file.write(csv);
  return file.uri;
}

export async function shareFile(fileUri: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Sharing tidak tersedia di perangkat ini');
  }
  await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
}
