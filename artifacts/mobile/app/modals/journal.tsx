import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useFinance, JournalEntry } from '@/context/FinanceContext';
import { EmptyState } from '@/components/EmptyState';

type Mood = JournalEntry['mood'];

const MOODS: { key: Mood; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { key: 'great', label: 'Great', icon: 'sunny', color: '#10B981' },
  { key: 'good', label: 'Good', icon: 'partly-sunny', color: '#6366F1' },
  { key: 'neutral', label: 'Okay', icon: 'cloud', color: '#94A3B8' },
  { key: 'bad', label: 'Bad', icon: 'rainy', color: '#F59E0B' },
  { key: 'terrible', label: 'Rough', icon: 'thunderstorm', color: '#EF4444' },
];

export default function JournalModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { journal, addJournalEntry, deleteJournalEntry } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('neutral');

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const todayStr = new Date().toISOString().split('T')[0];
  const hasTodayEntry = journal.some(e => e.date === todayStr);

  const handleAdd = () => {
    if (!content.trim()) { Alert.alert('Required', 'Please write something'); return; }
    addJournalEntry({ content: content.trim(), mood, date: todayStr });
    setShowAdd(false); setContent(''); setMood('neutral');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Entry', 'Delete this journal entry?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteJournalEntry(id) },
    ]);
  };

  const getMoodConfig = (m: Mood) => MOODS.find(x => x.key === m) || MOODS[2];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Financial Journal</Text>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}>
          <Ionicons name={hasTodayEntry ? 'add' : 'pencil'} size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {!hasTodayEntry && (
        <TouchableOpacity
          style={[styles.todayPrompt, { backgroundColor: colors.primary + '18', borderColor: colors.primary + '33' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.primary} />
          <Text style={[styles.todayPromptText, { color: colors.primary }]}>Write today's financial reflection</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPadding + 20 }}>
        {journal.length === 0 ? (
          <EmptyState icon="journal-outline" title="No journal entries" subtitle="Reflect on your financial journey daily" />
        ) : (
          journal.map(entry => {
            const mc = getMoodConfig(entry.mood);
            const displayDate = new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            return (
              <View key={entry.id} style={[styles.entryCard, { backgroundColor: colors.card }]}>
                <View style={styles.entryHeader}>
                  <View style={[styles.moodBadge, { backgroundColor: mc.color + '22' }]}>
                    <Ionicons name={mc.icon} size={14} color={mc.color} />
                    <Text style={[styles.moodLabel, { color: mc.color }]}>{mc.label}</Text>
                  </View>
                  <View style={styles.entryActions}>
                    <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>{displayDate}</Text>
                    <TouchableOpacity onPress={() => handleDelete(entry.id)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={14} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={[styles.entryContent, { color: colors.foreground }]}>{entry.content}</Text>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { paddingTop: topPadding + 12, borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={() => setShowAdd(false)}><Text style={{ color: colors.mutedForeground, fontSize: 16 }}>Cancel</Text></TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>New Entry</Text>
            <TouchableOpacity onPress={handleAdd}><Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Save</Text></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>How are you feeling financially?</Text>
            <View style={styles.moodRow}>
              {MOODS.map(m => (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodBtn, { backgroundColor: mood === m.key ? m.color + '22' : colors.card, borderColor: mood === m.key ? m.color : colors.border }]}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMood(m.key); }}
                >
                  <Ionicons name={m.icon} size={20} color={mood === m.key ? m.color : colors.mutedForeground} />
                  <Text style={[styles.moodBtnText, { color: mood === m.key ? m.color : colors.mutedForeground }]}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
              placeholder="What's on your mind financially today? Any wins, worries, or goals?"
              placeholderTextColor={colors.mutedForeground}
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoFocus
            />
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
  todayPrompt: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  todayPromptText: { flex: 1, fontSize: 14, fontWeight: '500' },
  entryCard: { borderRadius: 16, padding: 16, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  moodBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  moodLabel: { fontSize: 12, fontWeight: '600' },
  entryActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entryDate: { fontSize: 12 },
  entryContent: { fontSize: 14, lineHeight: 21 },
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '500' },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 4 },
  moodBtnText: { fontSize: 10, fontWeight: '500' },
  textArea: { borderWidth: 1, borderRadius: 14, padding: 14, fontSize: 15, minHeight: 180, lineHeight: 22 },
});
