import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, Debt } from '@/context/FinanceContext';
import { ProgressBar } from '@/components/ProgressBar';
import { EmptyState } from '@/components/EmptyState';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

export default function DebtModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { debts, addDebt, editDebt, deleteDebt } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [payment, setPayment] = useState('');
  const [name, setName] = useState('');
  const [creditor, setCreditor] = useState('');
  const [amount, setAmount] = useState('');
  const [interest, setInterest] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [type, setType] = useState<Debt['type']>('owed');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const totalOwed = debts.filter(d => d.type === 'owed').reduce((s, d) => s + (d.amount - d.paid_amount), 0);
  const totalLending = debts.filter(d => d.type === 'lending').reduce((s, d) => s + (d.amount - d.paid_amount), 0);

  const handleAdd = () => {
    if (!name.trim() || !amount || !creditor.trim()) { Alert.alert('Required', 'Name, creditor, and amount are required'); return; }
    addDebt({ name: name.trim(), creditor: creditor.trim(), amount: parseFloat(amount), paid_amount: 0, interest_rate: parseFloat(interest) || 0, due_date: dueDate || null, type, notes: null });
    setShowAdd(false); setName(''); setCreditor(''); setAmount(''); setInterest(''); setDueDate('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePayment = (debtId: string) => {
    const amt = parseFloat(payment);
    if (!amt || amt <= 0) { Alert.alert('Invalid', 'Enter a valid payment amount'); return; }
    const debt = debts.find(d => d.id === debtId);
    if (debt) editDebt(debtId, { paid_amount: Math.min(debt.paid_amount + amt, debt.amount) });
    setShowPayment(null); setPayment('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Debt', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDebt(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Debt Tracker</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.expense + '18', borderColor: colors.expense + '33' }]}>
          <Text style={[styles.summaryLabel, { color: colors.expense }]}>I OWE</Text>
          <Text style={[styles.summaryValue, { color: colors.expense }]}>{fmt(totalOwed)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.income + '18', borderColor: colors.income + '33' }]}>
          <Text style={[styles.summaryLabel, { color: colors.income }]}>OWED TO ME</Text>
          <Text style={[styles.summaryValue, { color: colors.income }]}>{fmt(totalLending)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {debts.length === 0 ? (
          <EmptyState icon="card-outline" title="No debts tracked" subtitle="Add debts or loans to track your payoff progress" />
        ) : (
          debts.map(debt => {
            const remaining = debt.amount - debt.paid_amount;
            const progress = debt.amount > 0 ? debt.paid_amount / debt.amount : 0;
            const isPaidOff = remaining <= 0;
            return (
              <View key={debt.id} style={[styles.debtCard, { backgroundColor: colors.card }]}>
                {isPaidOff && (
                  <View style={[styles.paidOffBanner, { backgroundColor: colors.income + '22' }]}>
                    <Ionicons name="checkmark-circle" size={12} color={colors.income} />
                    <Text style={[styles.paidOffText, { color: colors.income }]}>Paid Off!</Text>
                  </View>
                )}
                <View style={styles.debtRow}>
                  <View>
                    <Text style={[styles.debtName, { color: colors.foreground }]}>{debt.name}</Text>
                    <Text style={[styles.debtCreditor, { color: colors.mutedForeground }]}>{debt.type === 'owed' ? 'To: ' : 'From: '}{debt.creditor}</Text>
                    {debt.interest_rate > 0 && <Text style={[styles.debtInterest, { color: colors.warning }]}>{debt.interest_rate}% APR</Text>}
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.debtRemaining, { color: debt.type === 'owed' ? colors.expense : colors.income }]}>{fmt(remaining)}</Text>
                    <Text style={[styles.debtMeta, { color: colors.mutedForeground }]}>remaining</Text>
                  </View>
                </View>
                <View style={styles.debtProgress}>
                  <ProgressBar progress={progress} height={6} color={debt.type === 'owed' ? colors.expense : colors.income} />
                  <Text style={[styles.debtPct, { color: colors.mutedForeground }]}>Paid: {Math.round(progress * 100)}% · {fmt(debt.paid_amount)} of {fmt(debt.amount)}</Text>
                </View>
                {!isPaidOff && (
                  <View style={styles.debtActions}>
                    <TouchableOpacity style={[styles.payBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowPayment(debt.id); setPayment(''); }}>
                      <Text style={[styles.payBtnText, { color: colors.primary }]}>Record Payment</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(debt.id, debt.name)} style={{ padding: 8 }}>
                      <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Debt</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['owed', 'lending'] as Debt['type'][]).map(t => (
                <TouchableOpacity key={t} style={[styles.typeChip, { flex: 1, backgroundColor: type === t ? colors.primary + '22' : colors.card, borderColor: type === t ? colors.primary : colors.border }]} onPress={() => setType(t)}>
                  <Text style={[styles.typeChipText, { color: type === t ? colors.primary : colors.mutedForeground }]}>{t === 'owed' ? 'I Owe' : 'Owed to Me'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Debt name (e.g. Car Loan)" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder={type === 'owed' ? 'Creditor / Lender' : 'Borrower name'} placeholderTextColor={colors.mutedForeground} value={creditor} onChangeText={setCreditor} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Total amount ($)" placeholderTextColor={colors.mutedForeground} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Interest rate % (optional)" placeholderTextColor={colors.mutedForeground} value={interest} onChangeText={setInterest} keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Due date YYYY-MM-DD (optional)" placeholderTextColor={colors.mutedForeground} value={dueDate} onChangeText={setDueDate} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={!!showPayment} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.contribModal, { backgroundColor: colors.background }]}>
          <Text style={[styles.contribTitle, { color: colors.foreground }]}>Record Payment</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Payment amount ($)" placeholderTextColor={colors.mutedForeground} value={payment} onChangeText={setPayment} keyboardType="decimal-pad" autoFocus />
          <View style={styles.contribBtns}>
            <TouchableOpacity style={[styles.contribCancel, { borderColor: colors.border }]} onPress={() => setShowPayment(null)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.contribSave, { backgroundColor: colors.primary }]} onPress={() => showPayment && handlePayment(showPayment)}><Text style={{ color: colors.primaryForeground, fontSize: 16, fontWeight: '600' }}>Record</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  summaryRow: { flexDirection: 'row', gap: 12, marginHorizontal: 16, marginBottom: 16 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, borderWidth: 1 },
  summaryLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  debtCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  paidOffBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 10 },
  paidOffText: { fontSize: 11, fontWeight: '600' },
  debtRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  debtName: { fontSize: 15, fontWeight: '600' },
  debtCreditor: { fontSize: 12, marginTop: 2 },
  debtInterest: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  debtRemaining: { fontSize: 18, fontWeight: '700' },
  debtMeta: { fontSize: 11, marginTop: 2 },
  debtProgress: { marginBottom: 12 },
  debtPct: { fontSize: 11, marginTop: 6 },
  debtActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payBtn: { flex: 1, borderWidth: 1, borderRadius: 12, alignItems: 'center', paddingVertical: 10 },
  payBtnText: { fontSize: 13, fontWeight: '600' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  typeChip: { alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  typeChipText: { fontSize: 13, fontWeight: '500' },
  contribModal: { flex: 1, padding: 24, paddingTop: 40, gap: 20 },
  contribTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  contribBtns: { flexDirection: 'row', gap: 12 },
  contribCancel: { flex: 1, borderWidth: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
  contribSave: { flex: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
});
