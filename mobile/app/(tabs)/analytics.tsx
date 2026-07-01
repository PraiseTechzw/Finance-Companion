import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { LineChart } from '@/components/charts/LineChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n); }
function fmtPct(n: number) { return `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%`; }

type Range = '1W' | '1M' | '3M' | '6M' | '1Y';
const rangeDays: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, categories, accounts, investments } = useFinance();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [range, setRange] = useState<Range>('1M');
  const scrollY = new Animated.Value(0);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const HEADER_HEIGHT = topPadding + 110;
  const chartWidth = width - 64;

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays[range]);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, range]);

  const trendData = useMemo(() => {
    const days = rangeDays[range];
    const buckets = Math.min(days, 14);
    const interval = days / buckets;
    return Array.from({ length: buckets }, (_, i) => {
      const start = new Date(); start.setDate(start.getDate() - days + i * interval);
      const end = new Date(); end.setDate(end.getDate() - days + (i + 1) * interval);
      return filtered.filter(t => { const d = new Date(t.date); return d >= start && d < end && t.type === 'expense'; }).reduce((s, t) => s + t.amount, 0);
    });
  }, [filtered, range]);

  const categoryData = useMemo(() => {
    const spend: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense' && t.category_id).forEach(t => { spend[t.category_id!] = (spend[t.category_id!] || 0) + t.amount; });
    return Object.entries(spend).map(([id, value]) => { const cat = categories.find(c => c.id === id); return { label: cat?.name || 'Other', value, color: cat?.color || colors.mutedForeground }; }).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filtered, categories]);

  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 5);
    transactions.filter(t => new Date(t.date) >= cutoff).forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (t.type === 'income') months[key].income += t.amount;
      else if (t.type === 'expense') months[key].expense += t.amount;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [transactions]);

  const now = new Date();
  const monthTxns = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = monthIncome > 0 ? Math.max(0, (monthIncome - monthExpense) / monthIncome) : 0;
  const netWorth = accounts.reduce((s, a) => s + (a.type === 'credit' ? -a.balance : a.balance), 0);
  const investmentValue = investments.reduce((s, i) => s + i.current_value, 0);
  const investmentCost = investments.reduce((s, i) => s + i.amount, 0);
  const investmentReturn = investmentCost > 0 ? (investmentValue - investmentCost) / investmentCost : 0;

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' });

  const StatCard = ({ icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub?: string }) => (
    <View style={[styles.statCard, { backgroundColor: colors.card }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: color }]}>{sub}</Text>}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: topPadding }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          {Platform.OS === 'ios' ? <BlurView intensity={80} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />}
        </Animated.View>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/reports'); }}>
              <View style={[styles.reportBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="download-outline" size={16} color={colors.foreground} />
                <Text style={[styles.reportBtnText, { color: colors.foreground }]}>Export</Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={[styles.rangeRow, { backgroundColor: colors.card }]}>
            {(['1W', '1M', '3M', '6M', '1Y'] as Range[]).map(r => (
              <TouchableOpacity key={r} style={[styles.rangeBtn, { backgroundColor: range === r ? colors.primary : 'transparent' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRange(r); }}>
                <Text style={[styles.rangeLabel, { color: range === r ? colors.primaryForeground : colors.mutedForeground }]}>{r}</Text>
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
        {/* Summary stat cards */}
        <View style={styles.statsRow}>
          <StatCard icon="trending-up" label="Income" value={fmt(totalIncome)} color={colors.income} />
          <StatCard icon="trending-down" label="Expenses" value={fmt(totalExpense)} color={colors.expense} />
          <StatCard icon="wallet-outline" label="Net Worth" value={fmt(netWorth)} color={colors.accent} />
          <StatCard icon="leaf-outline" label="Savings" value={`${Math.round(savingsRate * 100)}%`} color={savingsRate >= 0.2 ? colors.income : colors.warning} sub={savingsRate >= 0.2 ? '✓ Healthy' : 'Needs work'} />
        </View>

        {/* Spending Trend */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Spending Trend</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Total: {fmt(totalExpense)}</Text>
          <LineChart data={trendData} width={chartWidth} height={110} color={colors.expense} />
        </View>

        {/* Category Breakdown */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>By Category</Text>
          {categoryData.length > 0 ? (
            <DonutChart data={categoryData} size={160} thickness={28} centerLabel={fmt(totalExpense)} centerSublabel="Total" />
          ) : (
            <Text style={[styles.noData, { color: colors.mutedForeground }]}>No expense data for period</Text>
          )}
        </View>

        {/* Income vs Expense */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Income vs Expense</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Last 6 months</Text>
          <BarChart
            width={chartWidth}
            height={130}
            data={monthlyData.flatMap(([key, v]) => {
              const [y, m] = key.split('-');
              const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-US', { month: 'short' });
              return [
                { value: v.income, label, color: colors.income },
                { value: v.expense, label: '', color: colors.expense },
              ];
            })}
          />
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.income }]} /><Text style={[styles.legendTxt, { color: colors.mutedForeground }]}>Income</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.expense }]} /><Text style={[styles.legendTxt, { color: colors.mutedForeground }]}>Expense</Text></View>
          </View>
        </View>

        {/* Investment performance */}
        {investmentValue > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Portfolio Performance</Text>
            <View style={styles.investRow}>
              <View>
                <Text style={[styles.investLabel, { color: colors.mutedForeground }]}>Current Value</Text>
                <Text style={[styles.investValue, { color: colors.foreground }]}>{fmt(investmentValue)}</Text>
              </View>
              <View style={[styles.returnChip, { backgroundColor: investmentReturn >= 0 ? colors.income + '22' : colors.expense + '22' }]}>
                <Ionicons name={investmentReturn >= 0 ? 'trending-up' : 'trending-down'} size={16} color={investmentReturn >= 0 ? colors.income : colors.expense} />
                <Text style={[styles.returnTxt, { color: investmentReturn >= 0 ? colors.income : colors.expense }]}>
                  {fmtPct(investmentReturn)}
                </Text>
              </View>
            </View>
            <Text style={[styles.investSub, { color: colors.mutedForeground }]}>Cost basis: {fmt(investmentCost)} · Gain: {fmt(investmentValue - investmentCost)}</Text>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  reportBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  reportBtnText: { fontSize: 13, fontWeight: '500' },
  rangeRow: { flexDirection: 'row', borderRadius: 14, padding: 3 },
  rangeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 11 },
  rangeLabel: { fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 16, marginBottom: 16 },
  statCard: { width: '47%', borderRadius: 16, padding: 14, gap: 4 },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  statSub: { fontSize: 11, fontWeight: '600' },
  card: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3 },
  cardSub: { fontSize: 12, marginBottom: 12 },
  noData: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  chartLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendTxt: { fontSize: 12 },
  investRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  investLabel: { fontSize: 12, marginBottom: 3 },
  investValue: { fontSize: 22, fontWeight: '700' },
  returnChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  returnTxt: { fontSize: 16, fontWeight: '700' },
  investSub: { fontSize: 12 },
});
