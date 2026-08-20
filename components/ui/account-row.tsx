import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MiIcon } from '@/components/ui/mi-icon';
import { Colors } from '@/constants/theme';
import { formatRupiah, formatDateShort } from '@/utils/format';
import type { Account } from '@/types/finance';

export function AccountRow({ account, onPress }: { account: Account; onPress?: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${account.color}22` }]}>
        <MiIcon name={account.icon} size={18} color={account.color} />
      </View>
      <View style={{ flex: 1 }}>
        <ThemedText style={styles.name}>{account.name}</ThemedText>
        <ThemedText style={styles.sub}>Terakhir diperbarui: {formatDateShort(account.updated_at)}</ThemedText>
      </View>
      <ThemedText style={[styles.balance, { color: account.balance < 0 ? Colors.red : Colors.green }]}>
        {formatRupiah(account.balance)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pressed: { opacity: 0.7 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: Colors.text },
  sub: { fontSize: 11, color: Colors.muted, marginTop: 2 },
  balance: { fontSize: 14, fontWeight: '800' },
});
