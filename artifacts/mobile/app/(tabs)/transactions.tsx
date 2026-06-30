import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Platform, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, Transaction } from '@/context/FinanceContext';
import { TransactionRow } from '@/components/TransactionRow';
import { EmptyState } from '@/components/EmptyState';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function groupByDate(txns: Transaction[]): { title: string; data: Transaction[] }[] {
  const groups: Record<string, Transaction[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  txns.forEach(t => {
    const d = new Date(t.date);
    const key = d.toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  return Object.entries(groups).map(([key, items]) => {
    const d = new Date(key);
    let title = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    if (d.toDateString() === today.toDateString()) title = 'Today';
    else if (d.toDateString() === yesterday.toDateString()) title = 'Yesterday';
    return { title, data: items };
  });
}

type FilterType = 'all' | 'income' | 'expense' | 'transfer';

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, accounts, categories, deleteTransaction } = useFinance();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let txns = transactions;
    if (filter !== 'all') txns = txns.filter(t => t.type === filter);
    if (search) {
      const q = search.toLowerCase();
      txns = txns.filter(t =>
        t.description?.toLowerCase().includes(q) ||
        categories.find(c => c.id === t.category_id)?.name.toLowerCase().includes(q)
      );
    }
    return txns;
  }, [transactions, filter, search, categories]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'income', label: 'Income' },
    { key: 'expense', label: 'Expense' },
    { key: 'transfer', label: 'Transfer' },
  ];

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete Transaction', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTransaction(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);
  };

  const renderItem = ({ item }: { item: { title: string; data: Transaction[] } }) => (
    <View>
      <View style={[styles.groupHeader, { backgroundColor: colors.background }]}>
        <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{item.title}</Text>
      </View>
      {item.data.map(txn => (
        <View key={txn.id} style={styles.swipeRow}>
          <TransactionRow
            transaction={txn}
            categories={categories}
            accounts={accounts}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          />
          <TouchableOpacity
            style={[styles.deleteBtn, { backgroundColor: colors.destructive }]}
            onPress={() => handleDelete(txn.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Transactions</Text>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {filters.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterPill, {
                backgroundColor: filter === f.key ? colors.primary : colors.card,
                borderColor: filter === f.key ? colors.primary : colors.border,
              }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f.key); }}
            >
              <Text style={[styles.filterLabel, { color: filter === f.key ? colors.primaryForeground : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Period totals */}
        <View style={[styles.totals, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.totalItem}>
            <Ionicons name="arrow-up" size={12} color={colors.income} />
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Income</Text>
            <Text style={[styles.totalAmount, { color: colors.income }]}>{fmt(totalIncome)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalItem}>
            <Ionicons name="arrow-down" size={12} color={colors.expense} />
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Expenses</Text>
            <Text style={[styles.totalAmount, { color: colors.expense }]}>{fmt(totalExpense)}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.totalItem}>
            <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Net</Text>
            <Text style={[styles.totalAmount, { color: totalIncome - totalExpense >= 0 ? colors.income : colors.expense }]}>
              {fmt(totalIncome - totalExpense)}
            </Text>
          </View>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={groups}
        keyExtractor={g => g.title}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: bottomPadding + 90 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title="No transactions found" subtitle="Add a transaction to get started" />
        }
        scrollEnabled={!!filtered.length}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPadding + 80 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/modals/add-transaction'); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterLabel: { fontSize: 12, fontWeight: '500' },
  totals: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 12, justifyContent: 'space-around', marginBottom: 4 },
  totalItem: { alignItems: 'center', gap: 3 },
  totalLabel: { fontSize: 10 },
  totalAmount: { fontSize: 13, fontWeight: '600' },
  divider: { width: 1 },
  groupHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  groupTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  swipeRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 16 },
  deleteBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
