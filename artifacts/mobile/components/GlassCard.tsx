import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  gradient?: readonly [string, string, ...string[]];
  padding?: number;
}

export function GlassCard({ children, style, gradient, padding = 16 }: GlassCardProps) {
  const colors = useColors();

  const defaultGradient: readonly [string, string] = colors.isDark
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']
    : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.75)'];

  return (
    <View style={[
      styles.wrapper,
      {
        borderColor: colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
        borderRadius: 20,
      },
      style
    ]}>
      <LinearGradient
        colors={gradient ?? defaultGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding }}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
