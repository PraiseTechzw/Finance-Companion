import React, { useMemo, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Platform, Animated, useWindowDimensions, Dimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop, Circle } from 'react-native-svg';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { TransactionRow } from '@/components/TransactionRow';
import { ProgressBar } from '@/components/ProgressBar';

function fmt(n: number, compact?: boolean) {
  if (compact && Math.abs(n) >= 1000) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

// Sparkline SVG component
function Sparkline({ data, width, height, color }: { data: number[]; width: number; height: number; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((v - min) / range) * height,
  }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="sl" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={`${d} L ${pts[pts.length-1].x} ${height} L 0 ${height} Z`} fill="url(#sl)" />
      <Path d={d} stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Premium Net Worth Card
function NetWorthCard({ netWorth, income, expense, transactions }: {
  netWorth: number; income: number; expense: number; transactions: any[];
}) {
  const { width } = useWindowDimensions();
  const cardWidth = width - 32;

  // Build sparkline from last 8 days of cumulative transactions
  const sparkData = useMemo(() => {
    const days = 8;
    const result = [];
    let running = netWorth - income + expense; // approx start
    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const dayIncome = transactions.filter((t: any) => t.date.startsWith(dayStr) && t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
      const dayExpense = transactions.filter((t: any) => t.date.startsWith(dayStr) && t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
      running += dayIncome - dayExpense;
      result.push(running);
    }
    return result;
  }, [transactions, netWorth, income, expense]);

  const change = income - expense;
  const changePositive = change >= 0;

  return (
    <View style={[styles.netWorthCard, { width: cardWidth }]}>
      {/* Deep gradient background */}
      <LinearGradient
        colors={['#0D1B35', '#122040', '#0A1628']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative grid lines */}
      <Svg style={StyleSheet.absoluteFill} width={cardWidth} height={220}>
        {[40, 80, 120, 160, 200].map((y, i) => (
          <Path key={i} d={`M 0 ${y} L ${cardWidth} ${y}`} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
        ))}
        {[60, 140, 220, 300].map((x, i) => (
          <Path key={i} d={`M ${x} 0 L ${x} 220`} stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
        ))}
      </Svg>

      {/* Glow orb top-right */}
      <View style={styles.cardOrb} />

      {/* Card content */}
      <View style={styles.cardContent}>
        {/* Header row */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={[styles.cardBadge, { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.3)' }]}>
              <View style={[styles.cardBadgeDot, { backgroundColor: '#10B981' }]} />
              <Text style={[styles.cardBadgeText, { color: '#10B981' }]}>NET WORTH</Text>
            </View>
          </View>
          <View style={[styles.changeChip, { backgroundColor: changePositive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
            <Ionicons name={changePositive ? 'trending-up' : 'trending-down'} size={12} color={changePositive ? '#10B981' : '#EF4444'} />
            <Text style={[styles.changeText, { color: changePositive ? '#10B981' : '#EF4444' }]}>
              {changePositive ? '+' : ''}{fmt(change, true)} this month
            </Text>
          </View>
        </View>

        {/* Main amount */}
        <Text style={styles.netWorthAmount}>{fmt(netWorth)}</Text>

        {/* Sparkline */}
        <View style={styles.sparklineContainer}>
          <Sparkline data={sparkData} width={cardWidth - 48} height={44} color="#10B981" />
        </View>

        {/* Bottom stats */}
        <View style={styles.cardStats}>
          <View style={styles.cardStat}>
            <View style={[styles.statDot, { backgroundColor: '#10B981' }]} />
            <View>
              <Text style={styles.cardStatLabel}>INCOME</Text>
              <Text style={styles.cardStatValue}>{fmt(income, true)}</Text>
            </View>
          </View>
          <View style={[styles.cardDivider]} />
          <View style={styles.cardStat}>
            <View style={[styles.statDot, { backgroundColor: '#EF4444' }]} />
            <View>
              <Text style={styles.cardStatLabel}>SPENT</Text>
              <Text style={styles.cardStatValue}>{fmt(expense, true)}</Text>
            </View>
          </View>
          <View style={[styles.cardDivider]} />
          <View style={styles.cardStat}>
            <View style={[styles.statDot, { backgroundColor: '#6366F1' }]} />
            <View>
              <Text style={styles.cardStatLabel}>SAVED</Text>
              <Text style={[styles.cardStatValue, { color: changePositive ? '#10B981' : '#EF4444' }]}>
                {fmt(Math.abs(change), true)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scrollY = useRef(new Animated.Value(0)).current;
  const { accounts, transactions, goals, bills, categories } = useFinance();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const monthTxns = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  }), [transactions, month, year]);

  const totalIncome = useMemo(() => monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const totalExpense = useMemo(() => monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0), [monthTxns]);
  const netWorth = useMemo(() => accounts.reduce((s, a) => s + (a.type === 'credit' ? -a.balance : a.balance), 0), [accounts]);

  const recentTxns = transactions.slice(0, 5);
  const upcomingBills = bills.filter(b => {
    if (b.is_paid) return false;
    const due = new Date(b.next_due);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 7 && diff >= 0;
  });

  const topGoals = goals.slice(0, 3);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const savingsRate = totalIncome > 0 ? Math.max(0, (totalIncome - totalExpense) / totalIncome) : 0;
  const health = Math.min(100, Math.round(savingsRate * 200));

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  // Floating header blur opacity
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });

  const quickActions = [
    { icon: 'add-circle' as const, label: 'Add', color: colors.primary, onPress: () => router.push('/modals/add-transaction') },
    { icon: 'flag-outline' as const, label: 'Goals', color: '#6366F1', onPress: () => router.push('/modals/goals') },
    { icon: 'wallet-outline' as const, label: 'Accounts', color: '#F59E0B', onPress: () => router.push('/modals/accounts') },
    { icon: 'calendar-outline' as const, label: 'Calendar', color: '#06B6D4', onPress: () => router.push('/modals/calendar') },
    { icon: 'repeat-outline' as const, label: 'Subs', color: '#8B5CF6', onPress: () => router.push('/modals/subscriptions') },
    { icon: 'card-outline' as const, label: 'Debt', color: '#EF4444', onPress: () => router.push('/modals/debt') },
    { icon: 'trending-up-outline' as const, label: 'Invest', color: '#10B981', onPress: () => router.push('/modals/investments') },
    { icon: 'calculator-outline' as const, label: 'Tax', color: '#EC4899', onPress: () => router.push('/modals/tax') },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed floating header */}
      <View style={[styles.fixedHeader, { paddingTop: topPadding }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          )}
        </Animated.View>
        <View style={styles.fixedHeaderContent}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{greeting}</Text>
            <Text style={[styles.appName, { color: colors.foreground }]}>Wealthly</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={[styles.healthRing, { borderColor: health >= 60 ? '#10B981' + '66' : '#F59E0B66' }]}>
              <Text style={[styles.healthScore, { color: health >= 60 ? '#10B981' : '#F59E0B' }]}>{health}</Text>
              <Text style={[styles.healthLabel, { color: colors.mutedForeground }]}>%</Text>
            </View>
            <TouchableOpacity
              style={[styles.settingsBtn, { backgroundColor: colors.card }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/settings'); }}
            >
              <Ionicons name="settings-outline" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: topPadding + 64, paddingBottom: bottomPadding + 90 }}
      >
        {/* Net Worth Card */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <NetWorthCard netWorth={netWorth} income={totalIncome} expense={totalExpense} transactions={transactions} />
        </View>

        {/* Quick Actions - 4+4 grid */}
        <View style={[styles.quickActionsContainer, { backgroundColor: colors.card }]}>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickActionItem}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); action.onPress(); }}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color + '18' }]}>
                  <Ionicons name={action.icon} size={22} color={action.color} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.mutedForeground }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Accounts */}
        {accounts.length > 0 && (
          <View style={{ marginBottom: 8 }}>
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
                <View style={[styles.accountCard, { backgroundColor: colors.card, borderColor: acc.color + '33' }]}>
                  <LinearGradient
                    colors={[acc.color + '18', acc.color + '06']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <View style={[styles.accountIconBg, { backgroundColor: acc.color + '25' }]}>
                    <Ionicons name={(acc.icon || 'wallet') as any} size={20} color={acc.color} />
                  </View>
                  <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>{acc.name}</Text>
                  <Text style={[styles.accountBalance, { color: colors.foreground }]}>{fmt(acc.balance, true)}</Text>
                  <View style={[styles.accountTypePill, { backgroundColor: acc.color + '22' }]}>
                    <Text style={[styles.accountType, { color: acc.color }]}>{acc.type}</Text>
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {/* Upcoming Bills Alert */}
        {upcomingBills.length > 0 && (
          <TouchableOpacity
            style={[styles.billAlert, { backgroundColor: '#F59E0B' + '15', borderColor: '#F59E0B44' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/modals/bills'); }}
            activeOpacity={0.8}
          >
            <View style={[styles.billAlertIcon, { backgroundColor: '#F59E0B22' }]}>
              <Ionicons name="alert-circle" size={18} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.billAlertTitle, { color: '#F59E0B' }]}>
                {upcomingBills.length} bill{upcomingBills.length > 1 ? 's' : ''} due soon
              </Text>
              <Text style={[styles.billAlertSub, { color: colors.mutedForeground }]}>
                Next: {upcomingBills[0].name} — {fmt(upcomingBills[0].amount)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Savings Goals */}
        {topGoals.length > 0 && (
          <View style={{ marginBottom: 8 }}>
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
                  <LinearGradient colors={[goal.color + '18', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                  <View style={[styles.goalIconBg, { backgroundColor: goal.color + '22' }]}>
                    <Ionicons name={(goal.icon || 'flag') as any} size={18} color={goal.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.goalRowTop}>
                      <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
                      <Text style={[styles.goalPct, { color: goal.color }]}>{Math.round(progress * 100)}%</Text>
                    </View>
                    <ProgressBar progress={progress} height={5} color={goal.color} />
                    <Text style={[styles.goalAmounts, { color: colors.mutedForeground }]}>
                      {fmt(goal.saved_amount, true)} of {fmt(goal.target_amount, true)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
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
            <View style={[styles.transactionsContainer, { backgroundColor: colors.card }]}>
              {recentTxns.map((txn, i) => (
                <View key={txn.id}>
                  <TransactionRow transaction={txn} categories={categories} accounts={accounts} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} />
                  {i < recentTxns.length - 1 && <View style={[styles.txnDivider, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </View>
          </View>
        )}
      </Animated.ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPadding + 80 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/modals/add-transaction'); }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 100,
  },
  fixedHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 8,
  },
  greeting: { fontSize: 12, fontWeight: '400', marginBottom: 1 },
  appName: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  healthRing: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 0 },
  healthScore: { fontSize: 15, fontWeight: '700' },
  healthLabel: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  settingsBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  netWorthCard: {
    borderRadius: 24,
    overflow: 'hidden',
    height: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  cardOrb: {
    position: 'absolute',
    top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#10B981',
    opacity: 0.1,
  },
  cardContent: { padding: 20, flex: 1, justifyContent: 'space-between' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeaderLeft: {},
  cardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1,
  },
  cardBadgeDot: { width: 6, height: 6, borderRadius: 3 },
  cardBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  changeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  changeText: { fontSize: 11, fontWeight: '600' },
  netWorthAmount: { color: '#FFFFFF', fontSize: 38, fontWeight: '700', letterSpacing: -1, marginTop: 4 },
  sparklineContainer: { overflow: 'hidden', marginHorizontal: -4 },
  cardStats: { flexDirection: 'row', alignItems: 'center' },
  cardStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  cardStatLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600', letterSpacing: 0.6 },
  cardStatValue: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  cardDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
  quickActionsContainer: { marginHorizontal: 16, borderRadius: 20, marginBottom: 20, overflow: 'hidden' },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 8 },
  quickActionItem: { width: '25%', alignItems: 'center', paddingVertical: 14, gap: 6 },
  quickActionIcon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { fontSize: 11, fontWeight: '500' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  seeAll: { fontSize: 13, fontWeight: '500' },
  accountCard: {
    width: 148, borderRadius: 18, padding: 14, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 3,
  },
  accountIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  accountName: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  accountBalance: { fontSize: 18, fontWeight: '700', marginBottom: 6, letterSpacing: -0.5 },
  accountTypePill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  accountType: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  billAlert: {
    marginHorizontal: 16, borderRadius: 16, borderWidth: 1,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  billAlertIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  billAlertTitle: { fontSize: 13, fontWeight: '600' },
  billAlertSub: { fontSize: 12, marginTop: 1 },
  goalCard: {
    marginHorizontal: 16, borderRadius: 16, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 12, overflow: 'hidden',
  },
  goalIconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  goalRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  goalName: { fontSize: 14, fontWeight: '600' },
  goalPct: { fontSize: 13, fontWeight: '700' },
  goalAmounts: { fontSize: 11, marginTop: 5 },
  transactionsContainer: { marginHorizontal: 16, borderRadius: 18, overflow: 'hidden', marginBottom: 20 },
  txnDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  fab: {
    position: 'absolute', right: 20,
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#10B981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
