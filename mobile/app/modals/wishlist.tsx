import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, WishlistItem } from '@/context/FinanceContext';
import { EmptyState } from '@/components/EmptyState';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

const PRIORITY_CONFIG: Record<WishlistItem['priority'], { color: string; label: string }> = {
  high: { color: '#EF4444', label: 'High' },
  medium: { color: '#F59E0B', label: 'Medium' },
  low: { color: '#94A3B8', label: 'Low' },
};

export default function WishlistModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wishlist, addWishlistItem, toggleWishlistPurchased, deleteWishlistItem } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState<WishlistItem['priority']>('medium');
  const [notes, setNotes] = useState('');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const unpurchased = wishlist.filter(w => !w.is_purchased);
  const purchased = wishlist.filter(w => w.is_purchased);

  const handleAdd = () => {
    if (!name.trim() || !price) { Alert.alert('Required', 'Name and price are required'); return; }
    addWishlistItem({ name: name.trim(), price: parseFloat(price), priority, url: null, notes: notes || null, is_purchased: 0 });
    setShowAdd(false); setName(''); setPrice(''); setNotes('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Item', `Delete "${name}" from wishlist?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteWishlistItem(id) },
    ]);
  };

  const WishlistCard = ({ item }: { item: WishlistItem }) => {
    const pc = PRIORITY_CONFIG[item.priority];
    return (
      <View style={[styles.card, { backgroundColor: colors.card, opacity: item.is_purchased ? 0.5 : 1 }]}>
        <View style={styles.cardTop}>
          <View style={[styles.priorityBadge, { backgroundColor: pc.color + '22' }]}>
            <Text style={[styles.priorityText, { color: pc.color }]}>{pc.label}</Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity style={[styles.purchasedBtn, { backgroundColor: item.is_purchased ? colors.income + '22' : colors.secondary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); toggleWishlistPurchased(item.id); }}>
              <Ionicons name={item.is_purchased ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={item.is_purchased ? colors.income : colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={{ padding: 4 }}>
              <Ionicons name="trash-outline" size={14} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
        <Text style={[styles.itemPrice, { color: colors.accent }]}>{fmt(item.price)}</Text>
        {item.notes && <Text style={[styles.itemNotes, { color: colors.mutedForeground }]}>{item.notes}</Text>}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Wishlist</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {wishlist.length === 0 ? (
          <EmptyState icon="gift-outline" title="Wishlist is empty" subtitle="Add items you're saving up for" />
        ) : (
          <>
            {unpurchased.map(item => <WishlistCard key={item.id} item={item} />)}
            {purchased.length > 0 && (
              <>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground, marginTop: 8 }]}>PURCHASED</Text>
                {purchased.map(item => <WishlistCard key={item.id} item={item} />)}
              </>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add to Wishlist</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Item name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Price ($)" placeholderTextColor={colors.mutedForeground} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Priority</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['high', 'medium', 'low'] as WishlistItem['priority'][]).map(p => (
                <TouchableOpacity key={p} style={[styles.prioChip, { flex: 1, backgroundColor: priority === p ? PRIORITY_CONFIG[p].color + '22' : colors.card, borderColor: priority === p ? PRIORITY_CONFIG[p].color : colors.border }]} onPress={() => setPriority(p)}>
                  <Text style={[styles.prioChipText, { color: priority === p ? PRIORITY_CONFIG[p].color : colors.mutedForeground }]}>{PRIORITY_CONFIG[p].label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Notes (optional)" placeholderTextColor={colors.mutedForeground} value={notes} onChangeText={setNotes} />
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
  card: { borderRadius: 16, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  priorityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  priorityText: { fontSize: 11, fontWeight: '600' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  purchasedBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  itemPrice: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  itemNotes: { fontSize: 12, lineHeight: 18 },
  groupLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  prioChip: { alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  prioChipText: { fontSize: 13, fontWeight: '500' },
});
