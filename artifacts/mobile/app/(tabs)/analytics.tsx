import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { LineChart } from '@/components/charts/LineChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

type Range = '1W' | '1M' | '3M' | '6M' | '1Y';

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, categories, accounts, investments } = useFinance();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<Range>('1M');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const chartWidth = width - 64;

  const rangeDays: Record<Range, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365 };

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - rangeDays[range]);
    return transactions.filter(t => new Date(t.date) >= cutoff);
  }, [transactions, range]);

  // Spending trend (daily totals)
  const trendData = useMemo(() => {
    const days = rangeDays[range];
    const buckets = Math.min(days, 14);
    const interval = days / buckets;
    const result: number[] = [];
    for (let i = 0; i < buckets; i++) {
      const start = new Date();
      start.setDate(start.getDate() - days + i * interval);
      const end = new Date();
      end.setDate(end.getDate() - days + (i + 1) * interval);
      const sum = filtered.filter(t => {
        const d = new Date(t.date);
        return d >= start && d < end && t.type === 'expense';
      }).reduce((s, t) => s + t.amount, 0);
      result.push(sum);
    }
    return result;
  }, [filtered, range]);

  // By category
  const categoryData = useMemo(() => {
    const spend: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense' && t.category_id).forEach(t => {
      spend[t.category_id!] = (spend[t.category_id!] || 0) + t.amount;
    });
    return Object.entries(spend)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return { label: cat?.name || 'Other', value, color: cat?.color || colors.mutedForeground };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filtered, categories]);

  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  // Monthly income vs expense
  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 5);
    transactions.filter(t => new Date(t.date) >= cutoff).forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) months[key] = { income: 0, expense: 0 };
      if (t.type === 'income') months[key].income += t.amount;
      else if (t.type === 'expense') months[key].expense += t.amount;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [transactions]);

  // Financial metrics
  const now = new Date();
  const monthTxns = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthIncome = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingsRate = monthIncome > 0 ? Math.max(0, (monthIncome - monthExpense) / monthIncome) : 0;

  const netWorth = accounts.reduce((s, a) => s + (a.type === 'credit' ? -a.balance : a.balance), 0);
  const investmentValue = investments.reduce((s, i) => s + i.current_value, 0);
  const investmentCost = investments.reduce((s, i) => s + i.amount, 0);
  const investmentReturn = investmentCost > 0 ? (investmentValue - investmentCost) / investmentCost : 0;

  const ranges: Range[] = ['1W', '1M', '3M', '6M', '1Y'];

  const MetricBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: colors.foreground, fontSize: 14 }}>{label}</Text>
        <Text style={{ color, fontSize: 14, fontWeight: '600' }}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
        <View style={{ height: 6, width: `${Math.min(value * 100, 100)}%`, backgroundColor: color, borderRadius: 3 }} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: topPadding + 8, paddingBottom: bottomPadding + 90 }}>
        <Text style={[styles.title, { color: colors.foreground }]}>Analytics</Text>

        {/* Range selector */}
        <View style={[styles.rangeRow, { backgroundColor: colors.card }]}>
          {ranges.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.rangeBtn, { backgroundColor: range === r ? colors.primary : 'transparent' }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRange(r); }}
            >
              <Text style={[styles.rangeLabel, { color: range === r ? colors.primaryForeground : colors.mutedForeground }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Spending Trend */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Spending Trend</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>Total: {fmt(totalExpense)}</Text>
          <LineChart data={trendData} width={chartWidth} height={120} color={colors.primary} />
        </View>

        {/* Category Donut */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Spending by Category</Text>
          {categoryData.length > 0 ? (
            <DonutChart
              data={categoryData}
              size={160}
              thickness={28}
              centerLabel={fmt(totalExpense)}
              centerSublabel="Total"
            />
          ) : (
            <Text style={[styles.noData, { color: colors.mutedForeground }]}>No expense data</Text>
          )}
        </View>

        {/* Income vs Expense Bar */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Income vs Expense</Text>
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
          <View style={styles.barLegend}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.income }]} /><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Income</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.expense }]} /><Text style={{ color: colors.mutedForeground, fontSize: 12 }}>Expense</Text></View>
          </View>
        </View>

        {/* Financial Health Metrics */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Financial Health</Text>
          <MetricBar label="Savings Rate" value={savingsRate} color={savingsRate >= 0.2 ? colors.income : colors.warning} />
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 14 }} />

          <View style={styles.metricRow}>
            <View style={[styles.metricBox, { backgroundColor: colors.secondary }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.primary} />
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{fmt(netWorth)}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Net Worth</Text>
            </View>
            <View style={[styles.metricBox, { backgroundColor: colors.secondary }]}>
              <Ionicons name="trending-up-outline" size={20} color={investmentReturn >= 0 ? colors.income : colors.expense} />
              <Text style={[styles.metricValue, { color: investmentReturn >= 0 ? colors.income : colors.expense }]}>
                {investmentReturn >= 0 ? '+' : ''}{Math.round(investmentReturn * 100)}%
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Portfolio Return</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 28, fontWeight: '700', paddingHorizontal: 20, marginBottom: 16 },
  rangeRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, padding: 4, marginBottom: 16 },
  rangeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  rangeLabel: { fontSize: 13, fontWeight: '600' },
  card: { marginHorizontal: 16, borderRadius: 20, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardSub: { fontSize: 12, marginBottom: 12 },
  noData: { fontSize: 14, textAlign: 'center', paddingVertical: 24 },
  barLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  metricRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  metricBox: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  metricValue: { fontSize: 18, fontWeight: '700' },
  metricLabel: { fontSize: 11, textAlign: 'center' },
});
