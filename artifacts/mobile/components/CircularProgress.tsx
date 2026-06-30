import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';

interface CircularProgressProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}

export function CircularProgress({ progress, size = 80, strokeWidth = 8, color, label, sublabel }: CircularProgressProps) {
  const colors = useColors();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - clampedProgress);
  const barColor = color || (
    clampedProgress >= 1 ? colors.income :
    clampedProgress >= 0.9 ? colors.warning :
    colors.primary
  );

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={barColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {label && (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.foreground, fontSize: size > 80 ? 18 : 13, fontWeight: '700' }}>{label}</Text>
          {sublabel && <Text style={{ color: colors.mutedForeground, fontSize: 10 }}>{sublabel}</Text>}
        </View>
      )}
    </View>
  );
}
