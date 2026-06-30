import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
}

export function ProgressBar({ progress, height = 6, color, backgroundColor, animated = true }: ProgressBarProps) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const barColor = color || (
    clampedProgress >= 1 ? colors.expense :
    clampedProgress >= 0.9 ? colors.warning :
    colors.primary
  );

  useEffect(() => {
    if (animated) {
      Animated.timing(anim, {
        toValue: clampedProgress,
        duration: 600,
        useNativeDriver: false,
      }).start();
    } else {
      anim.setValue(clampedProgress);
    }
  }, [clampedProgress]);

  return (
    <View style={[styles.track, { height, backgroundColor: backgroundColor || colors.border, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            height,
            borderRadius: height / 2,
            backgroundColor: barColor,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
  fill: {},
});
