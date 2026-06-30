import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { TransactionRow } from '@/components/TransactionRow';
import { ProgressBar } from '@/components/ProgressBar';
import { MoneyText } from '@/components/MoneyText';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accounts, transactions, goals, bills, categories } = useFinance();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const monthTxns = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }, [transactions, month, year]);

  const totalIncome = useMemo(() =>
    monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTxns]);

  const totalExpense = useMemo(() =>
    monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTxns]);

  const netWorth = useMemo(() =>
    accounts.reduce((s, a) => s + (a.type === 'credit' ? -a.balance : a.balance), 0), [accounts]);

  const recentTxns = transactions.slice(0, 5);

  const upcomingBills = bills.filter(b => {
    if (b.is_paid) return false;
    const due = new Date(b.next_due);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= 0;
  });

  const topGoals = goals.slice(0, 2);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const health = useMemo(() => {
    const savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome : 0;
    const score = Math.min(100, Math.round(savingsRate * 200));
    return score;
  }, [totalIncome, totalExpense]);

  const quickActions = [
    { icon: 'add-circle' as const, label: 'Add', color: colors.primary, onPress: () => router.push('/modals/add-transaction') },
    { icon: 'swap-horizontal' as const, label: 'Goals', color: colors.accent, onPress: () => router.push('/modals/goals') },
    { icon: 'wallet' as const, label: 'Accounts', color: colors.warning, onPress: () => router.push('/modals/accounts') },
    { icon: 'settings-outline' as const, label: 'More', color: colors.mutedForeground, onPress: () => router.push('/modals/settings') },
  ];

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: topPadding + 8, paddingBottom: bottomPadding + 90 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
            <Text style={[styles.appName, { color: colors.foreground }]}>Wealthly</Text>
          </View>
          <View style={[styles.scoreBadge, { backgroundColor: health >= 60 ? colors.income + '22' : colors.warning + '22' }]}>
            <Text style={[styles.scoreText, { color: health >= 60 ? colors.income : colors.warning }]}>{health}%</Text>
            <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Health</Text>
          </View>
        </View>

        {/* Net Worth Card */}
        <LinearGradient
          colors={[colors.isDark ? '#1a2540' : '#1a2540', colors.isDark ? '#0e1829' : '#0e1829']}
          style={styles.netWorthCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.netWorthLabel}>NET WORTH</Text>
          <Text style={styles.netWorthAmount}>{fmt(netWorth)}</Text>
          <View style={styles.netWorthRow}>
            <View style={styles.netStat}>
              <Ionicons name="arrow-up-circle" size={14} color="#10B981" />
              <Text style={styles.netStatText}>{fmt(totalIncome)} income</Text>
            </View>
            <View style={styles.netStat}>
              <Ionicons name="arrow-down-circle" size={14} color="#EF4444" />
              <Text style={styles.netStatText}>{fmt(totalExpense)} spent</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Accounts */}
        {accounts.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Accounts</Text>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/accounts'); }}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>Manage</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={accounts}
              keyExtractor={a => a.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              renderItem={({ item: acc }) => (
                <View style={[styles.accountCard, { backgroundColor: acc.color + '18', borderColor: acc.color + '44' }]}>
                  <View style={[styles.accountIconBg, { backgroundColor: acc.color + '33' }]}>
                    <Ionicons name={(acc.icon || 'wallet') as any} size={20} color={acc.color} />
                  </View>
                  <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>{acc.name}</Text>
                  <Text style={[styles.accountBalance, { color: colors.foreground }]}>{fmt(acc.balance)}</Text>
                  <Text style={[styles.accountType, { color: colors.mutedForeground }]}>{acc.type}</Text>
                </View>
              )}
            />
          </View>
        )}

        {/* Month Summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.income + '22' }]}>
              <Ionicons name="arrow-up" size={16} color={colors.income} />
            </View>
            <Text style={[styles.statAmount, { color: colors.income }]}>{fmt(totalIncome)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Income</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.expense + '22' }]}>
              <Ionicons name="arrow-down" size={16} color={colors.expense} />
            </View>
            <Text style={[styles.statAmount, { color: colors.expense }]}>{fmt(totalExpense)}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Expenses</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickAction}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); action.onPress(); }}
              activeOpacity={0.7}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <Text style={[styles.quickActionLabel, { color: colors.mutedForeground }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <TouchableOpacity
            style={[styles.billAlert, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/bills'); }}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={16} color={colors.warning} />
            <Text style={[styles.billAlertText, { color: colors.warning }]}>
              {upcomingBills.length} bill{upcomingBills.length > 1 ? 's' : ''} due soon — {upcomingBills[0].name} {fmt(upcomingBills[0].amount)}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.warning} />
          </TouchableOpacity>
        )}

        {/* Recent Transactions */}
        {recentTxns.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent</Text>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentTxns.map(txn => (
              <TransactionRow
                key={txn.id}
                transaction={txn}
                categories={categories}
                accounts={accounts}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              />
            ))}
          </View>
        )}

        {/* Savings Goals */}
        {topGoals.length > 0 && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Goals</Text>
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/goals'); }}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>View all</Text>
              </TouchableOpacity>
            </View>
            {topGoals.map(goal => {
              const progress = goal.target_amount > 0 ? goal.saved_amount / goal.target_amount : 0;
              return (
                <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card }]}>
                  <View style={[styles.goalIcon, { backgroundColor: goal.color + '22' }]}>
                    <Ionicons name={(goal.icon || 'flag') as any} size={18} color={goal.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.goalRow}>
                      <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
                      <Text style={[styles.goalAmount, { color: colors.mutedForeground }]}>
                        {fmt(goal.saved_amount)} / {fmt(goal.target_amount)}
                      </Text>
                    </View>
                    <ProgressBar progress={progress} color={goal.color} />
                    <Text style={[styles.goalPercent, { color: goal.color }]}>{Math.round(progress * 100)}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, marginBottom: 20 },
  greeting: { fontSize: 13, fontWeight: '400', marginBottom: 2 },
  appName: { fontSize: 26, fontWeight: '700' },
  scoreBadge: { alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  scoreText: { fontSize: 16, fontWeight: '700' },
  scoreLabel: { fontSize: 10 },
  netWorthCard: { marginHorizontal: 16, borderRadius: 20, padding: 24, marginBottom: 20 },
  netWorthLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  netWorthAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', marginBottom: 12 },
  netWorthRow: { flexDirection: 'row', gap: 20 },
  netStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  netStatText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, marginTop: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600' },
  seeAll: { fontSize: 13 },
  accountCard: { width: 140, borderRadius: 16, padding: 14, borderWidth: 1 },
  accountIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  accountName: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  accountBalance: { fontSize: 17, fontWeight: '700', marginBottom: 2 },
  accountType: { fontSize: 11, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 20, marginTop: 20 },
  statCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'flex-start', gap: 6 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statAmount: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 20 },
  quickAction: { alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 11, fontWeight: '500' },
  billAlert: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 20 },
  billAlertText: { flex: 1, fontSize: 13, fontWeight: '500' },
  goalCard: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalName: { fontSize: 14, fontWeight: '600' },
  goalAmount: { fontSize: 12 },
  goalPercent: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  fab: { position: 'absolute', right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
});
