import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';

interface Message {
  id: string;
  role: 'coach' | 'user';
  text: string;
  timestamp: Date;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

function pct(n: number) { return Math.round(n * 100) + '%'; }

function uid() { return Date.now().toString() + Math.random().toString(36).substr(2, 6); }

function generateAnswer(
  question: string,
  transactions: any[],
  bills: any[],
  goals: any[],
  accounts: any[],
  categories: any[],
  debts: any[],
  investments: any[],
): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const q = question.toLowerCase();

  const monthTxns = transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });

  const totalIncome = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? netSavings / totalIncome : 0;

  const netWorth = accounts.reduce((s: number, a: any) => {
    return s + (a.type === 'credit' ? -a.balance : a.balance);
  }, 0);

  const totalDebt = debts.reduce((s: number, d: any) => s + (d.amount - (d.paid_amount || 0)), 0);
  const investValue = investments.reduce((s: number, i: any) => s + i.current_value, 0);
  const investCost = investments.reduce((s: number, i: any) => s + i.amount, 0);
  const investReturn = investCost > 0 ? ((investValue - investCost) / investCost) * 100 : 0;

  const catSpend: Record<string, number> = {};
  monthTxns.filter((t: any) => t.type === 'expense' && t.category_id).forEach((t: any) => {
    catSpend[t.category_id] = (catSpend[t.category_id] || 0) + t.amount;
  });

  const topCats = Object.entries(catSpend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id, amt]) => {
      const cat = categories.find((c: any) => c.id === id);
      return cat ? `${cat.name} at ${fmt(amt)}` : null;
    })
    .filter(Boolean);

  const unpaidBills = bills.filter((b: any) => !b.is_paid);
  const nextBill = unpaidBills.sort((a: any, b: any) => a.due_day - b.due_day)[0];

  if (transactions.length === 0 && accounts.length === 0) {
    return "You haven't added any data yet. Start by creating an account and recording your first transaction. Once you have some financial history, I can give you detailed, personalized advice on your spending, savings, and goals.";
  }

  if (q.includes('how am i') || q.includes('doing') || q.includes('overview') || q.includes('summary')) {
    if (totalIncome === 0 && totalExpense === 0) {
      return `No transactions recorded for ${monthName} yet. Add your income and expenses to get a full picture of how you are doing this month.`;
    }
    const assessment = savingsRate >= 0.3 ? 'exceptional — you are building wealth fast'
      : savingsRate >= 0.2 ? 'healthy — right on track with the 20% savings goal'
      : savingsRate >= 0.1 ? 'moderate — a little more discipline would go a long way'
      : 'tight — expenses are consuming most of your income';
    return `In ${monthName} you have brought in ${fmt(totalIncome)} and spent ${fmt(totalExpense)}, leaving ${fmt(netSavings)} saved. Your savings rate is ${pct(savingsRate)}, which is ${assessment}. Your overall net worth stands at ${fmt(netWorth)}.${topCats.length > 0 ? ` Your top spending areas are ${topCats.join(', ')}.` : ''}`;
  }

  if (q.includes('savings rate') || q.includes('saving rate') || q.includes('how much saving')) {
    if (totalIncome === 0) return `No income recorded for ${monthName}. Add your income transactions to calculate your savings rate.`;
    const target = Math.max(0, totalIncome * 0.2 - netSavings);
    return `Your savings rate this month is ${pct(savingsRate)}, saving ${fmt(netSavings)} out of ${fmt(totalIncome)} earned. ${savingsRate >= 0.2 ? `That beats the recommended 20% benchmark. Keep it up.` : `To hit the 20% target you would need to save an additional ${fmt(target)} this month, which means cutting expenses by that amount.`}`;
  }

  if (q.includes('net worth') || q.includes('total wealth') || q.includes('worth')) {
    const accountLines = accounts.map((a: any) => `${a.name}: ${fmt(a.balance)}`).join(', ');
    return `Your net worth is ${fmt(netWorth)}.${accounts.length > 0 ? ` This is made up of ${accountLines}.` : ''} Net worth grows when you reduce debt, increase account balances, and invest consistently.`;
  }

  if (q.includes('budget') || q.includes('over budget') || q.includes('spending limit')) {
    const overBudget = categories.filter((c: any) => c.budget_limit > 0 && catSpend[c.id] > c.budget_limit);
    const nearBudget = categories.filter((c: any) => c.budget_limit > 0 && catSpend[c.id] >= c.budget_limit * 0.85 && catSpend[c.id] < c.budget_limit);
    if (overBudget.length === 0 && nearBudget.length === 0) {
      return `All your budgets are under control this month. ${categories.filter((c: any) => c.budget_limit > 0).length === 0 ? 'Consider setting budget limits on your categories to track spending more precisely.' : 'Great discipline — you are staying within your limits.'}`;
    }
    let msg = '';
    if (overBudget.length > 0) msg += `You are over budget in ${overBudget.map((c: any) => `${c.name} by ${fmt(catSpend[c.id] - c.budget_limit)}`).join(' and ')}. `;
    if (nearBudget.length > 0) msg += `You are close to the limit in ${nearBudget.map((c: any) => c.name).join(' and ')}, so ease up for the rest of the month.`;
    return msg.trim();
  }

  if (q.includes('reduce') || q.includes('cut') || q.includes('save more') || q.includes('spend less')) {
    if (topCats.length === 0) return 'No expense data for this month yet. As you record spending, I can identify where you can trim the most.';
    const biggestCatId = Object.entries(catSpend).sort((a, b) => b[1] - a[1])[0]?.[0];
    const biggestCat = categories.find((c: any) => c.id === biggestCatId);
    const biggestAmt = catSpend[biggestCatId] || 0;
    return `Your biggest expense this month is ${biggestCat?.name ?? 'miscellaneous'} at ${fmt(biggestAmt)}. A 10% reduction there would save you ${fmt(biggestAmt * 0.1)} per month, or ${fmt(biggestAmt * 0.1 * 12)} per year. Also review recurring subscriptions and dining out, as these are typically the easiest areas to cut without affecting quality of life.`;
  }

  if (q.includes('goal') || q.includes('target') || q.includes('saving for')) {
    if (goals.length === 0) return 'You have no savings goals set. Head to the Goals section to create one. Having a clear target makes saving feel more purposeful and measurable.';
    const goalLines = goals.map((g: any) => {
      const p = g.target_amount > 0 ? g.saved_amount / g.target_amount : 0;
      const remaining = g.target_amount - g.saved_amount;
      const monthsNeeded = netSavings > 0 ? Math.ceil(remaining / netSavings) : null;
      return `${g.name}: ${pct(p)} complete, ${fmt(remaining)} to go${monthsNeeded ? ` (about ${monthsNeeded} month${monthsNeeded !== 1 ? 's' : ''} at your current savings rate)` : ''}`;
    });
    return `You have ${goals.length} goal${goals.length !== 1 ? 's' : ''}: ${goalLines.join('. ')}.`;
  }

  if (q.includes('bill') || q.includes('due') || q.includes('upcoming') || q.includes('payment')) {
    if (bills.length === 0) return 'No bills tracked yet. Add your recurring bills so you never miss a payment.';
    if (unpaidBills.length === 0) return 'All your bills are paid for this period. Well done on staying current.';
    const billList = unpaidBills.slice(0, 5).map((b: any) => `${b.name} ${fmt(b.amount)} due on the ${b.due_day}${b.due_day === 1 ? 'st' : b.due_day === 2 ? 'nd' : b.due_day === 3 ? 'rd' : 'th'}`).join(', ');
    return `You have ${unpaidBills.length} unpaid bill${unpaidBills.length !== 1 ? 's' : ''}: ${billList}. Make sure you have enough in your main account before each due date.`;
  }

  if (q.includes('debt') || q.includes('loan') || q.includes('owe') || q.includes('payoff') || q.includes('pay off')) {
    if (debts.length === 0) return 'No debts tracked. If you have loans or credit card balances, add them to see your total liability and payoff timelines.';
    const debtLines = debts.map((d: any) => {
      const remaining = d.amount - (d.paid_amount || 0);
      const monthsLeft = netSavings > 0 && d.interest_rate === 0
        ? Math.ceil(remaining / netSavings)
        : null;
      return `${d.name}: ${fmt(remaining)} remaining at ${d.interest_rate}% interest${monthsLeft ? ` (${monthsLeft} months to clear at current pace)` : ''}`;
    });
    return `Total outstanding debt: ${fmt(totalDebt)}. Breakdown: ${debtLines.join('. ')}. Prioritise paying the highest interest rate debt first to minimise interest costs.`;
  }

  if (q.includes('invest') || q.includes('portfolio') || q.includes('return') || q.includes('stock') || q.includes('crypto')) {
    if (investments.length === 0) return 'No investments tracked yet. Add your stocks, crypto, or funds to monitor their performance over time.';
    const invLines = investments.map((i: any) => {
      const ret = i.amount > 0 ? ((i.current_value - i.amount) / i.amount) * 100 : 0;
      return `${i.name}: ${fmt(i.current_value)} (${ret >= 0 ? '+' : ''}${ret.toFixed(1)}%)`;
    });
    return `Your portfolio is worth ${fmt(investValue)} against a cost of ${fmt(investCost)}, giving a total return of ${investReturn >= 0 ? '+' : ''}${investReturn.toFixed(1)}%. Positions: ${invLines.join(', ')}.`;
  }

  if (q.includes('tax') || q.includes('bracket') || q.includes('owe tax')) {
    const annualized = totalIncome * 12;
    const bracket = annualized > 578125 ? '37%'
      : annualized > 231250 ? '35%'
      : annualized > 182994 ? '32%'
      : annualized > 95375 ? '24%'
      : annualized > 44725 ? '22%'
      : annualized > 11000 ? '12%'
      : '10%';
    return `Based on your ${monthName} income of ${fmt(totalIncome)}, your annualized income is roughly ${fmt(annualized)}, placing you in the ${bracket} marginal federal tax bracket. Note this is an estimate for a single filer with no deductions. Use the Tax Estimator in the app for a more precise calculation.`;
  }

  if (q.includes('emergency fund') || q.includes('rainy day') || q.includes('safety net')) {
    const monthlyExpense = totalExpense > 0 ? totalExpense : 0;
    const recommended = monthlyExpense * 6;
    const totalBalance = accounts.reduce((s: number, a: any) => s + a.balance, 0);
    const covered = recommended > 0 ? totalBalance / recommended : 0;
    return `A solid emergency fund covers 3 to 6 months of expenses. Based on your current spending of ${fmt(monthlyExpense)} per month, you should aim for ${fmt(recommended)}. Your current account balance of ${fmt(totalBalance)} covers roughly ${(covered * 6).toFixed(1)} months of expenses.`;
  }

  if (q.includes('income') || q.includes('earn') || q.includes('revenue')) {
    if (totalIncome === 0) return `No income recorded for ${monthName}. Add your salary, freelance payments, or any other earnings to track your cash flow.`;
    const incomeTxns = monthTxns.filter((t: any) => t.type === 'income');
    const incomeLines = incomeTxns.map((t: any) => `${t.description}: ${fmt(t.amount)}`).join(', ');
    return `Your total income for ${monthName} is ${fmt(totalIncome)} from ${incomeTxns.length} source${incomeTxns.length !== 1 ? 's' : ''}: ${incomeLines}. Annualized, that is approximately ${fmt(totalIncome * 12)} per year.`;
  }

  if (q.includes('expense') || q.includes('spending') || q.includes('spent')) {
    if (totalExpense === 0) return `No expenses recorded for ${monthName}. Start logging your transactions to see where your money is going.`;
    return `You have spent ${fmt(totalExpense)} so far in ${monthName}.${topCats.length > 0 ? ` Your top categories are ${topCats.join(', ')}.` : ''} That leaves ${fmt(netSavings)} of your income unspent.`;
  }

  if (q.includes('account') || q.includes('balance') || q.includes('bank')) {
    if (accounts.length === 0) return 'No accounts added yet. Create your first account to start tracking your balances.';
    const accLines = accounts.map((a: any) => `${a.name}: ${fmt(a.balance)}`).join(', ');
    return `You have ${accounts.length} account${accounts.length !== 1 ? 's' : ''}: ${accLines}. Total across all accounts: ${fmt(accounts.reduce((s: number, a: any) => s + a.balance, 0))}.`;
  }

  if (q.includes('tip') || q.includes('advice') || q.includes('recommend') || q.includes('suggest') || q.includes('help')) {
    const tips = [
      `Pay yourself first: set aside your savings target as soon as income arrives, before spending on anything else.`,
      `The 50/30/20 rule is a solid starting point: 50% of income on needs, 30% on wants, and 20% on savings and debt repayment.`,
      `Automate recurring bills to avoid late fees and protect your credit score.`,
      `Review subscriptions every 3 months. Most people are paying for services they no longer use.`,
      `An emergency fund of 3 to 6 months of expenses is your financial safety net — prioritise it before investing.`,
    ];
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return tip;
  }

  return `I can answer questions about your spending, savings rate, net worth, goals, bills, debts, investments, and tax estimates. Try asking something like "How am I doing this month?" or "How can I reduce expenses?" — I will use your real financial data to give a precise, personalised answer.`;
}

