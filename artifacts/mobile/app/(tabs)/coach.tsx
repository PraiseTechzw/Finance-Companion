import React, { useMemo, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';

interface CoachMessage {
  id: string;
  text: string;
  type: 'insight' | 'warning' | 'praise' | 'tip' | 'summary';
  timestamp: Date;
}

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n); }

function generateInsights(transactions: any[], bills: any[], goals: any[], accounts: any[], categories: any[], debts: any[]): CoachMessage[] {
  const msgs: CoachMessage[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = now.getDate();
  const monthTxns = transactions.filter((t: any) => { const d = new Date(t.date); return d.getMonth() + 1 === month && d.getFullYear() === year; });
  const income = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const expense = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  msgs.push({ id: 'summary', text: `${monthName} so far: ${fmt(income)} income, ${fmt(expense)} expenses, ${Math.round(savingsRate * 100)}% savings rate. ${savingsRate >= 0.2 ? '🟢 On track for healthy finances.' : savingsRate >= 0.1 ? '🟡 Decent — aim for 20% savings.' : '🔴 Expenses are high this month.'}`, type: 'summary', timestamp: now });

  if (savingsRate >= 0.25) msgs.push({ id: 'savings-praise', text: `Outstanding! You're saving ${Math.round(savingsRate * 100)}% of income — well above the 20% benchmark. At this rate you're building serious wealth.`, type: 'praise', timestamp: now });
  else if (income > 0 && savingsRate < 0.05) msgs.push({ id: 'savings-warn', text: `Your savings rate is only ${Math.round(savingsRate * 100)}%. To build an emergency fund and reach your goals, try to save at least 20% by reducing discretionary spending.`, type: 'warning', timestamp: now });

  const catSpend: Record<string, number> = {};
  monthTxns.filter((t: any) => t.type === 'expense' && t.category_id).forEach((t: any) => { catSpend[t.category_id] = (catSpend[t.category_id] || 0) + t.amount; });
  categories.forEach((cat: any) => {
    if (cat.budget_limit > 0 && catSpend[cat.id]) {
      const pct = catSpend[cat.id] / cat.budget_limit;
      if (pct >= 1.0) msgs.push({ id: `over-${cat.id}`, text: `⚠️ Over budget in ${cat.name}: ${fmt(catSpend[cat.id])} vs ${fmt(cat.budget_limit)} limit. Consider pausing discretionary spending in this category.`, type: 'warning', timestamp: now });
      else if (pct >= 0.85) msgs.push({ id: `near-${cat.id}`, text: `You've used ${Math.round(pct * 100)}% of your ${cat.name} budget with ${daysInMonth - dayOfMonth} days left. Ease up to avoid going over.`, type: 'tip', timestamp: now });
    }
  });

  const dueSoon = bills.filter((b: any) => { if (b.is_paid) return false; const due = new Date(b.next_due); const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24); return diff <= 5 && diff >= 0; });
  dueSoon.forEach((bill: any) => { const diff = Math.ceil((new Date(bill.next_due).getTime() - Date.now()) / (1000 * 60 * 60 * 24)); msgs.push({ id: `bill-${bill.id}`, text: `⏰ ${bill.name} (${fmt(bill.amount)}) is due ${diff === 0 ? 'today' : `in ${diff} day${diff > 1 ? 's' : ''}`}. Make sure funds are available.`, type: 'warning', timestamp: now }); });

  goals.forEach((g: any) => {
    const p = g.target_amount > 0 ? g.saved_amount / g.target_amount : 0;
    if (p >= 1) msgs.push({ id: `goal-done-${g.id}`, text: `🎉 Goal completed! You've fully funded "${g.name}". Celebrate and set your next financial target.`, type: 'praise', timestamp: now });
    else if (p >= 0.5 && p < 0.6) msgs.push({ id: `goal-half-${g.id}`, text: `Halfway to "${g.name}"! ${fmt(g.saved_amount)} saved of ${fmt(g.target_amount)}. Keep the momentum.`, type: 'insight', timestamp: now });
  });

  debts.forEach((d: any) => {
    if (d.amount > 0) {
      const p = d.paid_amount / d.amount;
      if (p >= 0.5 && p < 0.6) msgs.push({ id: `debt-${d.id}`, text: `50% of your "${d.name}" debt paid off! ${fmt(d.amount - d.paid_amount)} remaining. You're making excellent progress.`, type: 'praise', timestamp: now });
    }
  });

  if (msgs.length <= 1) msgs.push({ id: 'default', text: `Welcome to your AI Financial Coach! As you track transactions, I'll analyze patterns and give personalized insights on spending, saving, and growing your wealth. Add some transactions to get started.`, type: 'tip', timestamp: now });
  return msgs;
}

