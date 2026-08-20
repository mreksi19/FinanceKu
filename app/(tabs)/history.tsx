import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { formatDateTime, formatRupiah } from '@/utils/format';
import { useTransactionStore, type TransactionWithLabel } from '@/stores/transactionStore';
import { exportTransactionsToCSV, shareFile } from '@/services/export';

function typeMeta(t: TransactionWithLabel) {
  if (t.type === 'income') {
    return { icon: 'arrow.down.circle.fill', color: Colors.green, sign: '+', bg: Colors.greenBg };
  }
  if (t.type === 'allocation') {
    return { icon: 'building.columns.fill', color: Colors.blue, sign: '', bg: Colors.blueBg };
  }
  return { icon: 'arrow.up.circle.fill', color: Colors.red, sign: '-', bg: Colors.redBg };
}

function titleFor(t: TransactionWithLabel) {
  if (t.type === 'income') return t.income_source_name ?? 'Pemasukan';
  if (t.type === 'allocation') return `Alokasi ke ${t.allocation_name ?? '-'}`;
  if (t.payee) return t.payee;
  return t.note || (t.allocation_name ? `Pengeluaran - ${t.allocation_name}` : 'Pengeluaran');
}

function subtitleFor(t: TransactionWithLabel) {
  const parts: string[] = [formatDateTime(t.tx_date || t.created_at)];
  if (t.account_name) parts.push(t.account_name);
  if (t.type === 'expense' && t.payee && t.note) parts.push(t.note);
  return parts.join(' · ');
}

export default function HistoryScreen() {
  const db = useSQLiteContext();
  const { transactions, fetchTransactions } = useTransactionStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions(db, 200);
    }, [db, fetchTransactions])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions(db, 200);
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      const uri = await exportTransactionsToCSV(db);
      if (!uri) {
        Alert.alert('Belum ada transaksi', 'Tidak ada data untuk diekspor.');
        return;
      }
      await shareFile(uri);
    } catch (e: any) {
      Alert.alert('Gagal ekspor', e?.message ?? 'Terjadi kesalahan.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.title}>Riwayat</ThemedText>
          <ThemedText style={styles.subtitle}>Semua pemasukan, alokasi & pengeluaran</ThemedText>
        </View>
        <Pressable style={styles.exportBtn} onPress={handleExport}>
          <ThemedText style={styles.exportBtnText}>Ekspor CSV</ThemedText>
        </Pressable>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <EmptyState icon="🧾" title="Belum ada transaksi" subtitle="Transaksi akan muncul di sini" />
        }
        renderItem={({ item }) => {
          const meta = typeMeta(item);
          return (
            <View style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                <IconSymbol name={meta.icon as any} size={20} color={meta.color} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.rowTitle}>{titleFor(item)}</ThemedText>
                <ThemedText style={styles.rowDate}>{subtitleFor(item)}</ThemedText>
              </View>
              <ThemedText style={[styles.rowAmount, { color: meta.color }]}>
                {meta.sign}
                {formatRupiah(item.amount)}
              </ThemedText>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 8, gap: 10 },
  exportBtn: {
    backgroundColor: Colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    ...Shadows.sm,
  },
  exportBtnText: { fontSize: 12, fontWeight: '700', color: Colors.tint },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.muted, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 10,
    ...Shadows.sm,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  rowDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  rowAmount: { fontSize: 14, fontWeight: '800' },
});
