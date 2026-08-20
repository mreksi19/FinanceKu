import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MiIcon } from '@/components/ui/mi-icon';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';
import type { IncomeSource } from '@/types/finance';

export function IncomeSourceCard({
  source,
  onPress,
}: {
  source: IncomeSource;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.topBar} />
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `${source.color}22` }]}>
          <MiIcon name={source.icon} size={18} color={source.color} />
        </View>
        <ThemedText style={styles.name}>{source.name}</ThemedText>
      </View>
      <ThemedText style={styles.amount}>{formatRupiah(source.current_amount)}</ThemedText>
      <ThemedText style={styles.sub}>Awal: {formatRupiah(source.initial_amount)}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  pressed: { opacity: 0.85 },
  topBar: { height: 4, backgroundColor: Colors.green },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  amount: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    paddingHorizontal: 16,
    marginTop: 10,
  },
  sub: {
    fontSize: 12,
    color: Colors.muted,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginTop: 4,
  },
});