function generateAutoInsights(
  transactions: any[], bills: any[], goals: any[],
  accounts: any[], categories: any[], debts: any[]
): string {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  if (transactions.length === 0 && accounts.length === 0) {
    return `Welcome to your Wealthly Coach. I analyse your real financial data to give you precise, personal guidance on spending, saving, debt, and investments. Add your first account and some transactions to get started.`;
  }

  const monthTxns = transactions.filter((t: any) => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year;
  });
  const income = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
  const expense = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
  const savingsRate = income > 0 ? (income - expense) / income : 0;
  const netWorth = accounts.reduce((s: number, a: any) => s + (a.type === 'credit' ? -a.balance : a.balance), 0);

  const dueSoon = bills.filter((b: any) => {
    if (b.is_paid) return false;
    const daysUntilDue = b.due_day - now.getDate();
    return daysUntilDue >= 0 && daysUntilDue <= 5;
  });

  let msg = `In ${monthName} you have earned ${fmt(income)} and spent ${fmt(expense)}, giving a ${pct(savingsRate)} savings rate. Your net worth is ${fmt(netWorth)}.`;

  if (dueSoon.length > 0) {
    msg += ` Watch out — ${dueSoon.map((b: any) => b.name).join(' and ')} ${dueSoon.length === 1 ? 'is' : 'are'} due soon.`;
  }

  const goalNearDone = goals.find((g: any) => {
    const p = g.target_amount > 0 ? g.saved_amount / g.target_amount : 0;
    return p >= 0.9 && p < 1;
  });
  if (goalNearDone) {
    msg += ` You are almost at your "${goalNearDone.name}" goal — just ${fmt(goalNearDone.target_amount - goalNearDone.saved_amount)} to go.`;
  }

  return msg;
}

