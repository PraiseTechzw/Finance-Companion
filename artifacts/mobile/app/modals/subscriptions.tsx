import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Platform, Modal
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';

interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: 'monthly' | 'yearly' | 'weekly';
  icon: string;
  color: string;
  category: string;
  nextDate: string;
  active: boolean;
}

const STORAGE_KEY = 'wealthly_subscriptions';

const PRESET_SUBS = [
  { name: 'Netflix', icon: 'tv-outline', color: '#E50914', category: 'Entertainment' },
  { name: 'Spotify', icon: 'musical-notes-outline', color: '#1DB954', category: 'Entertainment' },
  { name: 'Apple iCloud', icon: 'cloud-outline', color: '#007AFF', category: 'Cloud Storage' },
  { name: 'YouTube Premium', icon: 'logo-youtube', color: '#FF0000', category: 'Entertainment' },
  { name: 'Amazon Prime', icon: 'storefront-outline', color: '#FF9900', category: 'Shopping' },
  { name: 'Disney+', icon: 'film-outline', color: '#0063E5', category: 'Entertainment' },
  { name: 'OpenAI', icon: 'sparkles-outline', color: '#10A37F', category: 'Productivity' },
  { name: 'Gym', icon: 'barbell-outline', color: '#EF4444', category: 'Health' },
];

const COLORS = ['#EF4444','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899','#06B6D4','#6366F1'];

function fmt(n: number) { return `$${n.toFixed(2)}`; }

function useSubscriptions() {
  const [subs, setSubs] = React.useState<Subscription[]>([]);
  React.useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) setSubs(JSON.parse(data));
      else {
        const defaults: Subscription[] = [
          { id: '1', name: 'Netflix', amount: 15.99, cycle: 'monthly', icon: 'tv-outline', color: '#E50914', category: 'Entertainment', nextDate: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(), active: true },
          { id: '2', name: 'Spotify', amount: 9.99, cycle: 'monthly', icon: 'musical-notes-outline', color: '#1DB954', category: 'Entertainment', nextDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), active: true },
          { id: '3', name: 'iCloud', amount: 2.99, cycle: 'monthly', icon: 'cloud-outline', color: '#007AFF', category: 'Cloud Storage', nextDate: new Date(new Date().getFullYear(), new Date().getMonth(), 7).toISOString(), active: true },
        ];
        setSubs(defaults);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
      }
    });
  }, []);
  const save = (updated: Subscription[]) => { setSubs(updated); AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); };
  const add = (sub: Omit<Subscription, 'id'>) => { const updated = [...subs, { ...sub, id: Date.now().toString() }]; save(updated); };
  const remove = (id: string) => save(subs.filter(s => s.id !== id));
  const toggle = (id: string) => save(subs.map(s => s.id === id ? { ...s, active: !s.active } : s));
  return { subs, add, remove, toggle };
}

