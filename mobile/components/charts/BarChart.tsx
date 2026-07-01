import React from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface BarChartBar {
  value: number;
  label: string;
  color?: string;
}

interface BarChartProps {
  data: BarChartBar[];
  width?: number;
  height?: number;
}

export function BarChart({ data, width = 300, height = 140 }: BarChartProps) {
  const colors = useColors();
  if (!data.length) return <View style={{ width, height }} />;

  const pad = { top: 12, right: 8, bottom: 28, left: 8 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const max = Math.max(...data.map(d => d.value), 1);
  const barWidth = chartW / data.length * 0.6;
  const gap = chartW / data.length;

  return (
    <Svg width={width} height={height}>
      {data.map((bar, i) => {
        const barH = Math.max((bar.value / max) * chartH, 2);
        const x = pad.left + i * gap + (gap - barWidth) / 2;
        const y = pad.top + chartH - barH;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={bar.color || colors.primary}
              opacity={0.9}
            />
            <SvgText
              x={x + barWidth / 2}
              y={height - 6}
              textAnchor="middle"
              fill={colors.mutedForeground}
              fontSize={9}
            >
              {bar.label}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}
