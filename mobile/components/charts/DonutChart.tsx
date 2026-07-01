import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface DonutSlice {
  value: number;
  color: string;
  label: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSublabel?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function DonutChart({ data, size = 160, thickness = 28, centerLabel, centerSublabel }: DonutChartProps) {
  const colors = useColors();
  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  let currentAngle = 0;

  const slices = data.map((slice) => {
    const angle = (slice.value / total) * 360;
    const start = currentAngle;
    currentAngle += angle;
    return { ...slice, startAngle: start, endAngle: currentAngle - 0.5, angle };
  });

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {total === 0 ? (
            <Path
              d={slicePath(cx, cy, r, 0, 359.9)}
              stroke={colors.border}
              strokeWidth={thickness}
              fill="none"
            />
          ) : (
            slices.map((slice, i) =>
              slice.angle > 0.5 ? (
                <Path
                  key={i}
                  d={slicePath(cx, cy, r, slice.startAngle, slice.endAngle)}
                  stroke={slice.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeLinecap="round"
                />
              ) : null
            )
          )}
        </Svg>
        {centerLabel && (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>{centerLabel}</Text>
            {centerSublabel && <Text style={{ color: colors.mutedForeground, fontSize: 11 }}>{centerSublabel}</Text>}
          </View>
        )}
      </View>
      <View style={styles.legend}>
        {data.slice(0, 5).map((slice, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: slice.color }]} />
            <Text style={[styles.legendLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
              {slice.label} {Math.round((slice.value / total) * 100)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11 },
});
