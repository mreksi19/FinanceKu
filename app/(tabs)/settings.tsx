import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';

export default function SettingsScreen() {
  const db = useSQLiteContext();
  const { displayName, loadSettings, saveSettings } = useSettingsStore();
  const [name, setName] = useState('');

  useEffect(() => {
    loadSettings(db).then(() => {});
  }, [db, loadSettings]);

  useEffect(() => {
    setName(displayName);
  }, [displayName]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nama tidak boleh kosong');
      return;
    }
    await saveSettings(db, name.trim());
    Alert.alert('Tersimpan', 'Pengaturan berhasil disimpan.');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedText style={styles.title}>Pengaturan</ThemedText>
      <ThemedText style={styles.subtitle}>Kelola profil FinanceKu kamu</ThemedText>

      <View style={styles.card}>
        <ThemedText style={styles.label}>Nama Tampilan</ThemedText>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nama kamu"
          placeholderTextColor={Colors.placeholder}
        />
        <Button title="Simpan" onPress={handleSave} style={{ marginTop: 14 }} />
      </View>

      <View style={styles.card}>
        <ThemedText style={styles.label}>Tentang</ThemedText>
        <ThemedText style={styles.aboutText}>
          FinanceKu — Catat. Kelola. Bertumbuh. Aplikasi pencatatan keuangan pribadi berbasis
          sistem amplop digital (kantong alokasi) agar setiap rupiah punya tujuan.
        </ThemedText>
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: 16,
    marginBottom: 16,
    ...Shadows.sm,
  },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  aboutText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
