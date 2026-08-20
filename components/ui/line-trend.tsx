import { View } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { Colors } from '@/constants/theme';

interface LineTrendProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function LineTrend({ values, width = 320, height = 120, color = Colors.tint }: LineTrendProps) {
  if (values.length === 0) {
    return <View style={{ width, height }} />;
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const padding = 10;
  const stepX = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = padding + i * stepX;
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <Svg width={width} height={height}>
      <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={Colors.border} strokeWidth={1} />
      <Polyline points={polylineStr} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
      ))}
    </Svg>
  );
}
