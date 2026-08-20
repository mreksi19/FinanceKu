import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

interface BarMiniChartProps {
  data: { label: string; value: number }[];
  color?: string;
  formatValue?: (n: number) => string;
}

export function BarMiniChart({ data, color = Colors.red, formatValue }: BarMiniChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.row}>
      {data.map((d, i) => {
        const heightPct = Math.max(4, Math.round((d.value / max) * 100));
        return (
          <View key={i} style={styles.col}>
            {d.value > 0 && (
              <ThemedText style={styles.value} numberOfLines={1}>
                {formatValue ? formatValue(d.value) : d.value}
              </ThemedText>
            )}
            <View style={styles.track}>
              <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: color }]} />
            </View>
            <ThemedText style={styles.label}>{d.label}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', height: 130, gap: 6 },
  col: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  value: { fontSize: 9, color: Colors.textSecondary, marginBottom: 3, fontWeight: '600' },
  track: { width: 18, height: 80, justifyContent: 'flex-end', backgroundColor: Colors.borderLight, borderRadius: 6, overflow: 'hidden' },
  bar: { width: '100%', borderRadius: 6 },
  label: { fontSize: 9, color: Colors.muted, marginTop: 6 },
});
