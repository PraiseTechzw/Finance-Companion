import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface MoneyTextProps {
  amount: number;
  type?: 'income' | 'expense' | 'neutral';
  style?: TextStyle;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function MoneyText({ amount, type = 'neutral', style, showSign = false, size = 'md' }: MoneyTextProps) {
  const colors = useColors();

  const color = type === 'income' ? colors.income :
    type === 'expense' ? colors.expense :
    colors.foreground;

  const fontSize = size === 'sm' ? 13 : size === 'md' ? 16 : size === 'lg' ? 22 : 32;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));

  const prefix = showSign ? (type === 'income' ? '+' : type === 'expense' ? '-' : '') : '';

  return (
    <Text style={[{ color, fontSize, fontWeight: '600' }, style]}>
      {prefix}{formatted}
    </Text>
  );
}
