import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { CircularProgress } from '@/components/CircularProgress';
import { EmptyState } from '@/components/EmptyState';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
}

const GOAL_COLORS = ['#10B981', '#6366F1', '#F59E0B', '#EF4444', '#06B6D4', '#8B5CF6'];
const GOAL_ICONS = ['airplane', 'home', 'car', 'school', 'heart', 'gift', 'briefcase', 'phone-portrait', 'cash', 'star'];

export default function GoalsModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { goals, addGoal, editGoal, deleteGoal } = useFinance();

  const [showAdd, setShowAdd] = useState(false);
  const [showContrib, setShowContrib] = useState<string | null>(null);
  const [contrib, setContrib] = useState('');
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selColor, setSelColor] = useState(GOAL_COLORS[0]);
  const [selIcon, setSelIcon] = useState(GOAL_ICONS[0]);

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleAdd = () => {
    if (!name.trim() || !target) { Alert.alert('Required', 'Name and target amount are required'); return; }
    addGoal({ name: name.trim(), target_amount: parseFloat(target), saved_amount: 0, color: selColor, icon: selIcon, deadline: deadline || null, notes: null });
    setShowAdd(false); setName(''); setTarget(''); setDeadline('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleContrib = (goalId: string) => {
    const amount = parseFloat(contrib);
    if (!amount || amount <= 0) { Alert.alert('Invalid', 'Enter a valid amount'); return; }
    const goal = goals.find(g => g.id === goalId);
    if (goal) editGoal(goalId, { saved_amount: goal.saved_amount + amount });
    setShowContrib(null); setContrib('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert('Delete Goal', 'Delete this savings goal?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteGoal(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Savings Goals</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {goals.length === 0 ? (
          <EmptyState icon="flag-outline" title="No savings goals" subtitle="Set a goal and start saving toward it" />
        ) : (
          goals.map(goal => {
            const progress = goal.target_amount > 0 ? goal.saved_amount / goal.target_amount : 0;
            const isComplete = progress >= 1;
            return (
              <View key={goal.id} style={[styles.goalCard, { backgroundColor: colors.card }]}>
                {isComplete && (
                  <View style={[styles.completeBanner, { backgroundColor: colors.income + '22' }]}>
                    <Ionicons name="checkmark-circle" size={14} color={colors.income} />
                    <Text style={[styles.completeTxt, { color: colors.income }]}>Goal Reached!</Text>
                  </View>
                )}
                <View style={styles.goalTop}>
                  <CircularProgress progress={progress} size={72} strokeWidth={7} color={goal.color} label={`${Math.round(progress * 100)}%`} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.goalName, { color: colors.foreground }]}>{goal.name}</Text>
                    <Text style={[styles.goalSaved, { color: goal.color }]}>{fmt(goal.saved_amount)}</Text>
                    <Text style={[styles.goalTarget, { color: colors.mutedForeground }]}>of {fmt(goal.target_amount)}</Text>
                    {goal.deadline && <Text style={[styles.goalDeadline, { color: colors.mutedForeground }]}>Due: {goal.deadline}</Text>}
                  </View>
                </View>
                <View style={styles.goalActions}>
                  <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: goal.color + '22', borderColor: goal.color + '44' }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowContrib(goal.id); setContrib(''); }}
                  >
                    <Ionicons name="add" size={16} color={goal.color} />
                    <Text style={[styles.addBtnText, { color: goal.color }]}>Add funds</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(goal.id)} style={styles.delBtn}>
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Goal</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Add</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Goal name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Target amount ($)" placeholderTextColor={colors.mutedForeground} value={target} onChangeText={setTarget} keyboardType="decimal-pad" />
            <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Deadline (YYYY-MM-DD, optional)" placeholderTextColor={colors.mutedForeground} value={deadline} onChangeText={setDeadline} />
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Color</Text>
            <View style={styles.colorRow}>
              {GOAL_COLORS.map(c => (
                <TouchableOpacity key={c} style={[styles.colorDot, { backgroundColor: c, borderWidth: selColor === c ? 3 : 0, borderColor: '#fff' }]} onPress={() => setSelColor(c)} />
              ))}
            </View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Icon</Text>
            <View style={styles.iconRow}>
              {GOAL_ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[styles.iconBtn, { backgroundColor: selIcon === ic ? selColor + '22' : colors.card, borderColor: selIcon === ic ? selColor : colors.border }]} onPress={() => setSelIcon(ic)}>
                  <Ionicons name={ic as any} size={20} color={selIcon === ic ? selColor : colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Contribution Modal */}
      <Modal visible={!!showContrib} animationType="slide" presentationStyle="formSheet">
        <View style={[styles.contribModal, { backgroundColor: colors.background }]}>
          <Text style={[styles.contribTitle, { color: colors.foreground }]}>Add Funds</Text>
          <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} placeholder="Amount ($)" placeholderTextColor={colors.mutedForeground} value={contrib} onChangeText={setContrib} keyboardType="decimal-pad" autoFocus />
          <View style={styles.contribBtns}>
            <TouchableOpacity style={[styles.contribCancel, { borderColor: colors.border }]} onPress={() => setShowContrib(null)}>
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contribSave, { backgroundColor: colors.primary }]} onPress={() => showContrib && handleContrib(showContrib)}>
              <Text style={{ color: colors.primaryForeground, fontSize: 16, fontWeight: '600' }}>Add</Text>
            </TouchableOpacity>
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
  goalCard: { borderRadius: 20, padding: 16, marginBottom: 14, overflow: 'hidden' },
  completeBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, marginBottom: 12, alignSelf: 'flex-start' },
  completeTxt: { fontSize: 12, fontWeight: '600' },
  goalTop: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  goalName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  goalSaved: { fontSize: 22, fontWeight: '700' },
  goalTarget: { fontSize: 12, marginTop: 2 },
  goalDeadline: { fontSize: 11, marginTop: 4 },
  goalActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flex: 1 },
  addBtnText: { fontSize: 13, fontWeight: '600' },
  delBtn: { padding: 8 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
  colorRow: { flexDirection: 'row', gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  iconRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  contribModal: { flex: 1, padding: 24, paddingTop: 40, gap: 20 },
  contribTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  contribBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  contribCancel: { flex: 1, borderWidth: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
  contribSave: { flex: 1, borderRadius: 14, alignItems: 'center', paddingVertical: 14 },
});
