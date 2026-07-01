import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

type TabType = 'overview' | 'bills' | 'subscriptions';

export default function BudgetScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, categories, budgets, bills, toggleBillPaid } = useFinance();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab, setTab] = useState<TabType>('overview');
  const scrollY = new Animated.Value(0);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const HEADER_HEIGHT = topPadding + 160;

  const monthName = new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthTxns = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'expense';
  }), [transactions, month, year]);

  const categorySpend = useMemo(() => {
    const spend: Record<string, number> = {};
    monthTxns.forEach(t => { if (t.category_id) spend[t.category_id] = (spend[t.category_id] || 0) + t.amount; });
    return spend;
  }, [monthTxns]);

  const budgetItems = useMemo(() => budgets
    .filter(b => b.month === month && b.year === year)
    .map(b => { const cat = categories.find(c => c.id === b.category_id); const spent = categorySpend[b.category_id] || 0; return { ...b, category: cat, spent }; })
    .filter(b => b.category), [budgets, categories, categorySpend, month, year]);

  const totalBudget = budgetItems.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
  const overallProgress = totalBudget > 0 ? totalSpent / totalBudget : 0;

  const unpaidBills = bills.filter(b => !b.is_paid);
  const paidBills = bills.filter(b => b.is_paid);
  const totalBills = bills.reduce((s, b) => s + (b.recurrence === 'monthly' ? b.amount : b.recurrence === 'yearly' ? b.amount / 12 : b.amount * 4.33), 0);

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' });

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
            <Text style={[styles.title, { color: colors.foreground }]}>Budget</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/bills'); }}>
              <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="add" size={20} color={colors.primaryForeground} />
              </View>
            </TouchableOpacity>
          </View>
          {/* Month Selector */}
          <View style={[styles.monthSelector, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-back" size={20} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.monthName, { color: colors.foreground }]}>{monthName}</Text>
            <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Ionicons name="chevron-forward" size={20} color={colors.foreground} />
            </TouchableOpacity>
          </View>
          {/* Tab Bar */}
          <View style={[styles.tabs, { backgroundColor: colors.card }]}>
            {(['overview', 'bills', 'subscriptions'] as TabType[]).map(t => (
              <TouchableOpacity key={t} style={[styles.tabBtn, { backgroundColor: tab === t ? colors.primary : 'transparent' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}>
                <Text style={[styles.tabLabel, { color: tab === t ? colors.primaryForeground : colors.mutedForeground }]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 8, paddingBottom: bottomPadding + 90 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {/* Budget Health Card */}
        <View style={[styles.healthCard, { backgroundColor: colors.card, marginHorizontal: 16, marginBottom: 16 }]}>
          <LinearGradient colors={overallProgress >= 1 ? ['#EF444420', 'transparent'] : overallProgress >= 0.8 ? ['#F59E0B20', 'transparent'] : ['#10B98120', 'transparent']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          <CircularProgress progress={overallProgress} size={100} strokeWidth={10} label={`${Math.round(overallProgress * 100)}%`} sublabel="Used" />
          <View style={styles.healthStats}>
            <Text style={[styles.healthTitle, { color: colors.foreground }]}>Budget Health</Text>
            <Text style={[styles.healthSub, { color: colors.mutedForeground }]}>{fmt(totalSpent)} of {fmt(totalBudget)}</Text>
            <View style={[styles.statusPill, { backgroundColor: overallProgress >= 1 ? colors.expense + '22' : overallProgress >= 0.8 ? colors.warning + '22' : colors.income + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: overallProgress >= 1 ? colors.expense : overallProgress >= 0.8 ? colors.warning : colors.income }]} />
              <Text style={[styles.statusText, { color: overallProgress >= 1 ? colors.expense : overallProgress >= 0.8 ? colors.warning : colors.income }]}>
                {overallProgress >= 1 ? 'Over budget' : overallProgress >= 0.8 ? 'Nearing limit' : 'On track'}
              </Text>
            </View>
          </View>
        </View>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <View style={{ paddingHorizontal: 16 }}>
            {budgetItems.length === 0 ? (
              <EmptyState icon="bar-chart-outline" title="No budgets this month" subtitle="Set category limits to track your spending" />
            ) : (
              budgetItems.map(item => {
                const progress = item.limit_amount > 0 ? item.spent / item.limit_amount : 0;
                const remaining = Math.max(0, item.limit_amount - item.spent);
                return (
                  <View key={item.id} style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.catIconBg, { backgroundColor: item.category?.color ? item.category.color + '22' : colors.secondary }]}>
                      <Ionicons name={(item.category?.icon || 'ellipse') as any} size={18} color={item.category?.color || colors.mutedForeground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.budgetCardTop}>
                        <Text style={[styles.catName, { color: colors.foreground }]}>{item.category?.name}</Text>
                        <Text style={[styles.budgetPct, { color: progress >= 1 ? colors.expense : progress >= 0.9 ? colors.warning : colors.primary }]}>
                          {Math.round(progress * 100)}%
                        </Text>
                      </View>
                      <ProgressBar progress={progress} height={6} color={item.category?.color} />
                      <View style={styles.budgetCardBottom}>
                        <Text style={[styles.budgetSpent, { color: colors.mutedForeground }]}>{fmt(item.spent)} spent</Text>
                        <Text style={[styles.budgetRemaining, { color: remaining === 0 ? colors.expense : colors.mutedForeground }]}>
                          {remaining === 0 ? 'Limit reached' : `${fmt(remaining)} left`}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Bills Tab */}
        {tab === 'bills' && (
          <View style={{ paddingHorizontal: 16 }}>
            <View style={[styles.billSummary, { backgroundColor: colors.card }]}>
              <Ionicons name="calendar-outline" size={18} color={colors.accent} />
              <Text style={[styles.billSummaryLabel, { color: colors.mutedForeground }]}>Monthly obligations</Text>
              <Text style={[styles.billSummaryValue, { color: colors.foreground }]}>{fmt(totalBills)}</Text>
            </View>
            {bills.length === 0 ? <EmptyState icon="calendar-outline" title="No bills added" subtitle="Track recurring bills here" /> : (
              <>
                {unpaidBills.length > 0 && <Text style={[styles.billGroup, { color: colors.mutedForeground }]}>UPCOMING</Text>}
                {unpaidBills.map(bill => (
                  <View key={bill.id} style={[styles.billCard, { backgroundColor: colors.card }]}>
                    <View style={[styles.billIconBg, { backgroundColor: colors.warning + '22' }]}>
                      <Ionicons name="calendar-outline" size={16} color={colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billName, { color: colors.foreground }]}>{bill.name}</Text>
                      <Text style={[styles.billMeta, { color: colors.mutedForeground }]}>Day {bill.due_day} · {bill.recurrence}</Text>
                    </View>
                    <Text style={[styles.billAmt, { color: colors.expense }]}>{fmt(bill.amount)}</Text>
                    <TouchableOpacity style={[styles.paidBtn, { backgroundColor: colors.income + '22' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleBillPaid(bill.id); }}>
                      <Ionicons name="checkmark" size={16} color={colors.income} />
                    </TouchableOpacity>
                  </View>
                ))}
                {paidBills.length > 0 && <Text style={[styles.billGroup, { color: colors.mutedForeground, marginTop: 16 }]}>PAID</Text>}
                {paidBills.map(bill => (
                  <View key={bill.id} style={[styles.billCard, { backgroundColor: colors.card, opacity: 0.5 }]}>
                    <View style={[styles.billIconBg, { backgroundColor: colors.income + '22' }]}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.income} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.billName, { color: colors.foreground }]}>{bill.name}</Text>
                    </View>
                    <Text style={[styles.billAmt, { color: colors.mutedForeground }]}>{fmt(bill.amount)}</Text>
                    <TouchableOpacity style={[styles.paidBtn, { backgroundColor: colors.secondary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleBillPaid(bill.id); }}>
                      <Ionicons name="refresh" size={14} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* Subscriptions Tab */}
        {tab === 'subscriptions' && (
          <View style={{ paddingHorizontal: 16 }}>
            <TouchableOpacity style={[styles.openSubsBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/modals/subscriptions')}>
              <Ionicons name="repeat-outline" size={18} color="#fff" />
              <Text style={styles.openSubsBtnText}>Manage Subscriptions</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>
            <EmptyState icon="repeat-outline" title="Track subscriptions" subtitle="Tap the button above to add and manage your recurring subscriptions" />
          </View>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { paddingHorizontal: 16, paddingBottom: 8 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  addBtn: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 8 },
  monthName: { fontSize: 15, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 3, marginBottom: 4 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  healthCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16, overflow: 'hidden' },
  healthStats: { flex: 1, gap: 6 },
  healthTitle: { fontSize: 17, fontWeight: '700' },
  healthSub: { fontSize: 13 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12, fontWeight: '600' },
  budgetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 10 },
  catIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  budgetCardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  catName: { fontSize: 14, fontWeight: '600' },
  budgetPct: { fontSize: 13, fontWeight: '700' },
  budgetCardBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  budgetSpent: { fontSize: 11 },
  budgetRemaining: { fontSize: 11 },
  billSummary: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, padding: 14, marginBottom: 12 },
  billSummaryLabel: { flex: 1, fontSize: 14 },
  billSummaryValue: { fontSize: 18, fontWeight: '700' },
  billGroup: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  billCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 14, marginBottom: 8 },
  billIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  billName: { fontSize: 14, fontWeight: '500' },
  billMeta: { fontSize: 12, marginTop: 2 },
  billAmt: { fontSize: 14, fontWeight: '700' },
  paidBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  openSubsBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, marginBottom: 16 },
  openSubsBtnText: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '600' },
});
