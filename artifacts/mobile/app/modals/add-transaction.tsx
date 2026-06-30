import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, Platform, Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';

type TxType = 'income' | 'expense' | 'transfer';

export default function AddTransactionModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accounts, categories, addTransaction } = useFinance();

  const [type, setType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const filteredCategories = useMemo(() =>
    categories.filter(c => c.type === type || c.type === 'both'),
    [categories, type]
  );

  const handleDigit = (d: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (d === '.' && amount.includes('.')) return;
    if (d === '.' && !amount) { setAmount('0.'); return; }
    const parts = amount.split('.');
    if (parts[1] && parts[1].length >= 2) return;
    setAmount(prev => prev + d);
  };

  const handleBackspace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount(prev => prev.slice(0, -1));
  };

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }
    if (!accountId) {
      Alert.alert('No Account', 'Please select an account');
      return;
    }
    addTransaction({
      account_id: accountId,
      category_id: categoryId,
      amount: num,
      type,
      description: description || null,
      date,
      tags: null,
      notes: notes || null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const types: { key: TxType; label: string; color: string }[] = [
    { key: 'expense', label: 'Expense', color: colors.expense },
    { key: 'income', label: 'Income', color: colors.income },
    { key: 'transfer', label: 'Transfer', color: colors.accent },
  ];

  const numKeys = [['1','2','3'],['4','5','6'],['7','8','9'],['.','0','⌫']];

  const amountColor = type === 'income' ? colors.income : type === 'transfer' ? colors.accent : colors.expense;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Add Transaction</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Type Selector */}
      <View style={[styles.typeSelector, { backgroundColor: colors.card }]}>
        {types.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeBtn, { backgroundColor: type === t.key ? t.color + '22' : 'transparent' }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setType(t.key); setCategoryId(null); }}
          >
            <Text style={[styles.typeBtnText, { color: type === t.key ? t.color : colors.mutedForeground }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Amount Display */}
      <View style={styles.amountDisplay}>
        <Text style={[styles.currency, { color: amountColor }]}>$</Text>
        <Text style={[styles.amountText, { color: amountColor }]}>{amount || '0'}</Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypad}>
        {numKeys.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map(k => (
              <TouchableOpacity
                key={k}
                style={[styles.key, { backgroundColor: k === '⌫' ? colors.secondary : colors.card }]}
                onPress={() => k === '⌫' ? handleBackspace() : handleDigit(k)}
                activeOpacity={0.7}
              >
                {k === '⌫' ? (
                  <Ionicons name="backspace-outline" size={20} color={colors.foreground} />
                ) : (
                  <Text style={[styles.keyText, { color: colors.foreground }]}>{k}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      {/* Details */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPadding + 20 }}>
        {/* Description */}
        <View style={[styles.field, { borderColor: colors.border }]}>
          <Ionicons name="pencil-outline" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.fieldInput, { color: colors.foreground }]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Category */}
        {filteredCategories.length > 0 && (
          <View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {filteredCategories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, {
                    backgroundColor: categoryId === cat.id ? cat.color + '33' : colors.card,
                    borderColor: categoryId === cat.id ? cat.color : colors.border,
                  }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCategoryId(cat.id); }}
                >
                  <Ionicons name={(cat.icon || 'ellipse') as any} size={14} color={categoryId === cat.id ? cat.color : colors.mutedForeground} />
                  <Text style={[styles.catChipText, { color: categoryId === cat.id ? cat.color : colors.mutedForeground }]}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Account */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Account</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {accounts.map(acc => (
            <TouchableOpacity
              key={acc.id}
              style={[styles.accChip, {
                backgroundColor: accountId === acc.id ? acc.color + '22' : colors.card,
                borderColor: accountId === acc.id ? acc.color : colors.border,
              }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAccountId(acc.id); }}
            >
              <Ionicons name={(acc.icon || 'wallet') as any} size={14} color={accountId === acc.id ? acc.color : colors.mutedForeground} />
              <Text style={[styles.accChipText, { color: accountId === acc.id ? acc.color : colors.mutedForeground }]}>{acc.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Notes */}
        <View style={[styles.fieldNotes, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.notesInput, { color: colors.foreground }]}
            placeholder="Notes (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={2}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  saveBtn: { fontSize: 16, fontWeight: '600' },
  typeSelector: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, padding: 4, marginBottom: 8 },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  typeBtnText: { fontSize: 14, fontWeight: '600' },
  amountDisplay: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', paddingVertical: 20, gap: 4 },
  currency: { fontSize: 28, fontWeight: '300', marginBottom: 4 },
  amountText: { fontSize: 52, fontWeight: '700' },
  keypad: { paddingHorizontal: 16, marginBottom: 16 },
  keyRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  key: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14 },
  keyText: { fontSize: 22, fontWeight: '400' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
  fieldInput: { flex: 1, fontSize: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4, marginBottom: 8, marginTop: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 12, fontWeight: '500' },
  accChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  accChipText: { fontSize: 12, fontWeight: '500' },
  fieldNotes: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
  notesInput: { fontSize: 14, minHeight: 50 },
});
