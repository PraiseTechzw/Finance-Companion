import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface LineChartProps {
  data: number[];
  labels?: string[];
  width?: number;
  height?: number;
  color?: string;
}

export function LineChart({ data, labels, width = 300, height = 120, color }: LineChartProps) {
  const colors = useColors();
  const lineColor = color || colors.primary;

  if (!data.length) return <View style={{ width, height }} />;

  const pad = { top: 16, right: 16, bottom: labels ? 28 : 8, left: 8 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: pad.top + chartH - ((v - min) / range) * chartH,
  }));

  const pathD = points.map((p, i) =>
    i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`
  ).join(' ');

  const areaD = [
    `M ${points[0].x} ${pad.top + chartH}`,
    ...points.map(p => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${pad.top + chartH}`,
    'Z',
  ].join(' ');

  return (
    <Svg width={width} height={height}>
      <Path d={areaD} fill={lineColor + '18'} />
      <Path d={pathD} stroke={lineColor} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {labels && labels.map((label, i) => {
        const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
        return (
          <SvgText key={i} x={x} y={height - 4} textAnchor="middle" fill={colors.mutedForeground} fontSize={10}>
            {label}
          </SvgText>
        );
      })}
    </Svg>
  );
}
