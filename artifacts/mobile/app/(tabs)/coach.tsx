import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function generateInsights(transactions: any[], bills: any[], goals: any[], accounts: any[], categories: any[], debts: any[]): CoachMessage[] {
  const messages: CoachMessage[] = [];
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = now.getDate();

  const monthTxns = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const income = monthTxns.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const expense = monthTxns.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  // Monthly summary
  if (income > 0 || expense > 0) {
    const saved = income - expense;
    const emoji = savingsRate >= 0.2 ? 'great' : savingsRate >= 0.1 ? 'good' : 'warning';
    messages.push({
      id: 'summary',
      text: `${monthName} so far: income ${fmt(income)}, expenses ${fmt(expense)}, saved ${fmt(Math.max(saved, 0))} (${Math.round(savingsRate * 100)}%). ${savingsRate >= 0.2 ? 'Excellent work!' : savingsRate >= 0.1 ? 'Decent progress — aim for 20% savings.' : 'Your expenses are high this month. Consider cutting back.'}`,
      type: 'summary',
      timestamp: new Date(),
    });
  }

  // Savings rate praise/warning
  if (savingsRate >= 0.25) {
    messages.push({
      id: 'savings-praise',
      text: `Impressive! You're saving ${Math.round(savingsRate * 100)}% of your income — well above the recommended 20%. Keep this up and you'll hit your financial goals faster than planned.`,
      type: 'praise',
      timestamp: new Date(),
    });
  } else if (savingsRate < 0.05 && income > 0) {
    messages.push({
      id: 'savings-warn',
      text: `Your savings rate this month is only ${Math.round(savingsRate * 100)}%. Financial advisors recommend saving at least 20% of income. Try reducing dining or entertainment spending.`,
      type: 'warning',
      timestamp: new Date(),
    });
  }

  // Category spending analysis
  const catSpend: Record<string, number> = {};
  monthTxns.filter((t: any) => t.type === 'expense' && t.category_id).forEach((t: any) => {
    catSpend[t.category_id] = (catSpend[t.category_id] || 0) + t.amount;
  });

  categories.forEach((cat: any) => {
    if (cat.budget_limit > 0 && catSpend[cat.id]) {
      const pct = catSpend[cat.id] / cat.budget_limit;
      if (pct >= 1.0) {
        messages.push({
          id: `over-${cat.id}`,
          text: `You've exceeded your ${cat.name} budget (${fmt(catSpend[cat.id])} vs ${fmt(cat.budget_limit)} limit). Consider pulling back in this category for the rest of the month.`,
          type: 'warning',
          timestamp: new Date(),
        });
      } else if (pct >= 0.85) {
        const daysLeft = daysInMonth - dayOfMonth;
        messages.push({
          id: `near-${cat.id}`,
          text: `You've used ${Math.round(pct * 100)}% of your ${cat.name} budget with ${daysLeft} days left this month. Slow down to stay on track.`,
          type: 'tip',
          timestamp: new Date(),
        });
      }
    }
  });

  // Bills due soon
  const dueSoon = bills.filter((b: any) => {
    if (b.is_paid) return false;
    const due = new Date(b.next_due);
    const diff = (due.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff <= 5 && diff >= 0;
  });

  dueSoon.forEach((bill: any) => {
    const due = new Date(bill.next_due);
    const diff = Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    messages.push({
      id: `bill-${bill.id}`,
      text: `Reminder: Your ${bill.name} bill of ${fmt(bill.amount)} is due in ${diff === 0 ? 'today' : `${diff} day${diff > 1 ? 's' : ''}`}. Make sure you have enough funds.`,
      type: 'warning',
      timestamp: new Date(),
    });
  });

  // Goals progress
  goals.forEach((goal: any) => {
    const progress = goal.target_amount > 0 ? goal.saved_amount / goal.target_amount : 0;
    if (progress >= 1) {
      messages.push({
        id: `goal-done-${goal.id}`,
        text: `Congratulations! You've fully funded your "${goal.name}" goal. What an achievement! Time to set a new one or celebrate responsibly.`,
        type: 'praise',
        timestamp: new Date(),
      });
    } else if (progress >= 0.5 && progress < 0.6) {
      messages.push({
        id: `goal-half-${goal.id}`,
        text: `Halfway there! You've saved ${fmt(goal.saved_amount)} toward your "${goal.name}" goal of ${fmt(goal.target_amount)}. Keep the momentum going.`,
        type: 'insight',
        timestamp: new Date(),
      });
    }
  });

  // Debt progress
  debts.forEach((debt: any) => {
    if (debt.amount > 0) {
      const pct = debt.paid_amount / debt.amount;
      if (pct >= 0.5 && pct < 0.6) {
        messages.push({
          id: `debt-${debt.id}`,
          text: `Great progress! You've paid off 50% of your "${debt.name}" debt. ${fmt(debt.amount - debt.paid_amount)} remaining — you're on the right track.`,
          type: 'praise',
          timestamp: new Date(),
        });
      }
    }
  });

  // Default message if nothing to report
  if (messages.length === 0) {
    messages.push({
      id: 'default',
      text: `Welcome to your financial coach! As you track more transactions, I'll analyze your spending patterns and provide personalized insights to help you reach your financial goals. Start by adding some transactions.`,
      type: 'tip',
      timestamp: new Date(),
    });
  }

  return messages;
}

const quickReplies = [
  'How am I doing?',
  'Cut expenses?',
  'Goal progress?',
  'Next bill?',
  'Savings rate?',
  'Net worth?',
];

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, bills, goals, accounts, categories, debts } = useFinance();
  const [extraMessages, setExtraMessages] = useState<CoachMessage[]>([]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const insights = useMemo(() =>
    generateInsights(transactions, bills, goals, accounts, categories, debts),
    [transactions, bills, goals, accounts, categories, debts]
  );

  const allMessages = [...insights, ...extraMessages];

  const handleQuickReply = (reply: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const now = new Date();
    const netWorth = accounts.reduce((s: number, a: any) => s + (a.type === 'credit' ? -a.balance : a.balance), 0);
    const monthTxns = transactions.filter((t: any) => {
      const d = new Date(t.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

    const responses: Record<string, string> = {
      'How am I doing?': `This month: ${fmt(income)} income, ${fmt(expense)} expenses, ${savingsRate}% savings rate. ${savingsRate >= 20 ? 'You\'re doing great!' : 'Aim for at least 20% savings.'}`,
      'Cut expenses?': expense > 0 ? `Your top spending categories this month total ${fmt(expense)}. Focus on discretionary categories like dining and entertainment first — small cuts there compound quickly.` : 'No expense data yet for this month. Start tracking to get personalized advice.',
      'Goal progress?': goals.length > 0 ? `You have ${goals.length} active goal${goals.length > 1 ? 's' : ''}. ${goals.map((g: any) => `${g.name}: ${Math.round((g.saved_amount / g.target_amount) * 100)}%`).join(', ')}.` : 'No goals set yet. Add a savings goal to start tracking your progress.',
      'Next bill?': bills.filter((b: any) => !b.is_paid).length > 0 ? `Next upcoming bill: ${bills.filter((b: any) => !b.is_paid)[0]?.name} for ${fmt(bills.filter((b: any) => !b.is_paid)[0]?.amount)} due day ${bills.filter((b: any) => !b.is_paid)[0]?.due_day}.` : 'No unpaid bills found. Great job staying current!',
      'Savings rate?': `Your current savings rate is ${savingsRate}% (${fmt(Math.max(income - expense, 0))} saved from ${fmt(income)} income). ${savingsRate >= 20 ? 'Excellent — above the 20% benchmark.' : 'Target: 20% or higher for strong financial health.'}`,
      'Net worth?': `Your current net worth is ${fmt(netWorth)}, across ${accounts.length} account${accounts.length !== 1 ? 's' : ''}. ${netWorth > 0 ? 'Positive net worth — great foundation.' : 'Work on reducing liabilities to grow your net worth.'}`,
    };

    const response = responses[reply] || `Great question about "${reply}"! Keep tracking your finances and I'll have more specific insights for you.`;
    setExtraMessages(prev => [...prev, {
      id: `reply-${Date.now()}`,
      text: response,
      type: 'insight',
      timestamp: new Date(),
    }]);
  };

  const typeColor: Record<CoachMessage['type'], string> = {
    insight: colors.primary,
    warning: colors.warning,
    praise: colors.income,
    tip: colors.accent,
    summary: colors.foreground,
  };

  const typeIcon: Record<CoachMessage['type'], any> = {
    insight: 'information-circle-outline',
    warning: 'alert-circle-outline',
    praise: 'star-outline',
    tip: 'bulb-outline',
    summary: 'document-text-outline',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <LinearGradient colors={[colors.primary + '22', colors.accent + '11']} style={styles.avatarGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>W</Text>
        </LinearGradient>
        <View>
          <Text style={[styles.coachName, { color: colors.foreground }]}>Financial Coach</Text>
          <Text style={[styles.coachSub, { color: colors.income }]}>Active · {allMessages.length} insights</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding + 90 }}>
        {allMessages.map((msg) => (
          <View key={msg.id} style={[styles.bubble, { backgroundColor: colors.card }]}>
            <View style={[styles.bubbleIcon, { backgroundColor: typeColor[msg.type] + '20' }]}>
              <Ionicons name={typeIcon[msg.type]} size={16} color={typeColor[msg.type]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bubbleType, { color: typeColor[msg.type] }]}>
                {msg.type.charAt(0).toUpperCase() + msg.type.slice(1)}
              </Text>
              <Text style={[styles.bubbleText, { color: colors.foreground }]}>{msg.text}</Text>
            </View>
          </View>
        ))}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.askLabel, { color: colors.mutedForeground }]}>Ask the Coach</Text>

        <View style={styles.quickGrid}>
          {quickReplies.map(r => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => handleQuickReply(r)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: colors.foreground }]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  avatarGrad: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '700' },
  coachName: { fontSize: 17, fontWeight: '700' },
  coachSub: { fontSize: 12, marginTop: 1 },
  bubble: { flexDirection: 'row', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12 },
  bubbleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubbleType: { fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  divider: { height: 1, marginVertical: 20 },
  askLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
});
