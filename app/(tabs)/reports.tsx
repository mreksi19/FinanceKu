import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { EmptyState } from '@/components/ui/empty-state';
import { AllocationRow } from '@/components/ui/allocation-row';
import { DonutRing } from '@/components/ui/donut-ring';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';
import { useAllocationStore } from '@/stores/allocationStore';
import { useTransactionStore } from '@/stores/transactionStore';

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatPeriodLabel(period: string) {
  const [y, m] = period.split('-');
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export default function ReportsScreen() {
  const db = useSQLiteContext();
  const { allocations, fetchAllocations } = useAllocationStore();
  const { summary, monthSummaries, fetchSummary, fetchMonthSummaries } = useTransactionStore();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchAllocations(db), fetchSummary(db), fetchMonthSummaries(db, 12)]);
  }, [db, fetchAllocations, fetchSummary, fetchMonthSummaries]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const totalSpentPct =
    summary.totalAllocated > 0 ? Math.round((summary.totalSpent / summary.totalAllocated) * 100) : 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <ThemedText style={styles.title}>Laporan</ThemedText>
      <ThemedText style={styles.subtitle}>Ringkasan keuangan per bulan</ThemedText>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderTopColor: Colors.blue }]}>
          <ThemedText style={styles.summaryLabel}>Total Dialokasikan</ThemedText>
          <ThemedText style={styles.summaryValue}>{formatRupiah(summary.totalAllocated)}</ThemedText>
        </View>
        <View style={[styles.summaryCard, { borderTopColor: Colors.orange }]}>
          <ThemedText style={styles.summaryLabel}>% Terpakai dari Alokasi</ThemedText>
          <ThemedText style={styles.summaryValue}>{totalSpentPct}%</ThemedText>
        </View>
      </View>

      <ThemedText style={styles.sectionTitle}>Ringkasan Bulanan</ThemedText>
      <View style={styles.card}>
        {monthSummaries.length === 0 ? (
          <EmptyState icon="📊" title="Belum ada data" subtitle="Transaksi akan muncul di sini per bulan" />
        ) : (
          monthSummaries.map((m, i) => (
            <View key={m.period} style={[styles.monthRow, i === monthSummaries.length - 1 && { borderBottomWidth: 0 }]}>
              <DonutRing income={m.income} expense={m.expense} size={54} strokeWidth={8} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <ThemedText style={styles.monthTitle}>{formatPeriodLabel(m.period)}</ThemedText>
                <View style={styles.monthLineRow}>
                  <ThemedText style={styles.monthLineLabel}>Pemasukan:</ThemedText>
                  <ThemedText style={[styles.monthLineValue, { color: Colors.green }]}>
                    {formatRupiah(m.income)}
                  </ThemedText>
                </View>
                <View style={styles.monthLineRow}>
                  <ThemedText style={styles.monthLineLabel}>Pengeluaran:</ThemedText>
                  <ThemedText style={[styles.monthLineValue, { color: Colors.red }]}>
                    -{formatRupiah(m.expense)}
                  </ThemedText>
                </View>
                <View style={styles.monthLineRow}>
                  <ThemedText style={styles.monthLineLabel}>Total:</ThemedText>
                  <ThemedText style={[styles.monthLineValue, { color: m.total >= 0 ? Colors.green : Colors.red }]}>
                    {formatRupiah(m.total)}
                  </ThemedText>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <ThemedText style={styles.sectionTitle}>Per Kantong Alokasi</ThemedText>
      <View style={styles.card}>
        {allocations.length === 0 ? (
          <EmptyState icon="🗂️" title="Belum ada data" subtitle="Buat kantong alokasi terlebih dahulu" />
        ) : (
          allocations.map((a) => <AllocationRow key={a.id} allocation={a} />)
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 13, color: Colors.muted, marginTop: 2, marginBottom: 18 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  summaryCard: { flex: 1, backgroundColor: Colors.card, borderRadius: Radius.md, borderTopWidth: 3, padding: 14, ...Shadows.sm },
  summaryLabel: { fontSize: 11, color: Colors.muted, fontWeight: '600' },
  summaryValue: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginTop: 4, marginBottom: 10 },
  card: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, marginBottom: 20, ...Shadows.sm },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  monthTitle: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  monthLineRow: { flexDirection: 'row', justifyContent: 'space-between' },
  monthLineLabel: { fontSize: 11, color: Colors.muted },
  monthLineValue: { fontSize: 12, fontWeight: '700' },
});
