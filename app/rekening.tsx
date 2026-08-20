import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AccountRow } from '@/components/ui/account-row';
import { MiIcon, ICON_CHOICES } from '@/components/ui/mi-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';
import { useAccountStore } from '@/stores/accountStore';

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9', '#EC4899'];

export default function RekeningScreen() {
  const db = useSQLiteContext();
  const { accounts, fetchAccounts, addAccount, adjustBalance, deleteAccount } = useAccountStore();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [icon, setIcon] = useState('account-balance-wallet');
  const [color, setColor] = useState(PALETTE[0]);

  const [adjustTarget, setAdjustTarget] = useState<number | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchAccounts(db);
    }, [db, fetchAccounts])
  );

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleAdd = async () => {
    const value = Number(balance.replace(/[^0-9-]/g, '')) || 0;
    if (!name.trim()) {
      Alert.alert('Nama rekening wajib diisi');
      return;
    }
    await addAccount(db, { name: name.trim(), icon, color, balance: value });
    setName('');
    setBalance('');
    setShowAdd(false);
  };

  const handleAdjust = async (direction: 1 | -1) => {
    const value = Number(adjustAmount.replace(/[^0-9]/g, ''));
    if (!adjustTarget || !value) {
      Alert.alert('Masukkan nominal yang valid');
      return;
    }
    await adjustBalance(db, adjustTarget, value * direction);
    setAdjustTarget(null);
    setAdjustAmount('');
  };

  const confirmDelete = (id: number) => {
    Alert.alert('Hapus rekening', 'Yakin ingin menghapus rekening ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteAccount(db, id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={Colors.text} />
        </Pressable>
        <ThemedText style={styles.title}>Rekening</ThemedText>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <IconSymbol name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.totalCard}>
        <ThemedText style={styles.totalLabel}>Total Saldo Semua Rekening</ThemedText>
        <ThemedText style={styles.totalValue}>{formatRupiah(totalBalance)}</ThemedText>
      </View>

      <FlatList
        data={accounts}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="🏦" title="Belum ada rekening" subtitle="Tap + untuk menambahkan Dompet/Bank" />
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <AccountRow account={item} />
            <View style={styles.itemActions}>
              <Button
                title="+ Dana"
                size="sm"
                variant="secondary"
                onPress={() => {
                  setAdjustTarget(item.id);
                }}
                style={{ flex: 1 }}
              />
              <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
                <IconSymbol name="trash.fill" size={16} color={Colors.red} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <ThemedText style={styles.sheetTitle}>Rekening Baru</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nama rekening (mis. Dompet, BCA)"
              placeholderTextColor={Colors.placeholder}
              value={name}
              onChangeText={setName}
            />
            <ThemedText style={styles.fieldLabel}>Saldo Awal (Rp)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
              value={balance}
              onChangeText={setBalance}
            />
            <ThemedText style={styles.fieldLabel}>Warna</ThemedText>
            <View style={styles.swatchRow}>
              {PALETTE.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.swatch, { backgroundColor: c }, color === c && styles.swatchActive]}
                />
              ))}
            </View>
            <ThemedText style={styles.fieldLabel}>Ikon</ThemedText>
            <View style={styles.iconRow}>
              {['account-balance-wallet', 'account-balance', 'credit-card', 'savings', 'payments'].map((ic) => (
                <Pressable
                  key={ic}
                  onPress={() => setIcon(ic)}
                  style={[styles.iconChoice, icon === ic && { backgroundColor: `${color}22`, borderColor: color }]}
                >
                  <MiIcon name={ic} size={18} color={icon === ic ? color : Colors.textSecondary} />
                </Pressable>
              ))}
            </View>
            <View style={styles.sheetActions}>
              <Button title="Batal" variant="secondary" onPress={() => setShowAdd(false)} style={{ flex: 1 }} />
              <Button title="Simpan" onPress={handleAdd} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={adjustTarget !== null} transparent animationType="slide" onRequestClose={() => setAdjustTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <ThemedText style={styles.sheetTitle}>Sesuaikan Saldo</ThemedText>
            <ThemedText style={styles.fieldLabel}>Nominal (Rp)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
              value={adjustAmount}
              onChangeText={setAdjustAmount}
            />
            <View style={styles.sheetActions}>
              <Button title="- Kurangi" variant="secondary" onPress={() => handleAdjust(-1)} style={{ flex: 1 }} />
              <Button title="+ Tambah" onPress={() => handleAdjust(1)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingBottom: 12 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.blue, alignItems: 'center', justifyContent: 'center' },
  totalCard: { marginHorizontal: 20, backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 16, marginBottom: 16, ...Shadows.sm },
  totalLabel: { fontSize: 11, color: Colors.muted, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', color: Colors.text, marginTop: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  itemCard: { backgroundColor: Colors.card, borderRadius: Radius.lg, padding: 14, marginBottom: 12, ...Shadows.sm },
  itemActions: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' },
  deleteBtn: { width: 38, height: 38, borderRadius: Radius.sm, backgroundColor: Colors.redBg, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.card, borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: 22 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: Colors.text },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 16, marginBottom: 8 },
  swatchRow: { flexDirection: 'row', gap: 10 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: Colors.text },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconChoice: { width: 40, height: 40, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 8 },
});
