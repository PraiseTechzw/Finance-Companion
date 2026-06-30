import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Platform, Alert, Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
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
    let title = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
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
  const scrollY = new Animated.Value(0);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const HEADER_HEIGHT = topPadding + 170;

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

  const filters: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: colors.foreground },
    { key: 'income', label: 'Income', color: colors.income },
    { key: 'expense', label: 'Expense', color: colors.expense },
    { key: 'transfer', label: 'Transfer', color: colors.accent },
  ];

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteTransaction(id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
    ]);
  };

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 50], outputRange: [0, 1], extrapolate: 'clamp' });

  const ListHeader = () => (
    <View style={{ paddingTop: HEADER_HEIGHT, paddingBottom: 8 }}>
      {/* Summary row */}
      <View style={[styles.summaryRow, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-up-circle" size={14} color={colors.income} />
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Income</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>{fmt(totalIncome)}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-down-circle" size={14} color={colors.expense} />
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]}>{fmt(totalExpense)}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Net</Text>
          <Text style={[styles.summaryValue, { color: totalIncome - totalExpense >= 0 ? colors.income : colors.expense }]}>
            {fmt(totalIncome - totalExpense)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderGroup = ({ item }: { item: { title: string; data: Transaction[] } }) => (
    <View>
      <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{item.title}</Text>
      <View style={[styles.groupCard, { backgroundColor: colors.card }]}>
        {item.data.map((txn, i) => (
          <View key={txn.id}>
            <View style={styles.txnRow}>
              <View style={{ flex: 1 }}>
                <TransactionRow transaction={txn} categories={categories} accounts={accounts} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
              </View>
              <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: colors.destructive + '22' }]} onPress={() => handleDelete(txn.id)}>
                <Ionicons name="trash-outline" size={14} color={colors.destructive} />
              </TouchableOpacity>
            </View>
            {i < item.data.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border, marginHorizontal: 16 }]} />}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: topPadding }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          )}
        </Animated.View>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.foreground }]}>Transactions</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/modals/add-transaction'); }}>
              <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={20} color={colors.primaryForeground} />
              </View>
            </TouchableOpacity>
          </View>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
            <TextInput style={[styles.searchInput, { color: colors.foreground }]} placeholder="Search transactions..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} />
            {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={colors.mutedForeground} /></TouchableOpacity>}
          </View>
          <View style={styles.filterRow}>
            {filters.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterPill, { backgroundColor: filter === f.key ? f.color + '20' : colors.card, borderColor: filter === f.key ? f.color : colors.border }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f.key); }}
              >
                <Text style={[styles.filterText, { color: filter === f.key ? f.color : colors.mutedForeground }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <FlatList
        data={groups}
        keyExtractor={g => g.title}
        renderItem={renderGroup}
        ListHeaderComponent={<ListHeader />}
        contentContainerStyle={{ paddingBottom: bottomPadding + 90 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        ListEmptyComponent={
          <View style={{ marginTop: 40 }}>
            <EmptyState icon="receipt-outline" title="No transactions found" subtitle="Add your first transaction to get started" />
          </View>
        }
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
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { paddingHorizontal: 16, paddingBottom: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingTop: 8 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', borderRadius: 16, padding: 14, justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 3 },
  summaryLabel: { fontSize: 10, fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '700' },
  summaryDivider: { width: 1 },
  groupTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginHorizontal: 20, marginTop: 16, marginBottom: 6 },
  groupCard: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden' },
  txnRow: { flexDirection: 'row', alignItems: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  divider: { height: StyleSheet.hairlineWidth },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8 },
});
