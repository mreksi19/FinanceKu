import { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, StyleSheet, TextInput, View, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { AllocationRow } from '@/components/ui/allocation-row';
import { EmptyState } from '@/components/ui/empty-state';
import { MiIcon, ICON_CHOICES } from '@/components/ui/mi-icon';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { useAllocationStore } from '@/stores/allocationStore';

const PALETTE = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#0EA5E9', '#EC4899'];

export default function AlokasiScreen() {
  const db = useSQLiteContext();
  const { allocations, fetchAllocations, addAllocation, allocateFunds, deleteAllocation } =
    useAllocationStore();

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICON_CHOICES[3]);
  const [color, setColor] = useState(PALETTE[0]);

  const [fundTarget, setFundTarget] = useState<number | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  useFocusEffect(
    useCallback(() => {
      fetchAllocations(db);
    }, [db, fetchAllocations])
  );

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Nama pos anggaran wajib diisi');
      return;
    }
    await addAllocation(db, { name: name.trim(), icon, color });
    setName('');
    setShowAdd(false);
  };

  const handleAllocate = async () => {
    const amount = Number(fundAmount.replace(/[^0-9]/g, ''));
    if (!fundTarget || !amount) {
      Alert.alert('Masukkan nominal yang valid');
      return;
    }
    await allocateFunds(db, fundTarget, amount);
    setFundTarget(null);
    setFundAmount('');
  };

  const confirmDelete = (id: number) => {
    Alert.alert('Hapus kantong', 'Yakin ingin menghapus pos anggaran ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => deleteAllocation(db, id) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={20} color={Colors.text} />
        </Pressable>
        <ThemedText style={styles.title}>Atur Alokasi</ThemedText>
        <Pressable onPress={() => setShowAdd(true)} style={styles.addBtn}>
          <IconSymbol name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={allocations}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState icon="🗂️" title="Belum ada pos anggaran" subtitle="Tap + untuk membuat kantong baru" />
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <AllocationRow allocation={item} />
            <View style={styles.itemActions}>
              <Button
                title="Alokasikan Dana"
                size="sm"
                variant="secondary"
                onPress={() => setFundTarget(item.id)}
                style={{ flex: 1 }}
              />
              <Pressable style={styles.deleteBtn} onPress={() => confirmDelete(item.id)}>
                <IconSymbol name="trash.fill" size={16} color={Colors.red} />
              </Pressable>
            </View>
          </View>
        )}
      />

      {/* Modal: tambah kantong */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <ThemedText style={styles.sheetTitle}>Kantong Baru</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Nama pos anggaran (mis. Tabungan, Makan)"
              placeholderTextColor={Colors.placeholder}
              value={name}
              onChangeText={setName}
            />
            <ThemedText style={styles.fieldLabel}>Warna</ThemedText>
            <View style={styles.swatchRow}>
              {PALETTE.map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setColor(c)}
                  style={[
                    styles.swatch,
                    { backgroundColor: c },
                    color === c && styles.swatchActive,
                  ]}
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

      {/* Modal: alokasikan dana */}
      <Modal visible={fundTarget !== null} transparent animationType="slide" onRequestClose={() => setFundTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.sheet}>
            <ThemedText style={styles.sheetTitle}>Alokasikan Dana</ThemedText>
            <ThemedText style={styles.fieldLabel}>Nominal (Rp)</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
              value={fundAmount}
              onChangeText={setFundAmount}
            />
            <View style={styles.sheetActions}>
              <Button title="Batal" variant="secondary" onPress={() => setFundTarget(null)} style={{ flex: 1 }} />
              <Button title="Alokasikan" onPress={handleAllocate} style={{ flex: 1 }} />
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
    backgroundColor: Colors.orange,
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
  itemActions: { flexDirection: 'row', gap: 10, marginTop: 8, alignItems: 'center' },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.sm,
    backgroundColor: Colors.redBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
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
