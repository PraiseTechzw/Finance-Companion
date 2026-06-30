import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { ProgressBar } from '@/components/ProgressBar';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n); }

interface TaxBracket { min: number; max: number; rate: number; label: string; }

const BRACKETS_SINGLE_2024: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.10, label: '10%' },
  { min: 11600, max: 47150, rate: 0.12, label: '12%' },
  { min: 47150, max: 100525, rate: 0.22, label: '22%' },
  { min: 100525, max: 191950, rate: 0.24, label: '24%' },
  { min: 191950, max: 243725, rate: 0.32, label: '32%' },
  { min: 243725, max: 609350, rate: 0.35, label: '35%' },
  { min: 609350, max: Infinity, rate: 0.37, label: '37%' },
];

const BRACKETS_MFJ_2024: TaxBracket[] = [
  { min: 0, max: 23200, rate: 0.10, label: '10%' },
  { min: 23200, max: 94300, rate: 0.12, label: '12%' },
  { min: 94300, max: 201050, rate: 0.22, label: '22%' },
  { min: 201050, max: 383900, rate: 0.24, label: '24%' },
  { min: 383900, max: 487450, rate: 0.32, label: '32%' },
  { min: 487450, max: 731200, rate: 0.35, label: '35%' },
  { min: 731200, max: Infinity, rate: 0.37, label: '37%' },
];

const STD_DEDUCTION = { single: 14600, mfj: 29200, hoh: 21900 };
const FICA_RATE = 0.0765;
const SELF_EMPLOYED_RATE = 0.153;

type FilingStatus = 'single' | 'mfj' | 'hoh';

function calcTax(taxableIncome: number, brackets: TaxBracket[]) {
  let tax = 0;
  let remaining = taxableIncome;
  const details: { bracket: string; amount: number; tax: number }[] = [];
  for (const b of brackets) {
    if (remaining <= 0) break;
    const taxableInBracket = Math.min(remaining, b.max - b.min);
    const taxForBracket = taxableInBracket * b.rate;
    details.push({ bracket: b.label, amount: taxableInBracket, tax: taxForBracket });
    tax += taxForBracket;
    remaining -= taxableInBracket;
  }
  return { tax, details };
}

