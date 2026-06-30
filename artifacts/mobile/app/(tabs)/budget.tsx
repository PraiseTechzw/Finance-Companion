import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { CircularProgress } from '@/components/CircularProgress';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

type TabType = 'overview' | 'bills' | 'recurring';

export default function BudgetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, categories, budgets, bills, toggleBillPaid } = useFinance();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<TabType>('overview');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const monthTxns = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'expense';
  }), [transactions, month, year]);

  const categorySpend = useMemo(() => {
    const spend: Record<string, number> = {};
    monthTxns.forEach(t => { if (t.category_id) spend[t.category_id] = (spend[t.category_id] || 0) + t.amount; });
    return spend;
  }, [monthTxns]);

  const budgetItems = useMemo(() => {
    return budgets
      .filter(b => b.month === month && b.year === year)
      .map(b => {
        const cat = categories.find(c => c.id === b.category_id);
        const spent = categorySpend[b.category_id] || 0;
        return { ...b, category: cat, spent };
      })
      .filter(b => b.category);
  }, [budgets, categories, categorySpend, month, year]);

  const totalBudget = budgetItems.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const overallProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const upcomingBills = bills.filter(b => !b.is_paid);
  const paidBills = bills.filter(b => b.is_paid);

  const handleTogglePaid = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleBillPaid(id);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: topPadding + 8, paddingBottom: bottomPadding + 90 }}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Budget</Text>
          <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/bills'); }}>
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Month Selector */}
        <View style={[styles.monthSelector, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-back" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthName, { color: colors.foreground }]}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Budget Health */}
        <View style={[styles.healthCard, { backgroundColor: colors.card }]}>
          <CircularProgress
            progress={overallProgress}
            size={110}
            strokeWidth={12}
            label={`${Math.round(overallProgress * 100)}%`}
            sublabel="Used"
          />
          <View style={styles.healthStats}>
            <Text style={[styles.healthTitle, { color: colors.foreground }]}>Budget Health</Text>
            <Text style={[styles.healthSub, { color: colors.mutedForeground }]}>
              {fmt(totalSpent)} of {fmt(totalBudget)} spent
            </Text>
            <View style={[styles.healthPill, { backgroundColor: overallProgress >= 1 ? colors.expense + '22' : overallProgress >= 0.8 ? colors.warning + '22' : colors.income + '22' }]}>
              <Text style={[styles.healthPillText, { color: overallProgress >= 1 ? colors.expense : overallProgress >= 0.8 ? colors.warning : colors.income }]}>
                {overallProgress >= 1 ? 'Over budget' : overallProgress >= 0.8 ? 'Approaching limit' : 'On track'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={[styles.tabs, { backgroundColor: colors.card }]}>
          {(['overview', 'bills', 'recurring'] as TabType[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, { backgroundColor: tab === t ? colors.primary : 'transparent' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            >
              <Text style={[styles.tabLabel, { color: tab === t ? colors.primaryForeground : colors.mutedForeground }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <View style={styles.section}>
            {budgetItems.length === 0 ? (
              <EmptyState icon="bar-chart-outline" title="No budgets set" subtitle="Set category budgets to track spending" />
            ) : (
              budgetItems.map(item => {
                const progress = item.limit_amount > 0 ? item.spent / item.limit_amount : 0;
                const iconName = (item.category?.icon || 'ellipse') as any;
                return (
                  <View key={item.id} style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.catIcon, { backgroundColor: item.category?.color ? item.category.color + '22' : colors.secondary }]}>
                      <Ionicons name={iconName} size={18} color={item.category?.color || colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.budgetRow}>
                        <Text style={[styles.catName, { color: colors.foreground }]}>{item.category?.name}</Text>
                        <Text style={[styles.budgetAmounts, { color: colors.mutedForeground }]}>
                          {fmt(item.spent)} / {fmt(item.limit_amount)}
                        </Text>
                      </View>
                      <ProgressBar progress={progress} height={6} />
                      <Text style={[styles.budgetPct, { color: progress >= 1 ? colors.expense : progress >= 0.9 ? colors.warning : colors.mutedForeground }]}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Bills Tab */}
        {tab === 'bills' && (
          <View style={styles.section}>
            {bills.length === 0 ? (
              <EmptyState icon="calendar-outline" title="No bills added" subtitle="Track your recurring bills here" />
            ) : (
              <>
                {upcomingBills.length > 0 && (
                  <Text style={[styles.billGroupTitle, { color: colors.mutedForeground }]}>UPCOMING</Text>
                )}
                {upcomingBills.map(bill => (
                  <View key={bill.id} style={[styles.billCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.billDot, { backgroundColor: colors.warning + '22' }]}>
                      <Ionicons name="calendar-outline" size={16} color={colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billName, { color: colors.foreground }]}>{bill.name}</Text>
                      <Text style={[styles.billDue, { color: colors.mutedForeground }]}>Due: day {bill.due_day} · {bill.recurrence}</Text>
                    </View>
                    <Text style={[styles.billAmount, { color: colors.expense }]}>{fmt(bill.amount)}</Text>
                    <TouchableOpacity
                      style={[styles.paidBtn, { backgroundColor: colors.secondary }]}
                      onPress={() => handleTogglePaid(bill.id)}
                    >
                      <Ionicons name="checkmark" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
                {paidBills.length > 0 && (
                  <>
                    <Text style={[styles.billGroupTitle, { color: colors.mutedForeground, marginTop: 16 }]}>PAID</Text>
                    {paidBills.map(bill => (
                      <View key={bill.id} style={[styles.billCard, { backgroundColor: colors.card, opacity: 0.5 }]}>
                        <View style={[styles.billDot, { backgroundColor: colors.income + '22' }]}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.income} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.billName, { color: colors.foreground }]}>{bill.name}</Text>
                        </View>
                        <Text style={[styles.billAmount, { color: colors.mutedForeground }]}>{fmt(bill.amount)}</Text>
                        <TouchableOpacity
                          style={[styles.paidBtn, { backgroundColor: colors.income + '22' }]}
                          onPress={() => handleTogglePaid(bill.id)}
                        >
                          <Ionicons name="refresh" size={14} color={colors.income} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </>
                )}
              </>
            )}
          </View>
        )}

        {/* Recurring Tab */}
        {tab === 'recurring' && (
          <View style={styles.section}>
            <EmptyState icon="repeat-outline" title="Recurring transactions" subtitle="Coming soon — set up recurring income and expense templates" />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 12, marginBottom: 16 },
  monthName: { fontSize: 15, fontWeight: '600' },
  healthCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 16 },
  healthStats: { flex: 1 },
  healthTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  healthSub: { fontSize: 13, marginBottom: 10 },
  healthPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  healthPillText: { fontSize: 12, fontWeight: '600' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, padding: 4, marginBottom: 16 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  tabLabel: { fontSize: 13, fontWeight: '500' },
  section: { paddingHorizontal: 16 },
  budgetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 10 },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catName: { fontSize: 14, fontWeight: '500' },
  budgetAmounts: { fontSize: 12 },
  budgetPct: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  billGroupTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  billCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 8 },
  billDot: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  billName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  billDue: { fontSize: 12 },
  billAmount: { fontSize: 14, fontWeight: '600' },
  paidBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
