import { Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Radius, Shadows } from '@/constants/theme';

interface QuickActionCardProps {
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  accentColor: string;
  onPress: () => void;
}

export function QuickActionCard({
  title,
  subtitle,
  icon,
  iconBg,
  iconColor,
  accentColor,
  onPress,
}: QuickActionCardProps) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.topBar, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <IconSymbol name={icon as any} size={22} color={iconColor} />
        </View>
        <ThemedText style={styles.title}>{title}</ThemedText>
        <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>
        <View style={styles.arrowWrap}>
          <IconSymbol name="chevron.right" size={16} color={Colors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  pressed: { opacity: 0.85 },
  topBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 16,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  arrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
});
