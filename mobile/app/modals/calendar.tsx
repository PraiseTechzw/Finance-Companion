import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n); }

export default function CalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { transactions, bills, categories } = useFinance();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); setSelectedDay(1); };
  const nextMonth = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); setSelectedDay(1); };

  // Events per day
  const eventsByDay = useMemo(() => {
    const map: Record<number, { income: number; expense: number; hasBill: boolean }> = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = { income: 0, expense: 0, hasBill: false };
        if (t.type === 'income') map[day].income += t.amount;
        else if (t.type === 'expense') map[day].expense += t.amount;
      }
    });
    bills.forEach(b => {
      if (!b.is_paid) {
        if (!map[b.due_day]) map[b.due_day] = { income: 0, expense: 0, hasBill: false };
        map[b.due_day].hasBill = true;
      }
    });
    return map;
  }, [transactions, bills, year, month]);

  // Selected day events
  const selectedTxns = useMemo(() => transactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDay;
  }), [transactions, year, month, selectedDay]);

  const selectedBills = bills.filter(b => b.due_day === selectedDay && !b.is_paid);
  const todayIncome = selectedTxns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const todayExpense = selectedTxns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) => day === now.getDate() && month === now.getMonth() && year === now.getFullYear();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Financial Calendar</Text>
        <TouchableOpacity onPress={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); setSelectedDay(now.getDate()); }}>
          <Text style={[styles.todayBtn, { color: colors.primary }]}>Today</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}>
        {/* Month Nav */}
        <View style={[styles.monthNav, { backgroundColor: colors.card, marginHorizontal: 16, marginTop: 12 }]}>
          <TouchableOpacity onPress={prevMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>{monthName}</Text>
          <TouchableOpacity onPress={nextMonth} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-forward" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={[styles.calendarCard, { backgroundColor: colors.card, marginHorizontal: 16, marginTop: 8 }]}>
          {/* Weekday labels */}
          <View style={styles.weekdayRow}>
            {weekdays.map(d => (
              <Text key={d} style={[styles.weekday, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>
          {/* Day cells */}
          {Array.from({ length: cells.length / 7 }, (_, w) => (
            <View key={w} style={styles.weekRow}>
              {cells.slice(w * 7, (w + 1) * 7).map((day, i) => {
                const ev = day ? eventsByDay[day] : null;
                const isSel = day === selectedDay;
                const isTod = day ? isToday(day) : false;
                return (
                  <TouchableOpacity
                    key={i}
                    style={[
                      styles.dayCell,
                      isSel && { backgroundColor: colors.primary },
                      isTod && !isSel && { borderWidth: 1.5, borderColor: colors.primary },
                    ]}
                    onPress={() => day && (Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), setSelectedDay(day))}
                    disabled={!day}
                  >
                    <Text style={[styles.dayNum, { color: day ? (isSel ? colors.primaryForeground : colors.foreground) : 'transparent' }]}>{day || ''}</Text>
                    {ev && day && (
                      <View style={styles.dotRow}>
                        {ev.income > 0 && <View style={[styles.dot, { backgroundColor: isSel ? colors.primaryForeground : colors.income }]} />}
                        {ev.expense > 0 && <View style={[styles.dot, { backgroundColor: isSel ? colors.primaryForeground + 'AA' : colors.expense }]} />}
                        {ev.hasBill && <View style={[styles.dot, { backgroundColor: isSel ? colors.primaryForeground + '88' : colors.warning }]} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Selected Day Details */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={[styles.dayDetailTitle, { color: colors.foreground }]}>
            {new Date(year, month, selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>

          {(todayIncome > 0 || todayExpense > 0) && (
            <View style={[styles.dayStatsRow, { backgroundColor: colors.card }]}>
              {todayIncome > 0 && (
                <View style={styles.dayStat}>
                  <Ionicons name="arrow-up-circle" size={16} color={colors.income} />
                  <Text style={[styles.dayStatLabel, { color: colors.mutedForeground }]}>Income</Text>
                  <Text style={[styles.dayStatValue, { color: colors.income }]}>{fmt(todayIncome)}</Text>
                </View>
              )}
              {todayExpense > 0 && (
                <View style={styles.dayStat}>
                  <Ionicons name="arrow-down-circle" size={16} color={colors.expense} />
                  <Text style={[styles.dayStatLabel, { color: colors.mutedForeground }]}>Spent</Text>
                  <Text style={[styles.dayStatValue, { color: colors.expense }]}>{fmt(todayExpense)}</Text>
                </View>
              )}
            </View>
          )}

          {selectedBills.map(bill => (
            <View key={bill.id} style={[styles.eventCard, { backgroundColor: colors.warning + '18', borderColor: colors.warning + '44' }]}>
              <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventTitle, { color: colors.foreground }]}>{bill.name} due</Text>
                <Text style={[styles.eventSub, { color: colors.mutedForeground }]}>{bill.recurrence} bill</Text>
              </View>
              <Text style={[styles.eventAmt, { color: colors.warning }]}>{fmt(bill.amount)}</Text>
            </View>
          ))}

          {selectedTxns.map(t => {
            const cat = categories.find(c => c.id === t.category_id);
            return (
              <View key={t.id} style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.eventIcon, { backgroundColor: cat?.color ? cat.color + '22' : colors.secondary }]}>
                  <Ionicons name={(cat?.icon || 'ellipse-outline') as any} size={16} color={cat?.color || colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: colors.foreground }]}>{t.description || cat?.name || 'Transaction'}</Text>
                  <Text style={[styles.eventSub, { color: colors.mutedForeground }]}>{cat?.name}</Text>
                </View>
                <Text style={[styles.eventAmt, { color: t.type === 'income' ? colors.income : colors.expense }]}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </Text>
              </View>
            );
          })}

          {selectedTxns.length === 0 && selectedBills.length === 0 && (
            <Text style={[styles.noEvents, { color: colors.mutedForeground }]}>No events on this day</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  todayBtn: { fontSize: 15, fontWeight: '500' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 16, padding: 14 },
  monthTitle: { fontSize: 16, fontWeight: '700' },
  calendarCard: { borderRadius: 20, padding: 12 },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  weekRow: { flexDirection: 'row' },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 10, marginVertical: 1 },
  dayNum: { fontSize: 14, fontWeight: '500' },
  dotRow: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 4, height: 4, borderRadius: 2 },
  dayDetailTitle: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  dayStatsRow: { flexDirection: 'row', borderRadius: 14, padding: 14, gap: 20, marginBottom: 10 },
  dayStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayStatLabel: { fontSize: 12 },
  dayStatValue: { fontSize: 15, fontWeight: '700' },
  eventCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 8 },
  eventIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '500' },
  eventSub: { fontSize: 12, marginTop: 1 },
  eventAmt: { fontSize: 15, fontWeight: '700' },
  noEvents: { textAlign: 'center', fontSize: 14, marginTop: 20 },
});