const QUICK_QUESTIONS = [
  { text: 'How am I doing?', icon: 'trending-up-outline' },
  { text: 'Savings rate?', icon: 'leaf-outline' },
  { text: 'Reduce expenses?', icon: 'cut-outline' },
  { text: 'Goal progress?', icon: 'flag-outline' },
  { text: 'Next bill due?', icon: 'calendar-outline' },
  { text: 'Net worth?', icon: 'wallet-outline' },
  { text: 'Investment returns?', icon: 'bar-chart-outline' },
  { text: 'Debt payoff?', icon: 'trending-down-outline' },
  { text: 'Emergency fund?', icon: 'shield-outline' },
  { text: 'Tax estimate?', icon: 'calculator-outline' },
];

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { transactions, bills, goals, accounts, categories, debts, investments } = useFinance();

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;
  const HEADER_HEIGHT = topPadding + 100;

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = new Animated.Value(0);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const headerOpacity = scrollY.interpolate({ inputRange: [0, 40], outputRange: [0, 1], extrapolate: 'clamp' });

  const initialMessage = useMemo<Message>(() => ({
    id: 'intro',
    role: 'coach',
    text: generateAutoInsights(transactions, bills, goals, accounts, categories, debts),
    timestamp: new Date(),
  }), []);

  const [messages, setMessages] = useState<Message[]>([initialMessage]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { id: uid(), role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    setTimeout(() => {
      const answer = generateAnswer(text, transactions, bills, goals, accounts, categories, debts, investments);
      const coachMsg: Message = { id: uid(), role: 'coach', text: answer, timestamp: new Date() };
      setMessages(prev => [...prev, coachMsg]);
      setIsTyping(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 800 + Math.random() * 600);
  }, [transactions, bills, goals, accounts, categories, debts, investments]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.fixedHeader, { paddingTop: topPadding }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: headerOpacity }]}>
          {Platform.OS === 'ios'
            ? <BlurView intensity={80} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          }
        </Animated.View>
        <View style={styles.headerContent}>
          <LinearGradient colors={[colors.primary + '33', colors.accent + '22']} style={styles.avatarBg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={[styles.avatarLetter, { color: colors.primary }]}>W</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={[styles.coachName, { color: colors.foreground }]}>Wealthly Coach</Text>
            <View style={styles.onlineRow}>
              <View style={[styles.onlineDot, { backgroundColor: colors.income }]} />
              <Text style={[styles.coachSub, { color: colors.mutedForeground }]}>Powered by your real data</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT + 8, paddingHorizontal: 16, paddingBottom: 16 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        keyboardDismissMode="on-drag"
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.role === 'user'
                ? [styles.userBubble, { backgroundColor: colors.primary }]
                : [styles.coachBubble, { backgroundColor: colors.card }],
            ]}
          >
            {msg.role === 'coach' && (
              <View style={[styles.coachDot, { backgroundColor: colors.primary + '25' }]}>
                <Ionicons name="sparkles" size={14} color={colors.primary} />
              </View>
            )}
            <Text style={[
              styles.bubbleText,
              { color: msg.role === 'user' ? colors.primaryForeground : colors.foreground },
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.bubble, styles.coachBubble, { backgroundColor: colors.card }]}>
            <View style={[styles.coachDot, { backgroundColor: colors.primary + '25' }]}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
            </View>
            <View style={styles.typingDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
              ))}
            </View>
          </View>
        )}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.quickLabel, { color: colors.mutedForeground }]}>Quick questions</Text>
        <View style={styles.quickGrid}>
          {QUICK_QUESTIONS.map(q => (
            <TouchableOpacity
              key={q.text}
              style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => sendMessage(q.text)}
              activeOpacity={0.7}
            >
              <Ionicons name={q.icon as any} size={13} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.foreground }]}>{q.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: bottomPadding + 80 }} />
      </ScrollView>

      <View style={[
        styles.inputBar,
        { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: bottomPadding + 8 },
      ]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
          placeholder="Ask anything about your finances..."
          placeholderTextColor={colors.mutedForeground}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage(inputText)}
          blurOnSubmit
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.border }]}
          onPress={() => sendMessage(inputText)}
          disabled={!inputText.trim() || isTyping}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={20} color={inputText.trim() ? colors.primaryForeground : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  fixedHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 },
  avatarBg: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: '800' },
  coachName: { fontSize: 16, fontWeight: '700' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  coachSub: { fontSize: 12 },
  bubble: { maxWidth: '88%', borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  coachBubble: { alignSelf: 'flex-start' },
  userBubble: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  coachDot: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  bubbleText: { fontSize: 14, lineHeight: 22, flex: 1 },
  typingDots: { flexDirection: 'row', gap: 5, alignItems: 'center', paddingVertical: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, opacity: 0.6 },
  divider: { height: 1, marginVertical: 20 },
  quickLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  inputBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, paddingTop: 10, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  textInput: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