const quickReplies = [
  { text: 'How am I doing?', icon: 'trending-up-outline' },
  { text: 'Reduce expenses?', icon: 'cut-outline' },
  { text: 'Goal progress?', icon: 'flag-outline' },
  { text: 'Next bill due?', icon: 'calendar-outline' },
  { text: 'Savings rate?', icon: 'leaf-outline' },
  { text: 'Net worth?', icon: 'wallet-outline' },
  { text: 'Investment returns?', icon: 'bar-chart-outline' },
  { text: 'Tax estimate?', icon: 'calculator-outline' },
];

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, bills, goals, accounts, categories, debts, investments } = useFinance();
  const [extraMessages, setExtraMessages] = useState<CoachMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = new Animated.Value(0);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const HEADER_HEIGHT = topPadding + 100;

  const insights = useMemo(() => generateInsights(transactions, bills, goals, accounts, categories, debts), [transactions, bills, goals, accounts, categories, debts]);
  const allMessages = [...insights, ...extraMessages];

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' });

  const handleQuickReply = (reply: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    const netWorth = accounts.reduce((s: number, a: any) => s + (a.type === 'credit' ? -a.balance : a.balance), 0);
    const monthTxns = transactions.filter((t: any) => { const d = new Date(t.date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const income = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;
    const investmentValue = investments.reduce((s: number, i: any) => s + i.current_value, 0);
    const investmentCost = investments.reduce((s: number, i: any) => s + i.amount, 0);
    const invReturn = investmentCost > 0 ? ((investmentValue - investmentCost) / investmentCost * 100).toFixed(1) : 0;

    const responses: Record<string, string> = {
      'How am I doing?': `This month: ${fmt(income)} income, ${fmt(expense)} expenses, ${savingsRate}% savings rate. Net worth: ${fmt(netWorth)}. ${savingsRate >= 20 ? 'Excellent work — you\'re beating the 20% savings benchmark!' : 'Aim for a 20%+ savings rate to build lasting wealth.'}`,
      'Reduce expenses?': expense > 0 ? `Your top expense areas this month total ${fmt(expense)}. Focus first on discretionary categories — dining, entertainment, and subscriptions. Even cutting 10% there saves ${fmt(expense * 0.1)}/month.` : 'No expense data yet. Start tracking to get personalized advice.',
      'Goal progress?': goals.length > 0 ? `${goals.length} active goal${goals.length > 1 ? 's' : ''}: ${goals.map((g: any) => `${g.name} at ${Math.round((g.saved_amount / g.target_amount) * 100)}%`).join(', ')}.` : 'No goals set. Add a savings goal to start tracking.',
      'Next bill due?': bills.filter((b: any) => !b.is_paid).length > 0 ? `Upcoming: ${bills.filter((b: any) => !b.is_paid)[0]?.name} for ${fmt(bills.filter((b: any) => !b.is_paid)[0]?.amount)} due day ${bills.filter((b: any) => !b.is_paid)[0]?.due_day}.` : 'All bills are paid! 🎉',
      'Savings rate?': `Current savings rate: ${savingsRate}%. That's ${fmt(Math.max(income - expense, 0))} saved from ${fmt(income)} income. ${savingsRate >= 20 ? 'Above the 20% target — well done.' : 'Target 20% or higher for strong financial health.'}`,
      'Net worth?': `Your net worth is ${fmt(netWorth)} across ${accounts.length} account${accounts.length !== 1 ? 's' : ''}. ${netWorth > 0 ? 'Positive net worth — you\'re building wealth.' : 'Work on paying down liabilities to grow net worth.'}`,
      'Investment returns?': investmentValue > 0 ? `Portfolio: ${fmt(investmentValue)} current value vs ${fmt(investmentCost)} invested — ${invReturn}% return. ${parseFloat(invReturn as string) >= 0 ? 'Positive performance!' : 'Down from cost basis; consider reviewing allocation.'}` : 'No investments tracked yet. Add your portfolio to see returns.',
      'Tax estimate?': `Based on ${fmt(income)} income this month (annualized: ~${fmt(income * 12)}), your estimated federal tax bracket is ${income * 12 > 89075 ? '22%' : income * 12 > 41775 ? '12%' : '10%'}. Use the Tax Estimator in the app for a more detailed calculation.`,
    };

    const response = responses[reply] || `Great question! Keep tracking your finances and I'll provide more specific insights over time.`;
    setExtraMessages(prev => [...prev, { id: `reply-${Date.now()}`, text: response, type: 'insight', timestamp: now }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const typeColor: Record<CoachMessage['type'], string> = { insight: colors.primary, warning: colors.warning, praise: colors.income, tip: colors.accent, summary: colors.foreground };
  const typeIcon: Record<CoachMessage['type'], any> = { insight: 'information-circle-outline', warning: 'alert-circle-outline', praise: 'star-outline', tip: 'bulb-outline', summary: 'document-text-outline' };
  const typeBg: Record<CoachMessage['type'], string> = { insight: colors.primary + '18', warning: colors.warning + '18', praise: colors.income + '18', tip: colors.accent + '18', summary: colors.card };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Fixed Header */}
      <View style={[styles.fixedHeader, { paddingTop: topPadding }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          {Platform.OS === 'ios' ? <BlurView intensity={80} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />}
        </Animated.View>
        <View style={styles.headerContent}>
          <View style={styles.coachProfile}>
            <LinearGradient colors={[colors.primary + '33', colors.accent + '22']} style={styles.avatarBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={[styles.avatarLetter, { color: colors.primary }]}>W</Text>
            </LinearGradient>
            <View>
              <Text style={[styles.coachName, { color: colors.foreground }]}>AI Financial Coach</Text>
              <View style={styles.onlineRow}>
                <View style={[styles.onlineDot, { backgroundColor: colors.income }]} />
                <Text style={[styles.coachSub, { color: colors.mutedForeground }]}>{allMessages.length} insights · Always up to date</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 8, paddingHorizontal: 16, paddingBottom: bottomPadding + 90 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
      >
        {allMessages.map((msg) => (
          <View key={msg.id} style={[styles.bubble, { backgroundColor: typeBg[msg.type] }]}>
            <View style={[styles.bubbleIcon, { backgroundColor: typeColor[msg.type] + '25' }]}>
              <Ionicons name={typeIcon[msg.type]} size={18} color={typeColor[msg.type]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bubbleType, { color: typeColor[msg.type] }]}>{msg.type.toUpperCase()}</Text>
              <Text style={[styles.bubbleText, { color: colors.foreground }]}>{msg.text}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.askLabel, { color: colors.mutedForeground }]}>Ask the Coach</Text>
        <View style={styles.quickGrid}>
          {quickReplies.map(r => (
            <TouchableOpacity
              key={r.text}
              style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleQuickReply(r.text)}
              activeOpacity={0.7}
            >
              <Ionicons name={r.icon as any} size={14} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>{r.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { paddingHorizontal: 16, paddingBottom: 12 },
  coachProfile: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 8 },
  avatarBg: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 22, fontWeight: '800' },
  coachName: { fontSize: 17, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  coachSub: { fontSize: 12 },
  bubble: { flexDirection: 'row', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12 },
  bubbleIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleType: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8, marginBottom: 5 },
  bubbleText: { fontSize: 14, lineHeight: 21 },
  divider: { height: 1, marginVertical: 20 },
  askLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
});
