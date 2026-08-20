import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MiIcon } from '@/components/ui/mi-icon';
import { DonutRing } from '@/components/ui/donut-ring';
import { LineTrend } from '@/components/ui/line-trend';
import { BarMiniChart } from '@/components/ui/bar-mini-chart';
import { AllocationRow } from '@/components/ui/allocation-row';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';
import { useIncomeStore } from '@/stores/incomeStore';
import { useAllocationStore } from '@/stores/allocationStore';
import { useAccountStore } from '@/stores/accountStore';
import { useTransactionStore } from '@/stores/transactionStore';
import { useSettingsStore } from '@/stores/settingsStore';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function formatPeriodLabel(period: string) {
  const [y, m] = period.split('-');
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

function formatCompact(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (abs >= 1_000) return `${Math.round(n / 1000)}k`;
  return String(Math.round(n));
}

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { sources, fetchSources } = useIncomeStore();
  const { allocations, fetchAllocations } = useAllocationStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const {
    summary,
    monthSummaries,
    last7Days,
    balanceTrend,
    fetchSummary,
    fetchMonthSummaries,
    fetchLast7Days,
    fetchBalanceTrend,
  } = useTransactionStore();
  const { loadSettings } = useSettingsStore();
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    await Promise.all([
      fetchSources(db),
      fetchAllocations(db),
      fetchAccounts(db),
      fetchSummary(db),
      fetchMonthSummaries(db, 2),
      fetchLast7Days(db),
      fetchBalanceTrend(db, 6),
      loadSettings(db),
    ]);
  }, [
    db,
    fetchSources,
    fetchAllocations,
    fetchAccounts,
    fetchSummary,
    fetchMonthSummaries,
    fetchLast7Days,
    fetchBalanceTrend,
    loadSettings,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadAll();
    }, [loadAll])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const totalAccountBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const barData = last7Days.map((d) => ({
    label: d.date.slice(8, 10) + '/' + d.date.slice(5, 7),
    value: d.total,
  }));
  const trendValues = balanceTrend.map((b) => b.balance);

  return (
    <View style={{ flex: 1 }}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.headerRow}>
        <View>
          <ThemedText style={styles.brand}>FinanceKu</ThemedText>
          <ThemedText style={styles.brandSub}>Financial Tracker</ThemedText>
        </View>
      </View>

      <View style={styles.tagline}>
        <ThemedText style={styles.taglineText}>
          Catat. Kelola. <ThemedText style={styles.taglineBold}>Bertumbuh.</ThemedText>
        </ThemedText>
      </View>

      {/* Ringkasan bulanan (2 bulan terakhir, donut) */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Ringkasan</ThemedText>
        <View style={styles.summaryRow}>
          {monthSummaries.length === 0 && (
            <ThemedText style={styles.mutedText}>Belum ada transaksi bulan ini</ThemedText>
          )}
          {monthSummaries.map((m, i) => (
            <View key={m.period} style={[styles.summaryCol, i === 0 && styles.summaryColDivider]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <DonutRing income={m.income} expense={m.expense} size={56} strokeWidth={8} />
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.summaryPeriod}>{formatPeriodLabel(m.period)}</ThemedText>
                  <ThemedText style={styles.summaryLine}>
                    <ThemedText style={{ color: Colors.muted, fontSize: 11 }}>Masuk </ThemedText>
                    <ThemedText style={{ color: Colors.green, fontSize: 11, fontWeight: '700' }}>
                      {formatCompact(m.income)}
                    </ThemedText>
                  </ThemedText>
                  <ThemedText style={styles.summaryLine}>
                    <ThemedText style={{ color: Colors.muted, fontSize: 11 }}>Keluar </ThemedText>
                    <ThemedText style={{ color: Colors.red, fontSize: 11, fontWeight: '700' }}>
                      {formatCompact(m.expense)}
                    </ThemedText>
                  </ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Rekening */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <ThemedText style={styles.cardTitle}>Rekening</ThemedText>
          <ThemedText style={styles.cardLink} onPress={() => router.push('/rekening')}>
            Kelola
          </ThemedText>
        </View>
        {accounts.length === 0 ? (
          <EmptyState icon="🏦" title="Belum ada rekening" subtitle="Tambahkan Dompet atau Bank" />
        ) : (
          accounts.slice(0, 4).map((a) => (
            <View key={a.id} style={styles.accountLine}>
              <View style={[styles.accIconWrap, { backgroundColor: `${a.color}22` }]}>
                <MiIcon name={a.icon} size={16} color={a.color} />
              </View>
              <ThemedText style={styles.accName}>{a.name}</ThemedText>
              <ThemedText style={[styles.accBalance, { color: a.balance < 0 ? Colors.red : Colors.text }]}>
                {formatRupiah(a.balance)}
              </ThemedText>
            </View>
          ))
        )}
      </View>

      {/* Pengeluaran 7 hari terakhir */}
      <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>Pengeluaran - 7 Hari Terakhir</ThemedText>
        <View style={{ marginTop: 10 }}>
          <BarMiniChart data={barData} color={Colors.red} formatValue={formatCompact} />
        </View>
      </View>

      {/* Tren saldo */}
      {trendValues.length > 1 && (
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Tren Saldo</ThemedText>
          <ThemedText style={styles.trendValue}>{formatRupiah(totalAccountBalance)}</ThemedText>
          <View style={{ marginTop: 8, alignItems: 'center' }}>
            <LineTrend values={trendValues} width={300} height={110} />
          </View>
          <View style={styles.trendLabelsRow}>
            {balanceTrend.map((b) => (
              <ThemedText key={b.period} style={styles.trendLabel}>
                {formatPeriodLabel(b.period).split(' ')[0]}
              </ThemedText>
            ))}
          </View>
        </View>
      )}

      <View style={styles.quickRow}>
        <Pressable style={styles.quickAction} onPress={() => router.push('/alokasi')}>
          <View style={[styles.quickIconWrap, { backgroundColor: Colors.orangeBg }]}>
            <IconSymbol name="building.columns.fill" size={20} color={Colors.orange} />
          </View>
          <ThemedText style={styles.quickTitle}>Atur Alokasi</ThemedText>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => router.push('/pemasukan')}>
          <View style={[styles.quickIconWrap, { backgroundColor: Colors.greenBg }]}>
            <IconSymbol name="creditcard.fill" size={20} color={Colors.green} />
          </View>
          <ThemedText style={styles.quickTitle}>Pemasukan</ThemedText>
        </Pressable>
        <Pressable style={styles.quickAction} onPress={() => router.push('/rekening')}>
          <View style={[styles.quickIconWrap, { backgroundColor: Colors.blueBg }]}>
            <IconSymbol name="wallet.fill" size={20} color={Colors.blue} />
          </View>
          <ThemedText style={styles.quickTitle}>Rekening</ThemedText>
        </Pressable>
      </View>

      {/* Anggaran */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <ThemedText style={styles.cardTitle}>Anggaran</ThemedText>
          <ThemedText style={styles.cardLink} onPress={() => router.push('/alokasi')}>
            Kelola
          </ThemedText>
        </View>
        {allocations.length === 0 ? (
          <EmptyState icon="🗂️" title="Belum ada anggaran" subtitle="Buat pos anggaran di Atur Alokasi" />
        ) : (
          allocations.map((a) => <AllocationRow key={a.id} allocation={a} />)
        )}
      </View>

      <View style={{ height: 90 }} />
    </ScrollView>

    <Pressable style={styles.fab} onPress={() => router.push('/transaksi')}>
      <IconSymbol name="plus" size={26} color="#fff" />
    </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  brand: { fontSize: 19, fontWeight: '800', color: Colors.text },
  brandSub: { fontSize: 12, color: Colors.muted, marginTop: 1 },
  tagline: {
    backgroundColor: Colors.card,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
    ...Shadows.sm,
  },
  taglineText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  taglineBold: { color: Colors.text, fontWeight: '700' },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 14,
    ...Shadows.sm,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  cardLink: { fontSize: 12, fontWeight: '600', color: Colors.tint },
  mutedText: { fontSize: 12, color: Colors.muted },
  summaryRow: { gap: 14, marginTop: 6 },
  summaryCol: { paddingBottom: 12 },
  summaryColDivider: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  summaryPeriod: { fontSize: 13, fontWeight: '700', color: Colors.text },
  summaryLine: { marginTop: 2 },
  accountLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  accIconWrap: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  accName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.text },
  accBalance: { fontSize: 13, fontWeight: '700' },
  trendValue: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 2 },
  trendLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, paddingHorizontal: 10 },
  trendLabel: { fontSize: 9, color: Colors.muted },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    ...Shadows.sm,
  },
  quickIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontSize: 11, fontWeight: '700', color: Colors.text, textAlign: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.tint,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
});
