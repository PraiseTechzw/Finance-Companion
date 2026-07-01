import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Transaction, Category, Account } from '@/context/FinanceContext';

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  accounts: Account[];
  onPress?: () => void;
}

export function TransactionRow({ transaction, categories, accounts, onPress }: TransactionRowProps) {
  const colors = useColors();
  const category = categories.find(c => c.id === transaction.category_id);
  const account = accounts.find(a => a.id === transaction.account_id);

  const amountColor = transaction.type === 'income' ? colors.income :
    transaction.type === 'transfer' ? colors.accent : colors.expense;
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'transfer' ? '' : '-';

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', minimumFractionDigits: 2
  }).format(transaction.amount);

  const iconName = (category?.icon || 'ellipse-outline') as keyof typeof Ionicons.glyphMap;

  return (
    <TouchableOpacity style={[styles.row, { backgroundColor: colors.card }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBg, { backgroundColor: category?.color ? category.color + '22' : colors.secondary }]}>
        <Ionicons name={iconName} size={20} color={category?.color || colors.mutedForeground} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.description, { color: colors.foreground }]} numberOfLines={1}>
          {transaction.description || category?.name || 'Transaction'}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {account?.name || ''}
          {account && category ? ' · ' : ''}
          {category?.name || ''}
        </Text>
      </View>
      <Text style={[styles.amount, { color: amountColor }]}>
        {sign}{formatted}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, marginBottom: 2, borderRadius: 12 },
  iconBg: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1 },
  description: { fontSize: 15, fontWeight: '500', marginBottom: 2 },
  meta: { fontSize: 12 },
  amount: { fontSize: 15, fontWeight: '600' },
});
