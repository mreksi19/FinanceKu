import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MiIcon, ICON_CHOICES } from '@/components/ui/mi-icon';
import { EmptyState } from '@/components/ui/empty-state';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { formatRupiah, formatDateShort } from '@/utils/format';
import { useIncomeStore } from '@/stores/incomeStore';

const PALETTE = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9', '#EC4899'];

export default function PemasukanScreen() {
  const db = useSQLiteContext();
  const { sources, fetchSources, addSource, topUpSource, deleteSource } = useIncomeStore();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(PALETTE[0]);

  const [topUpTarget, setTopUpTarget] = useState<number | null>(null);
  const [topUpAmount, setTopUpAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchSources(db);
    }, [db, fetchSources])
  );

  const handleAdd = async () => {
    const value = Number(amount.replace(/[^0-9]/g, ''));
    if (!name.trim() || !value) {
      Alert.alert('Isi nama dan nominal dengan benar');
      return;
    }
    await addSource(db, { name: name.trim(), icon, color, amount: value });
    setName('');
    setAmount('');
    setShowAdd(false);
  };

  const handleTopUp = async () => {
    const value = Number(topUpAmount.replace(/[^0-9]/g, ''));
    if (!topUpTarget || !value) {
      Alert.alert('Masukkan nominal yang valid');
      return;
    }
    await topUpSource(db, topUpTarget, value, 'Tambah pemasukan');
    setTopUpTarget(null);
    setTopUpAmount('');
  };

  const confirmDelete = (id: number) => {
    Alert.alert('Hapus sumber pemasukan', 'Riwayat transaksi terkait tetap tersimpan. Lanjutkan?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteSource(db, id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={Colors.text} />
        </Pressable>
        <ThemedText style={styles.title}>Kelola Pemasukan</ThemedText>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <IconSymbol name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={sources}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="💰" title="Belum ada sumber pemasukan" subtitle="Tap + untuk menambahkan" />
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
                <MiIcon name={item.icon} size={20} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.itemName}>{item.name}</ThemedText>
                <ThemedText style={styles.itemDate}>Sejak {formatDateShort(item.created_at)}</ThemedText>
              </View>
              <ThemedText style={styles.itemAmount}>{formatRupiah(item.current_amount)}</ThemedText>
            </View>
            <View style={styles.itemActions}>
              <Button
                title="Tambah Dana"
                size="sm"
                variant="secondary"
                onPress={() => setTopUpTarget(item.id)}
                style={{ flex: 1 }}
              />
              <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
                <IconSymbol name="trash.fill" size={16} color={Colors.red} />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Modal tambah sumber */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <ThemedText style={styles.sheetTitle}>Sumber Pemasukan Baru</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nama sumber (mis. Gaji, Bonus, Freelance)"
              placeholderTextColor={Colors.placeholder}
              value={name}
              onChangeText={setName}
            />
            <ThemedText style={styles.fieldLabel}>Nominal Awal (Rp)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
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
              {ICON_CHOICES.map((ic) => (
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

      {/* Modal tambah dana */}
      <Modal visible={topUpTarget !== null} transparent animationType="slide" onRequestClose={() => setTopUpTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <ThemedText style={styles.sheetTitle}>Tambah Dana</ThemedText>
            <ThemedText style={styles.fieldLabel}>Nominal (Rp)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
            <View style={styles.sheetActions}>
              <Button title="Batal" variant="secondary" onPress={() => setTopUpTarget(null)} style={{ flex: 1 }} />
              <Button title="Tambahkan" onPress={handleTopUp} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  title: { fontSize: 18, fontWeight: '800', color: Colors.text },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 14,
    marginBottom: 12,
    ...Shadows.sm,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  itemDate: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  itemAmount: { fontSize: 15, fontWeight: '800', color: Colors.text },
  itemActions: { flexDirection: 'row', gap: 10, marginTop: 10, alignItems: 'center' },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.redBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 22,
  },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginTop: 16, marginBottom: 8 },
  swatchRow: { flexDirection: 'row', gap: 10 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: Colors.text },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 22, marginBottom: 8 },
});
