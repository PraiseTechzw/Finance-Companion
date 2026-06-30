import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, Category } from '@/context/FinanceContext';
import { EmptyState } from '@/components/EmptyState';

const CAT_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6', '#EC4899', '#F97316', '#84CC16', '#94A3B8'];
const CAT_ICONS = ['restaurant', 'car', 'bag-handle', 'film', 'fitness', 'home', 'school', 'airplane', 'flash', 'repeat', 'gift', 'person', 'laptop', 'briefcase', 'trending-up', 'heart', 'star', 'book'];

export default function CategoriesModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { categories, addCategory, deleteCategory } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<Category['type']>('expense');
  const [selColor, setSelColor] = useState(CAT_COLORS[0]);
  const [selIcon, setSelIcon] = useState(CAT_ICONS[0]);
  const [budgetLimit, setBudgetLimit] = useState('');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const filtered = categories.filter(c => filter === 'all' || c.type === filter || c.type === 'both');
  const custom = filtered.filter(c => c.is_custom);
  const preset = filtered.filter(c => !c.is_custom);

  const handleAdd = () => {
    if (!name.trim()) { Alert.alert('Required', 'Category name is required'); return; }
    addCategory({ name: name.trim(), icon: selIcon, color: selColor, type, budget_limit: parseFloat(budgetLimit) || 0, is_custom: 1 });
    setShowAdd(false); setName(''); setBudgetLimit('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string, isCustom: number) => {
    if (!isCustom) { Alert.alert('Cannot Delete', 'Preset categories cannot be deleted'); return; }
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteCategory(id) },
    ]);
  };

  const CatRow = ({ cat }: { cat: Category }) => (
    <View style={[styles.catRow, { backgroundColor: colors.card }]}>
      <View style={[styles.catIcon, { backgroundColor: cat.color + '22' }]}>
        <Ionicons name={(cat.icon || 'ellipse') as any} size={18} color={cat.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.catName, { color: colors.foreground }]}>{cat.name}</Text>
        <Text style={[styles.catType, { color: colors.mutedForeground }]}>{cat.type}{cat.budget_limit > 0 ? ` · $${cat.budget_limit}/mo` : ''}</Text>
      </View>
      {cat.is_custom === 1 && (
        <TouchableOpacity onPress={() => handleDelete(cat.id, cat.name, cat.is_custom)} style={{ padding: 8 }}>
          <Ionicons name="trash-outline" size={14} color={colors.destructive} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Categories</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={[styles.filterRow, { backgroundColor: colors.card }]}>
        {(['all', 'income', 'expense'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.filterBtn, { backgroundColor: filter === f ? colors.primary : 'transparent' }]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, { color: filter === f ? colors.primaryForeground : colors.mutedForeground }]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {categories.length === 0 ? (
          <EmptyState icon="pricetag-outline" title="No categories" subtitle="Add custom categories to organize your spending" />
        ) : (
          <>
            {custom.length > 0 && <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>CUSTOM</Text>}
            {custom.map(cat => <CatRow key={cat.id} cat={cat} />)}
            {preset.length > 0 && <Text style={[styles.groupLabel, { color: colors.mutedForeground, marginTop: custom.length > 0 ? 16 : 0 }]}>PRESET</Text>}
            {preset.map(cat => <CatRow key={cat.id} cat={cat} />)}
          </>
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Category</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Category name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['expense', 'income', 'both'] as Category['type'][]).map(t => (
                <TouchableOpacity key={t} style={[styles.typeChip, { flex: 1, backgroundColor: type === t ? colors.primary + '22' : colors.card, borderColor: type === t ? colors.primary : colors.border }]} onPress={() => setType(t)}>
                  <Text style={[styles.typeChipText, { color: type === t ? colors.primary : colors.mutedForeground }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Monthly budget limit (0 = none)" placeholderTextColor={colors.mutedForeground} value={budgetLimit} onChangeText={setBudgetLimit} keyboardType="decimal-pad" />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
            <View style={styles.colorRow}>
              {CAT_COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c, borderWidth: selColor === c ? 3 : 0, borderColor: '#fff' }]} onPress={() => setSelColor(c)} />
              ))}
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Icon</Text>
            <View style={styles.iconRow}>
              {CAT_ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[styles.iconBtn, { backgroundColor: selIcon === ic ? selColor + '22' : colors.card, borderColor: selIcon === ic ? selColor : colors.border }]} onPress={() => setSelIcon(ic)}>
                  <Ionicons name={ic as any} size={20} color={selIcon === ic ? selColor : colors.mutedForeground} />
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
  filterRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, padding: 4, marginBottom: 12 },
  filterBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10 },
  filterText: { fontSize: 13, fontWeight: '500' },
  groupLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 12, marginBottom: 8 },
  catIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catName: { fontSize: 14, fontWeight: '500' },
  catType: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  typeChip: { alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  typeChipText: { fontSize: 13, fontWeight: '500' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
});
