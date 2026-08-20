import { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MiIcon } from '@/components/ui/mi-icon';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { useAllocationStore } from '@/stores/allocationStore';
import { useAccountStore } from '@/stores/accountStore';
import { useTransactionStore } from '@/stores/transactionStore';

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransaksiScreen() {
  const db = useSQLiteContext();
  const { allocations, fetchAllocations } = useAllocationStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { addExpense, fetchSummary, fetchTransactions, fetchLast7Days, fetchBalanceTrend, fetchMonthSummaries } =
    useTransactionStore();

  const [amount, setAmount] = useState('');
  const [payee, setPayee] = useState('');
  const [note, setNote] = useState('');
  const [dateStr, setDateStr] = useState(todayISODate());
  const [allocationId, setAllocationId] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(null);
  const [isCleared, setIsCleared] = useState(true);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchAllocations(db);
      fetchAccounts(db).then(() => {
        const current = useAccountStore.getState().accounts;
        if (current.length > 0) setAccountId((prev) => prev ?? current[0].id);
      });
    }, [db, fetchAllocations, fetchAccounts])
  );

  const handleSave = async () => {
    const value = Number(amount.replace(/[^0-9]/g, ''));
    if (!value) {
      Alert.alert('Masukkan nominal pengeluaran');
      return;
    }
    setSaving(true);
    try {
      await addExpense(db, {
        amount: value,
        note: note.trim() || 'Pengeluaran',
        payee: payee.trim(),
        allocationId,
        accountId,
        txDate: `${dateStr}T${new Date().toTimeString().slice(0, 8)}`,
        isCleared,
      });
      await Promise.all([
        fetchSummary(db),
        fetchTransactions(db),
        fetchAllocations(db),
        fetchAccounts(db),
        fetchLast7Days(db),
        fetchBalanceTrend(db),
        fetchMonthSummaries(db, 2),
      ]);
      router.back();
    } finally {
      setSaving(false);
    }
  };

  const shiftDate = (days: number) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    setDateStr(d.toISOString().slice(0, 10));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={Colors.text} />
        </Pressable>
        <ThemedText style={styles.title}>Catat Pengeluaran</ThemedText>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText style={styles.fieldLabel}>Nominal (Rp)</ThemedText>
        <TextInput
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor={Colors.placeholder}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          autoFocus
        />

        <ThemedText style={styles.fieldLabel}>Kepada / Untuk (Opsional)</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="mis. SPBU Pertamina"
          placeholderTextColor={Colors.placeholder}
          value={payee}
          onChangeText={setPayee}
        />

        <ThemedText style={styles.fieldLabel}>Catatan</ThemedText>
        <TextInput
          style={styles.input}
          placeholder="Untuk apa pengeluaran ini?"
          placeholderTextColor={Colors.placeholder}
          value={note}
          onChangeText={setNote}
        />

        <ThemedText style={styles.fieldLabel}>Tanggal</ThemedText>
        <View style={styles.dateRow}>
          <Pressable style={styles.dateBtn} onPress={() => shiftDate(-1)}>
            <IconSymbol name="chevron.left" size={16} color={Colors.textSecondary} />
          </Pressable>
          <View style={styles.dateDisplay}>
            <ThemedText style={styles.dateText}>{dateStr}</ThemedText>
          </View>
          <Pressable style={styles.dateBtn} onPress={() => setDateStr(todayISODate())}>
            <ThemedText style={styles.dateTodayText}>Hari ini</ThemedText>
          </Pressable>
        </View>

        <ThemedText style={styles.fieldLabel}>Rekening</ThemedText>
        <View style={styles.allocGrid}>
          {accounts.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAccountId(a.id)}
              style={[
                styles.allocChip,
                accountId === a.id && { backgroundColor: a.color, borderColor: a.color },
              ]}
            >
              <MiIcon name={a.icon} size={14} color={accountId === a.id ? '#fff' : a.color} />
              <ThemedText style={[styles.allocChipText, accountId === a.id && styles.allocChipTextActive]}>
                {a.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.fieldLabel}>Ambil dari kantong</ThemedText>
        <View style={styles.allocGrid}>
          <Pressable
            onPress={() => setAllocationId(null)}
            style={[styles.allocChip, allocationId === null && styles.allocChipActive]}
          >
            <ThemedText style={[styles.allocChipText, allocationId === null && styles.allocChipTextActive]}>
              Tanpa Kantong
            </ThemedText>
          </Pressable>
          {allocations.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => setAllocationId(a.id)}
              style={[
                styles.allocChip,
                allocationId === a.id && { backgroundColor: a.color, borderColor: a.color },
              ]}
            >
              <MiIcon name={a.icon} size={14} color={allocationId === a.id ? '#fff' : a.color} />
              <ThemedText style={[styles.allocChipText, allocationId === a.id && styles.allocChipTextActive]}>
                {a.name}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={styles.clearedRow}>
          <View>
            <ThemedText style={styles.clearedTitle}>Dicentang</ThemedText>
            <ThemedText style={styles.clearedSub}>Tandai transaksi sudah diverifikasi</ThemedText>
          </View>
          <Switch
            value={isCleared}
            onValueChange={setIsCleared}
            trackColor={{ false: Colors.border, true: Colors.tint }}
            thumbColor="#fff"
          />
        </View>

        <Button
          title={saving ? 'Menyimpan...' : 'Simpan Pengeluaran'}
          onPress={handleSave}
          disabled={saving}
          style={{ marginTop: 24 }}
          size="lg"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 18, marginBottom: 8 },
  amountInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: 18,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    includeFontPadding: false,
    ...Shadows.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
  },
  dateDisplay: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateText: { fontSize: 14, fontWeight: '700', color: Colors.text },
  dateTodayText: { fontSize: 11, fontWeight: '700', color: Colors.tint },
  allocGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  allocChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  allocChipActive: { backgroundColor: Colors.text, borderColor: Colors.text },
  allocChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  allocChipTextActive: { color: '#fff' },
  clearedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 18,
    ...Shadows.sm,
  },
  clearedTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
  clearedSub: { fontSize: 11, color: Colors.muted, marginTop: 2 },
});
