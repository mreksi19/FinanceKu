import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { MiIcon } from '@/components/ui/mi-icon';
import { Colors } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';
import type { Allocation } from '@/types/finance';

export function AllocationRow({
  allocation,
  onPress,
}: {
  allocation: Allocation;
  onPress?: () => void;
}) {
  const pct =
    allocation.budget_amount > 0
      ? Math.min(100, Math.round((allocation.spent_amount / allocation.budget_amount) * 100))
      : 0;
  const remaining = allocation.budget_amount - allocation.spent_amount;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={[styles.iconWrap, { backgroundColor: `${allocation.color}22` }]}>
            <MiIcon name={allocation.icon} size={16} color={allocation.color} />
          </View>
          <ThemedText style={styles.name}>{allocation.name}</ThemedText>
        </View>
        <ThemedText style={[styles.amount, { color: allocation.color }]}>
          {formatRupiah(allocation.budget_amount)}
        </ThemedText>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${pct}%`, backgroundColor: allocation.color }]}
        />
      </View>
      <ThemedText style={styles.sub}>
        Terpakai {formatRupiah(allocation.spent_amount)} · Sisa {formatRupiah(remaining)}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pressed: { opacity: 0.7 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
  },
  track: {
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    marginTop: 10,
    marginLeft: 42,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  sub: {
    fontSize: 11,
    color: Colors.muted,
    marginTop: 6,
    marginLeft: 42,
  },
});
