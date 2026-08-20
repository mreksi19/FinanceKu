import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

interface DonutRingProps {
  income: number;
  expense: number;
  size?: number;
  strokeWidth?: number;
}

// Donut sederhana: proporsi income (hijau) vs expense (merah) dari total keduanya
export function DonutRing({ income, expense, size = 64, strokeWidth = 9 }: DonutRingProps) {
  const total = income + expense;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const incomeRatio = total > 0 ? income / total : 0.5;
  const incomeLength = circumference * incomeRatio;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.redBg}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.red}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={0}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.green}
          strokeWidth={strokeWidth}
          strokeDasharray={`${incomeLength} ${circumference}`}
          strokeDashoffset={0}
          strokeLinecap="butt"
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
}

export const styles = StyleSheet.create({});