export default function TaxScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions } = useFinance();

  const now = new Date();
  const ytdIncome = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === now.getFullYear() && t.type === 'income';
  }).reduce((s, t) => s + t.amount, 0), [transactions]);

  const [income, setIncome] = useState(String(Math.round(ytdIncome * 12 / (now.getMonth() + 1)) || 75000));
  const [deductions, setDeductions] = useState('0');
  const [filing, setFiling] = useState<FilingStatus>('single');
  const [selfEmployed, setSelfEmployed] = useState(false);

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const results = useMemo(() => {
    const grossIncome = parseFloat(income) || 0;
    const addlDeductions = parseFloat(deductions) || 0;
    const stdDed = STD_DEDUCTION[filing];
    const totalDed = Math.max(stdDed, addlDeductions) + (selfEmployed ? grossIncome * 0.5 * SELF_EMPLOYED_RATE : 0);
    const taxableIncome = Math.max(0, grossIncome - totalDed);
    const brackets = filing === 'mfj' ? BRACKETS_MFJ_2024 : BRACKETS_SINGLE_2024;
    const { tax: federalTax, details } = calcTax(taxableIncome, brackets);
    const ficaTax = selfEmployed ? grossIncome * SELF_EMPLOYED_RATE : grossIncome * FICA_RATE;
    const stateTax = grossIncome * 0.05; // ~5% state estimate
    const totalTax = federalTax + ficaTax + stateTax;
    const effectiveRate = grossIncome > 0 ? totalTax / grossIncome : 0;
    const afterTax = grossIncome - totalTax;
    const marginalBracket = brackets.find(b => taxableIncome > b.min && taxableIncome <= b.max);
    return { grossIncome, taxableIncome, totalDed, federalTax, ficaTax, stateTax, totalTax, effectiveRate, afterTax, details, marginalRate: marginalBracket?.rate || 0.10, marginalLabel: marginalBracket?.label || '10%' };
  }, [income, deductions, filing, selfEmployed]);

  const filingOptions: { key: FilingStatus; label: string }[] = [
    { key: 'single', label: 'Single' },
    { key: 'mfj', label: 'Married' },
    { key: 'hoh', label: 'Head of H.' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Tax Estimator</Text>
        <View style={[styles.yearPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.yearText, { color: colors.foreground }]}>2024</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {/* Result card */}
        <View style={[styles.resultCard, { marginBottom: 16 }]}>
          <LinearGradient colors={['#0D1B35', '#122040']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.resultLabel}>Estimated Total Tax</Text>
              <Text style={styles.resultAmount}>{fmt(results.totalTax)}</Text>
            </View>
            <View style={[styles.bracketPill, { backgroundColor: 'rgba(16,185,129,0.2)' }]}>
              <Text style={[styles.bracketText, { color: '#10B981' }]}>{results.marginalLabel} bracket</Text>
            </View>
          </View>
          <ProgressBar progress={results.effectiveRate} height={6} color="#10B981" />
          <Text style={styles.rateText}>Effective rate: {(results.effectiveRate * 100).toFixed(1)}% · Take-home: {fmt(results.afterTax)}</Text>
          <View style={styles.taxBreakdownRow}>
            <View style={styles.taxBreakdownItem}>
              <Text style={styles.taxBreakdownLabel}>Federal</Text>
              <Text style={styles.taxBreakdownValue}>{fmt(results.federalTax)}</Text>
            </View>
            <View style={styles.taxBreakdownItem}>
              <Text style={styles.taxBreakdownLabel}>FICA</Text>
              <Text style={styles.taxBreakdownValue}>{fmt(results.ficaTax)}</Text>
            </View>
            <View style={styles.taxBreakdownItem}>
              <Text style={styles.taxBreakdownLabel}>State ~</Text>
              <Text style={styles.taxBreakdownValue}>{fmt(results.stateTax)}</Text>
            </View>
          </View>
        </View>

        {/* Inputs */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>INCOME</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.inputPrefix, { color: colors.mutedForeground }]}>$</Text>
          <TextInput style={[styles.input, { color: colors.foreground }]} value={income} onChangeText={setIncome} keyboardType="numeric" placeholder="Annual income" placeholderTextColor={colors.mutedForeground} />
        </View>
        {ytdIncome > 0 && (
          <TouchableOpacity style={[styles.autofillBtn, { borderColor: colors.border }]} onPress={() => { setIncome(String(Math.round(ytdIncome * 12 / (now.getMonth() + 1)))); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}>
            <Ionicons name="flash-outline" size={14} color={colors.primary} />
            <Text style={[styles.autofillText, { color: colors.primary }]}>Use YTD estimate: {fmt(Math.round(ytdIncome * 12 / (now.getMonth() + 1)))}</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>FILING STATUS</Text>
        <View style={[styles.filingRow, { backgroundColor: colors.card }]}>
          {filingOptions.map(opt => (
            <TouchableOpacity key={opt.key} style={[styles.filingBtn, { backgroundColor: filing === opt.key ? colors.primary : 'transparent' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFiling(opt.key); }}>
              <Text style={[styles.filingText, { color: filing === opt.key ? colors.primaryForeground : colors.mutedForeground }]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ADDITIONAL DEDUCTIONS</Text>
        <View style={[styles.inputRow, { backgroundColor: colors.card }]}>
          <Text style={[styles.inputPrefix, { color: colors.mutedForeground }]}>$</Text>
          <TextInput style={[styles.input, { color: colors.foreground }]} value={deductions} onChangeText={setDeductions} keyboardType="numeric" placeholder="IRA, mortgage interest, etc." placeholderTextColor={colors.mutedForeground} />
        </View>

        <TouchableOpacity style={[styles.selfEmpRow, { backgroundColor: colors.card }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelfEmployed(s => !s); }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.selfEmpLabel, { color: colors.foreground }]}>Self-Employed</Text>
            <Text style={[styles.selfEmpSub, { color: colors.mutedForeground }]}>Includes 15.3% self-employment tax + deduction</Text>
          </View>
          <View style={[styles.toggle, { backgroundColor: selfEmployed ? colors.primary : colors.secondary }]}>
            <View style={[styles.toggleThumb, { left: selfEmployed ? 22 : 2 }]} />
          </View>
        </TouchableOpacity>

        {/* Bracket breakdown */}
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground, marginTop: 16 }]}>BRACKET BREAKDOWN</Text>
        {results.details.filter(d => d.amount > 0).map((d, i) => (
          <View key={i} style={[styles.bracketRow, { backgroundColor: colors.card }]}>
            <View style={[styles.bracketRateBox, { backgroundColor: colors.primary + '22' }]}>
              <Text style={[styles.bracketRateText, { color: colors.primary }]}>{d.bracket}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bracketIncome, { color: colors.foreground }]}>{fmt(d.amount)} taxed</Text>
              <ProgressBar progress={d.amount / results.grossIncome} height={4} color={colors.primary} />
            </View>
            <Text style={[styles.bracketTax, { color: colors.expense }]}>{fmt(d.tax)}</Text>
          </View>
        ))}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          * Estimates only. Standard deduction applied unless additional deductions exceed it. State tax estimated at ~5%. Consult a tax professional for accurate advice.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  yearPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  yearText: { fontSize: 12, fontWeight: '600' },
  resultCard: { borderRadius: 20, overflow: 'hidden', padding: 20, gap: 12 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resultLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 },
  resultAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  bracketPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  bracketText: { fontSize: 12, fontWeight: '700' },
  rateText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  taxBreakdownRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 12 },
  taxBreakdownItem: { alignItems: 'center' },
  taxBreakdownLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 3 },
  taxBreakdownValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, marginBottom: 8 },
  inputPrefix: { fontSize: 18, fontWeight: '600', marginRight: 4 },
  input: { flex: 1, fontSize: 18, fontWeight: '600', paddingVertical: 12 },
  autofillBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16, alignSelf: 'flex-start' },
  autofillText: { fontSize: 12, fontWeight: '500' },
  filingRow: { flexDirection: 'row', borderRadius: 14, padding: 3, marginBottom: 16 },
  filingBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11 },
  filingText: { fontSize: 13, fontWeight: '600' },
  selfEmpRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 16, gap: 12, marginBottom: 16 },
  selfEmpLabel: { fontSize: 15, fontWeight: '500' },
  selfEmpSub: { fontSize: 12, marginTop: 2 },
  toggle: { width: 50, height: 28, borderRadius: 14 },
  toggleThumb: { position: 'absolute', top: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  bracketRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8 },
  bracketRateBox: { width: 44, alignItems: 'center', borderRadius: 8, paddingVertical: 6 },
  bracketRateText: { fontSize: 13, fontWeight: '700' },
  bracketIncome: { fontSize: 12, marginBottom: 6 },
  bracketTax: { fontSize: 13, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  disclaimer: { fontSize: 11, lineHeight: 16, marginTop: 16, textAlign: 'center' },
});
