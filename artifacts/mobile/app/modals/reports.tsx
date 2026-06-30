import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Share, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { ProgressBar } from '@/components/ProgressBar';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n); }

export default function ReportsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, categories, accounts, goals, budgets, debts, investments } = useFinance();
  const [exporting, setExporting] = useState(false);

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const now = new Date();

  const ytdTxns = useMemo(() => transactions.filter(t => new Date(t.date).getFullYear() === now.getFullYear()), [transactions]);
  const ytdIncome = ytdTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const ytdExpense = ytdTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netWorth = accounts.reduce((s, a) => s + (a.type === 'credit' ? -a.balance : a.balance), 0);
  const savingsRate = ytdIncome > 0 ? Math.max(0, (ytdIncome - ytdExpense) / ytdIncome) : 0;
  const investmentValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalDebt = debts.reduce((s, d) => s + (d.amount - d.paid_amount), 0);

  const topCategories = useMemo(() => {
    const spend: Record<string, number> = {};
    ytdTxns.filter(t => t.type === 'expense' && t.category_id).forEach(t => { spend[t.category_id!] = (spend[t.category_id!] || 0) + t.amount; });
    return Object.entries(spend).map(([id, amount]) => { const cat = categories.find(c => c.id === id); return { name: cat?.name || 'Other', amount, color: cat?.color || colors.mutedForeground, pct: ytdExpense > 0 ? amount / ytdExpense : 0 }; }).sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [ytdTxns, categories, ytdExpense]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { income: number; expense: number }> = {};
    for (let m = 0; m < 12; m++) {
      const key = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      months[key] = { income: 0, expense: 0 };
    }
    ytdTxns.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (months[key]) {
        if (t.type === 'income') months[key].income += t.amount;
        else if (t.type === 'expense') months[key].expense += t.amount;
      }
    });
    return Object.entries(months).filter(([, v]) => v.income > 0 || v.expense > 0).map(([key, v]) => ({ month: new Date(parseInt(key.split('-')[0]), parseInt(key.split('-')[1]) - 1).toLocaleDateString('en-US', { month: 'short' }), ...v }));
  }, [ytdTxns]);

  const generateCSV = () => {
    const headers = 'Date,Type,Amount,Category,Description,Account\n';
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.category_id);
      const acc = accounts.find(a => a.id === t.account_id);
      return `"${t.date}","${t.type}","${t.amount.toFixed(2)}","${cat?.name || ''}","${t.description || ''}","${acc?.name || ''}"`;
    }).join('\n');
    return headers + rows;
  };

  const handleExport = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    await new Promise(r => setTimeout(r, 500));
    const csv = generateCSV();
    try {
      await Share.share({ message: csv, title: 'Wealthly Export.csv' });
    } catch {
      Alert.alert('Export', 'CSV data copied to clipboard (Share not available in preview).');
    }
    setExporting(false);
  };

  const StatBlock = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <View style={[styles.statBlock, { backgroundColor: colors.card }]}>
      <Text style={[styles.statValue, { color: color || colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      {sub && <Text style={[styles.statSub, { color: colors.mutedForeground }]}>{sub}</Text>}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Financial Report</Text>
        <TouchableOpacity onPress={handleExport} disabled={exporting}>
          <View style={[styles.exportBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name={exporting ? 'hourglass-outline' : 'download-outline'} size={16} color={colors.primaryForeground} />
            <Text style={[styles.exportText, { color: colors.primaryForeground }]}>CSV</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {/* YTD Summary */}
        <View style={[styles.yearCard, { marginBottom: 16 }]}>
          <LinearGradient colors={['#0D1B35', '#0A1628']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <Text style={styles.yearLabel}>{now.getFullYear()} Year-to-Date</Text>
          <Text style={styles.netWorthValue}>{fmt(netWorth)}</Text>
          <Text style={styles.netWorthLabel}>Net Worth</Text>
          <View style={styles.yearStats}>
            {[
              { label: 'Income', value: fmt(ytdIncome), color: '#10B981' },
              { label: 'Expenses', value: fmt(ytdExpense), color: '#EF4444' },
              { label: 'Savings', value: `${Math.round(savingsRate * 100)}%`, color: '#6366F1' },
            ].map((s, i) => (
              <View key={i} style={styles.yearStat}>
                <Text style={[styles.yearStatValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.yearStatLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Grid stats */}
        <View style={styles.statsGrid}>
          <StatBlock label="Transactions" value={String(transactions.length)} sub={`${ytdTxns.length} this year`} />
          <StatBlock label="Accounts" value={String(accounts.length)} sub="Active accounts" />
          <StatBlock label="Investments" value={fmt(investmentValue)} color={colors.income} />
          <StatBlock label="Total Debt" value={fmt(totalDebt)} color={totalDebt > 0 ? colors.expense : colors.income} />
          <StatBlock label="Goals" value={String(goals.length)} sub={`${goals.filter(g => g.saved_amount >= g.target_amount).length} complete`} />
          <StatBlock label="Net Cash Flow" value={fmt(ytdIncome - ytdExpense)} color={ytdIncome >= ytdExpense ? colors.income : colors.expense} />
        </View>

        {/* Monthly cashflow table */}
        {monthlyData.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Monthly Breakdown</Text>
            <View style={[styles.tableCard, { backgroundColor: colors.card }]}>
              <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 2 }]}>Month</Text>
                <Text style={[styles.tableHeaderText, { color: colors.income, flex: 3, textAlign: 'right' }]}>Income</Text>
                <Text style={[styles.tableHeaderText, { color: colors.expense, flex: 3, textAlign: 'right' }]}>Spent</Text>
                <Text style={[styles.tableHeaderText, { color: colors.foreground, flex: 3, textAlign: 'right' }]}>Net</Text>
              </View>
              {monthlyData.map((m, i) => {
                const net = m.income - m.expense;
                return (
                  <View key={m.month} style={[styles.tableRow, i < monthlyData.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                    <Text style={[styles.tableCell, { color: colors.foreground, flex: 2 }]}>{m.month}</Text>
                    <Text style={[styles.tableCell, { color: colors.income, flex: 3, textAlign: 'right' }]}>{fmt(m.income)}</Text>
                    <Text style={[styles.tableCell, { color: colors.expense, flex: 3, textAlign: 'right' }]}>{fmt(m.expense)}</Text>
                    <Text style={[styles.tableCell, { color: net >= 0 ? colors.income : colors.expense, flex: 3, textAlign: 'right', fontWeight: '600' }]}>{net >= 0 ? '+' : ''}{fmt(net)}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Top categories */}
        {topCategories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Spending Categories</Text>
            {topCategories.map((cat, i) => (
              <View key={i} style={[styles.catRow, { backgroundColor: colors.card }]}>
                <View style={[styles.catRank, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.catRankText, { color: colors.mutedForeground }]}>#{i + 1}</Text>
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.catRowTop}>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat.name}</Text>
                    <Text style={[styles.catAmount, { color: colors.expense }]}>{fmt(cat.amount)}</Text>
                  </View>
                  <ProgressBar progress={cat.pct} height={5} color={cat.color} />
                  <Text style={[styles.catPct, { color: colors.mutedForeground }]}>{(cat.pct * 100).toFixed(1)}% of total expenses</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  exportText: { fontSize: 13, fontWeight: '600' },
  yearCard: { borderRadius: 20, overflow: 'hidden', padding: 20, alignItems: 'center' },
  yearLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 },
  netWorthValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', letterSpacing: -0.5 },
  netWorthLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 },
  yearStats: { flexDirection: 'row', gap: 24 },
  yearStat: { alignItems: 'center' },
  yearStatValue: { fontSize: 16, fontWeight: '700' },
  yearStatLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statBlock: { width: '31.5%', borderRadius: 14, padding: 12, gap: 3 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  statSub: { fontSize: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  tableCard: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  tableHeaderText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 12 },
  tableCell: { fontSize: 13 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8 },
  catRank: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catRankText: { fontSize: 12, fontWeight: '700' },
  catRowTop: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 14, fontWeight: '600' },
  catAmount: { fontSize: 14, fontWeight: '700' },
  catPct: { fontSize: 11 },
});
