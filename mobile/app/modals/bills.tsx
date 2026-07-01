import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, Bill } from '@/context/FinanceContext';
import { EmptyState } from '@/components/EmptyState';
import { notifyBillAdded, notifyBillToggled } from '@/lib/notifications';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

function getNextDue(dueDay: number, recurrence: string): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), dueDay);
  if (next <= now) next.setMonth(next.getMonth() + 1);
  return next.toISOString().split('T')[0];
}

export default function BillsModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { bills, addBill, deleteBill, toggleBillPaid } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('1');
  const [recurrence, setRecurrence] = useState<Bill['recurrence']>('monthly');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const totalMonthly = bills.reduce((s, b) => s + (b.recurrence === 'monthly' ? b.amount : b.recurrence === 'yearly' ? b.amount / 12 : b.amount * 4.33), 0);

  const handleAdd = () => {
    if (!name.trim() || !amount) { Alert.alert('Required', 'Name and amount are required'); return; }
    const day = parseInt(dueDay) || 1;
    addBill({ name: name.trim(), amount: parseFloat(amount), due_day: day, category_id: null, is_paid: 0, recurrence, next_due: getNextDue(day, recurrence), notes: null });
    setShowAdd(false); setName(''); setAmount(''); setDueDay('1');
    void notifyBillAdded({ name: name.trim(), amount: parseFloat(amount), next_due: getNextDue(day, recurrence) });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete Bill', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteBill(id) },
    ]);
  };

  const upcoming = bills.filter(b => !b.is_paid);
  const paid = bills.filter(b => b.is_paid);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Bills</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.summary, { backgroundColor: colors.card }]}>
        <Ionicons name="calendar-outline" size={20} color={colors.accent} />
        <View>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Monthly obligations</Text>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>{fmt(totalMonthly)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {bills.length === 0 ? (
          <EmptyState icon="calendar-outline" title="No bills added" subtitle="Track recurring bills and never miss a payment" />
        ) : (
          <>
            {upcoming.length > 0 && <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>UPCOMING</Text>}
            {upcoming.map(bill => (
              <View key={bill.id} style={[styles.billCard, { backgroundColor: colors.card }]}>
                <View style={[styles.billIconBg, { backgroundColor: colors.warning + '22' }]}>
                  <Ionicons name="calendar-outline" size={18} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.billName, { color: colors.foreground }]}>{bill.name}</Text>
                  <Text style={[styles.billMeta, { color: colors.mutedForeground }]}>Day {bill.due_day} · {bill.recurrence}</Text>
                </View>
                <Text style={[styles.billAmount, { color: colors.expense }]}>{fmt(bill.amount)}</Text>
                <TouchableOpacity style={[styles.paidBtn, { backgroundColor: colors.income + '22' }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleBillPaid(bill.id); void notifyBillToggled(bill.name, true); }}>
                  <Ionicons name="checkmark" size={16} color={colors.income} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(bill.id, bill.name)} style={{ padding: 6 }}>
                  <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}
            {paid.length > 0 && <Text style={[styles.groupLabel, { color: colors.mutedForeground, marginTop: 16 }]}>PAID THIS CYCLE</Text>}
            {paid.map(bill => (
              <View key={bill.id} style={[styles.billCard, { backgroundColor: colors.card, opacity: 0.5 }]}>
                <View style={[styles.billIconBg, { backgroundColor: colors.income + '22' }]}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.income} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.billName, { color: colors.foreground }]}>{bill.name}</Text>
                  <Text style={[styles.billMeta, { color: colors.mutedForeground }]}>Day {bill.due_day} · {bill.recurrence}</Text>
                </View>
                <Text style={[styles.billAmount, { color: colors.mutedForeground }]}>{fmt(bill.amount)}</Text>
                <TouchableOpacity style={[styles.paidBtn, { backgroundColor: colors.secondary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggleBillPaid(bill.id); void notifyBillToggled(bill.name, false); }}>
                  <Ionicons name="refresh" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Bill</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Bill name (e.g. Netflix)" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Amount ($)" placeholderTextColor={colors.mutedForeground} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Due day of month (1-31)" placeholderTextColor={colors.mutedForeground} value={dueDay} onChangeText={setDueDay} keyboardType="number-pad" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Recurrence</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['monthly', 'weekly', 'yearly'] as Bill['recurrence'][]).map(r => (
                <TouchableOpacity key={r} style={[styles.recChip, { backgroundColor: recurrence === r ? colors.primary + '22' : colors.card, borderColor: recurrence === r ? colors.primary : colors.border }]} onPress={() => setRecurrence(r)}>
                  <Text style={[styles.recChipText, { color: recurrence === r ? colors.primary : colors.mutedForeground }]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  summary: { marginHorizontal: 16, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  summaryLabel: { fontSize: 12, marginBottom: 2 },
  summaryValue: { fontSize: 20, fontWeight: '700' },
  groupLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  billCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, padding: 14, marginBottom: 8 },
  billIconBg: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  billName: { fontSize: 14, fontWeight: '500' },
  billMeta: { fontSize: 12, marginTop: 2 },
  billAmount: { fontSize: 14, fontWeight: '600' },
  paidBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  recChip: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  recChipText: { fontSize: 13, fontWeight: '500' },
});
