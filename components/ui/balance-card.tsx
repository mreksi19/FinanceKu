import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors, Radius, Shadows } from '@/constants/theme';
import { formatRupiah } from '@/utils/format';

interface BalanceCardProps {
  totalBalance: number;
  allocated: number;
  unallocated: number;
}

export function BalanceCard({ totalBalance, allocated, unallocated }: BalanceCardProps) {
  const pct = totalBalance > 0 ? Math.min(100, Math.round((allocated / totalBalance) * 100)) : 0;

  return (
    <View style={styles.card}>
      {/* decorative circles */}
      <View style={styles.circleA} />
      <View style={styles.circleB} />

      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <ThemedText style={styles.badgeText}>Total Saldo</ThemedText>
      </View>

      <ThemedText style={styles.amount}>{formatRupiah(totalBalance)}</ThemedText>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <View style={[styles.dot, { backgroundColor: Colors.green }]} />
            <ThemedText style={styles.statLabel}>Terdialokasikan</ThemedText>
          </View>
          <ThemedText style={styles.statValue}>
            {formatRupiah(allocated)} {totalBalance > 0 ? `(${pct}%)` : ''}
          </ThemedText>
        </View>
        <View style={styles.statCol}>
          <View style={styles.statLabelRow}>
            <View style={[styles.dot, { backgroundColor: '#60A5FA' }]} />
            <ThemedText style={styles.statLabel}>Belum Dialokasi</ThemedText>
          </View>
          <ThemedText style={styles.statValue}>{formatRupiah(unallocated)}</ThemedText>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLine} />
        <ThemedText style={styles.footerText}>FINANCEKU CARD</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.navyFrom,
    borderRadius: Radius.xl,
    padding: 22,
    paddingTop: 20,
    overflow: 'hidden',
    ...Shadows.md,
  },
  circleA: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#1E3A5F',
    opacity: 0.55,
  },
  circleB: {
    position: 'absolute',
    bottom: -70,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#16324A',
    opacity: 0.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
  },
  amount: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    marginTop: 14,
    letterSpacing: 0,
    includeFontPadding: false,
    lineHeight: 42,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginTop: 22,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    padding: 14,
  },
  statCol: {
    flex: 1,
    gap: 6,
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 8,
  },
  footerLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  footerText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
