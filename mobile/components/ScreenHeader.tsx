import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useColorScheme } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: ReactNode;
  leftAction?: ReactNode;
  showBorder?: boolean;
}

export function ScreenHeader({ title, subtitle, rightAction, leftAction, showBorder = true }: ScreenHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const topPadding = Platform.OS === 'web' ? 20 : insets.top;
  const isIOS = Platform.OS === 'ios';

  const headerContent = (
    <View style={[
      styles.inner,
      { paddingTop: topPadding + 8, borderBottomColor: showBorder ? colors.border : 'transparent', borderBottomWidth: showBorder ? StyleSheet.hairlineWidth : 0 }
    ]}>
      <View style={styles.leftSlot}>{leftAction}</View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.rightSlot}>{rightAction}</View>
    </View>
  );

  if (isIOS) {
    return (
      <BlurView intensity={80} tint={isDark ? 'dark' : 'light'} style={[styles.container, { backgroundColor: 'transparent' }]}>
        {headerContent}
      </BlurView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {headerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 60,
  },
  leftSlot: { width: 44, alignItems: 'flex-start' },
  center: { flex: 1, alignItems: 'center' },
  rightSlot: { width: 44, alignItems: 'flex-end' },
  title: { fontSize: 17, fontWeight: '600', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, marginTop: 1 },
});
