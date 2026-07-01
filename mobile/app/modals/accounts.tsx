import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, Account } from '@/context/FinanceContext';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);
}

const ACCOUNT_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#F97316'];
const ACCOUNT_TYPES = ['checking', 'savings', 'cash', 'investment', 'credit'] as const;

export default function AccountsModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accounts, addAccount, deleteAccount } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['type']>('checking');
  const [balance, setBalance] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const netWorth = accounts.reduce((s, a) => s + (a.type === 'credit' ? -a.balance : a.balance), 0);

  const handleAdd = () => {
    if (!name.trim()) { Alert.alert('Name required', 'Please enter an account name'); return; }
    addAccount({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      currency: 'USD',
      color: selectedColor,
      icon: 'wallet-outline',
      is_primary: accounts.length === 0 ? 1 : 0,
    });
    setShowAdd(false);
    setName(''); setBalance(''); setType('checking'); setSelectedColor(ACCOUNT_COLORS[0]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete Account', `Delete "${name}" and all its transactions?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteAccount(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Accounts</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Net worth summary */}
      <View style={[styles.netWorthBanner, { backgroundColor: colors.card }]}>
        <Text style={[styles.netWorthLabel, { color: colors.mutedForeground }]}>TOTAL NET WORTH</Text>
        <Text style={[styles.netWorthValue, { color: netWorth >= 0 ? colors.income : colors.expense }]}>{fmt(netWorth)}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {accounts.map(acc => (
          <View key={acc.id} style={[styles.accountCard, { backgroundColor: colors.card }]}>
            <View style={[styles.accountLeft, { backgroundColor: acc.color + '22' }]}>
              <Ionicons name={(acc.icon || 'wallet') as any} size={22} color={acc.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accName, { color: colors.foreground }]}>{acc.name}</Text>
              <Text style={[styles.accType, { color: colors.mutedForeground }]}>{acc.type} · {acc.currency}</Text>
            </View>
            <Text style={[styles.accBalance, { color: acc.type === 'credit' ? colors.expense : colors.income }]}>{fmt(acc.balance)}</Text>
            <TouchableOpacity onPress={() => handleDelete(acc.id, acc.name)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={16} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12 }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Account</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Account name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Starting balance" placeholderTextColor={colors.mutedForeground} value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Type</Text>
            <View style={styles.typeRow}>
              {ACCOUNT_TYPES.map(t => (
                <TouchableOpacity key={t} style={[styles.typeChip, { backgroundColor: type === t ? colors.primary + '22' : colors.card, borderColor: type === t ? colors.primary : colors.border }]} onPress={() => setType(t)}>
                  <Text style={[styles.typeChipText, { color: type === t ? colors.primary : colors.mutedForeground }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
            <View style={styles.colorRow}>
              {ACCOUNT_COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 0, borderColor: '#fff' }]} onPress={() => setSelectedColor(c)} />
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
  netWorthBanner: { marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
  netWorthLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  netWorthValue: { fontSize: 28, fontWeight: '700' },
  accountCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, marginBottom: 10 },
  accountLeft: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  accName: { fontSize: 15, fontWeight: '600' },
  accType: { fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  accBalance: { fontSize: 16, fontWeight: '700' },
  deleteBtn: { padding: 8 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  typeChipText: { fontSize: 13, fontWeight: '500', textTransform: 'capitalize' },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
});
