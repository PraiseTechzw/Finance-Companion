import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, Investment } from '@/context/FinanceContext';
import { EmptyState } from '@/components/EmptyState';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

const INV_TYPES: { key: Investment['type']; label: string; icon: string }[] = [
  { key: 'stocks', label: 'Stocks', icon: 'trending-up-outline' },
  { key: 'crypto', label: 'Crypto', icon: 'logo-bitcoin' },
  { key: 'bonds', label: 'Bonds', icon: 'shield-outline' },
  { key: 'real_estate', label: 'Real Estate', icon: 'home-outline' },
  { key: 'other', label: 'Other', icon: 'ellipse-outline' },
];

const TYPE_COLORS: Record<Investment['type'], string> = {
  stocks: '#10B981', crypto: '#F59E0B', bonds: '#6366F1', real_estate: '#06B6D4', other: '#94A3B8',
};

export default function InvestmentsModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { investments, addInvestment, editInvestment, deleteInvestment } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Investment['type']>('stocks');
  const [amount, setAmount] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const totalCost = investments.reduce((s, i) => s + i.amount, 0);
  const totalValue = investments.reduce((s, i) => s + i.current_value, 0);
  const totalReturn = totalCost > 0 ? (totalValue - totalCost) / totalCost : 0;

  const handleAdd = () => {
    if (!name.trim() || !amount) { Alert.alert('Required', 'Name and amount are required'); return; }
    addInvestment({ name: name.trim(), type, amount: parseFloat(amount), current_value: parseFloat(currentValue) || parseFloat(amount), purchase_date: date, notes: null });
    setShowAdd(false); setName(''); setAmount(''); setCurrentValue('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Investment', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteInvestment(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Investments</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.portfolioCard, { backgroundColor: colors.card }]}>
        <View style={styles.portfolioRow}>
          <View>
            <Text style={[styles.portLabel, { color: colors.mutedForeground }]}>Portfolio Value</Text>
            <Text style={[styles.portValue, { color: colors.foreground }]}>{fmt(totalValue)}</Text>
          </View>
          <View style={[styles.returnBadge, { backgroundColor: totalReturn >= 0 ? colors.income + '22' : colors.expense + '22' }]}>
            <Ionicons name={totalReturn >= 0 ? 'trending-up' : 'trending-down'} size={14} color={totalReturn >= 0 ? colors.income : colors.expense} />
            <Text style={[styles.returnText, { color: totalReturn >= 0 ? colors.income : colors.expense }]}>
              {totalReturn >= 0 ? '+' : ''}{(totalReturn * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
        <Text style={[styles.portSub, { color: colors.mutedForeground }]}>Cost basis: {fmt(totalCost)} · Gain: {fmt(totalValue - totalCost)}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {investments.length === 0 ? (
          <EmptyState icon="trending-up-outline" title="No investments tracked" subtitle="Add your investment portfolio to track performance" />
        ) : (
          investments.map(inv => {
            const gain = inv.current_value - inv.amount;
            const returnPct = inv.amount > 0 ? gain / inv.amount : 0;
            const typeConfig = INV_TYPES.find(t => t.key === inv.type) || INV_TYPES[4];
            const typeColor = TYPE_COLORS[inv.type];
            return (
              <View key={inv.id} style={[styles.invCard, { backgroundColor: colors.card }]}>
                <View style={[styles.invIcon, { backgroundColor: typeColor + '22' }]}>
                  <Ionicons name={typeConfig.icon as any} size={20} color={typeColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.invName, { color: colors.foreground }]}>{inv.name}</Text>
                  <Text style={[styles.invType, { color: colors.mutedForeground }]}>{typeConfig.label} · {inv.purchase_date}</Text>
                  <Text style={[styles.invCost, { color: colors.mutedForeground }]}>Cost: {fmt(inv.amount)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.invValue, { color: colors.foreground }]}>{fmt(inv.current_value)}</Text>
                  <Text style={[styles.invReturn, { color: gain >= 0 ? colors.income : colors.expense }]}>
                    {gain >= 0 ? '+' : ''}{fmt(gain)} ({(returnPct * 100).toFixed(1)}%)
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(inv.id, inv.name)} style={{ padding: 8 }}>
                  <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Investment</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Investment name (e.g. AAPL)" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Type</Text>
            <View style={styles.typeRow}>
              {INV_TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[styles.typeChip, { backgroundColor: type === t.key ? TYPE_COLORS[t.key] + '22' : colors.card, borderColor: type === t.key ? TYPE_COLORS[t.key] : colors.border }]} onPress={() => setType(t.key)}>
                  <Ionicons name={t.icon as any} size={14} color={type === t.key ? TYPE_COLORS[t.key] : colors.mutedForeground} />
                  <Text style={[styles.typeChipText, { color: type === t.key ? TYPE_COLORS[t.key] : colors.mutedForeground }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Purchase amount ($)" placeholderTextColor={colors.mutedForeground} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Current value ($, leave blank = cost)" placeholderTextColor={colors.mutedForeground} value={currentValue} onChangeText={setCurrentValue} keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Purchase date (YYYY-MM-DD)" placeholderTextColor={colors.mutedForeground} value={date} onChangeText={setDate} />
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
  portfolioCard: { marginHorizontal: 16, borderRadius: 16, padding: 18, marginBottom: 16 },
  portfolioRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  portLabel: { fontSize: 12, marginBottom: 4 },
  portValue: { fontSize: 26, fontWeight: '700' },
  returnBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  returnText: { fontSize: 14, fontWeight: '700' },
  portSub: { fontSize: 12 },
  invCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8 },
  invIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  invName: { fontSize: 14, fontWeight: '600' },
  invType: { fontSize: 12, marginTop: 2 },
  invCost: { fontSize: 11, marginTop: 2 },
  invValue: { fontSize: 15, fontWeight: '700' },
  invReturn: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontSize: 12, fontWeight: '500' },
});