export default function SubscriptionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { subs, add, remove, toggle } = useSubscriptions();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<'monthly' | 'yearly' | 'weekly'>('monthly');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState('card-outline');

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const activeSubs = subs.filter(s => s.active);
  const monthlyTotal = useMemo(() => activeSubs.reduce((s, sub) => {
    if (sub.cycle === 'monthly') return s + sub.amount;
    if (sub.cycle === 'yearly') return s + sub.amount / 12;
    if (sub.cycle === 'weekly') return s + sub.amount * 4.33;
    return s;
  }, 0), [activeSubs]);

  const yearlyTotal = monthlyTotal * 12;

  const handleAdd = () => {
    if (!name.trim() || !amount) return;
    add({ name: name.trim(), amount: parseFloat(amount), cycle, icon: selectedIcon, color: selectedColor, category: 'Subscription', nextDate: new Date().toISOString(), active: true });
    setName(''); setAmount(''); setShowAdd(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePreset = (preset: typeof PRESET_SUBS[0]) => {
    setName(preset.name); setSelectedColor(preset.color); setSelectedIcon(preset.icon);
  };

  const cycleLabel = { monthly: '/mo', yearly: '/yr', weekly: '/wk' };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Subscriptions</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowAdd(true); }}>
          <View style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color={colors.primaryForeground} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}>
        {/* Summary card */}
        <View style={[styles.summaryCard, { marginHorizontal: 16, marginTop: 16 }]}>
          <LinearGradient colors={['#1a2744', '#0f1c35']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Monthly total</Text>
              <Text style={styles.summaryAmount}>${monthlyTotal.toFixed(2)}</Text>
            </View>
            <View style={[styles.dividerV, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <View>
              <Text style={styles.summaryLabel}>Per year</Text>
              <Text style={styles.summaryAmount}>${yearlyTotal.toFixed(0)}</Text>
            </View>
            <View style={[styles.dividerV, { backgroundColor: 'rgba(255,255,255,0.15)' }]} />
            <View>
              <Text style={styles.summaryLabel}>Active</Text>
              <Text style={styles.summaryAmount}>{activeSubs.length}</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ALL SUBSCRIPTIONS</Text>
        {subs.map(sub => (
          <View key={sub.id} style={[styles.subCard, { backgroundColor: colors.card }]}>
            <View style={[styles.subIcon, { backgroundColor: sub.color + '22' }]}>
              <Ionicons name={sub.icon as any} size={22} color={sub.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.subName, { color: colors.foreground, opacity: sub.active ? 1 : 0.5 }]}>{sub.name}</Text>
              <Text style={[styles.subCategory, { color: colors.mutedForeground }]}>{sub.category} · {sub.cycle}</Text>
            </View>
            <Text style={[styles.subAmount, { color: sub.active ? colors.expense : colors.mutedForeground }]}>
              {fmt(sub.amount)}{cycleLabel[sub.cycle]}
            </Text>
            <TouchableOpacity style={[styles.toggleBtn, { backgroundColor: sub.active ? colors.income + '22' : colors.secondary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); toggle(sub.id); }}>
              <Ionicons name={sub.active ? 'pause' : 'play'} size={14} color={sub.active ? colors.income : colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); Alert.alert('Delete', `Remove ${sub.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => remove(sub.id) }]); }}>
              <Ionicons name="trash-outline" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        ))}
        {subs.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="repeat-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No subscriptions yet</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}>
              <Text style={[styles.modalCancel, { color: colors.mutedForeground }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Subscription</Text>
            <TouchableOpacity onPress={handleAdd}>
              <Text style={[styles.modalSave, { color: colors.primary }]}>Add</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 20 }}>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>QUICK ADD</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {PRESET_SUBS.map(p => (
                <TouchableOpacity key={p.name} style={[styles.presetChip, { backgroundColor: p.color + '22', borderColor: name === p.name ? p.color : 'transparent' }]} onPress={() => handlePreset(p)}>
                  <Ionicons name={p.icon as any} size={18} color={p.color} />
                  <Text style={[styles.presetName, { color: colors.foreground }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>NAME</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} placeholder="Service name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>AMOUNT</Text>
            <TextInput style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]} placeholder="9.99" placeholderTextColor={colors.mutedForeground} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>BILLING CYCLE</Text>
            <View style={styles.cycleRow}>
              {(['monthly', 'yearly', 'weekly'] as const).map(c => (
                <TouchableOpacity key={c} style={[styles.cyclePill, { backgroundColor: cycle === c ? colors.primary : colors.card, borderColor: cycle === c ? colors.primary : colors.border }]} onPress={() => setCycle(c)}>
                  <Text style={[styles.cycleText, { color: cycle === c ? colors.primaryForeground : colors.mutedForeground }]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>COLOR</Text>
            <View style={styles.colorRow}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]} onPress={() => setSelectedColor(c)} />
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
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  addBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryCard: { borderRadius: 20, overflow: 'hidden', padding: 20, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  summaryLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, textAlign: 'center', marginBottom: 4 },
  summaryAmount: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center' },
  dividerV: { width: 1, height: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, paddingHorizontal: 20, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  subCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, borderRadius: 16, padding: 14, marginBottom: 8 },
  subIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  subName: { fontSize: 15, fontWeight: '600' },
  subCategory: { fontSize: 12, marginTop: 2 },
  subAmount: { fontSize: 15, fontWeight: '700', minWidth: 60, textAlign: 'right' },
  toggleBtn: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: 16 },
  modal: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  modalCancel: { fontSize: 16 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSave: { fontSize: 16, fontWeight: '600' },
  fieldLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 16 },
  cycleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  cyclePill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  cycleText: { fontSize: 13, fontWeight: '600' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 24 },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotSelected: { borderWidth: 3, borderColor: '#fff' },
  presetChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginRight: 8, borderWidth: 2 },
  presetName: { fontSize: 13, fontWeight: '500' },
});
