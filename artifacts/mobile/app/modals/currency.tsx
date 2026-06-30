import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

interface CurrencyDef { code: string; name: string; symbol: string; rate: number; flag: string; }

const CURRENCIES: CurrencyDef[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1, flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.79, flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 149.50, flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rate: 1.36, flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.53, flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', rate: 0.88, flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', rate: 7.24, flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.12, flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', rate: 4.97, flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', rate: 17.15, flag: '🇲🇽' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', rate: 1325.4, flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 1.34, flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', rate: 7.82, flag: '🇭🇰' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', rate: 10.57, flag: '🇳🇴' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', rate: 10.39, flag: '🇸🇪' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', rate: 1.63, flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', rate: 18.63, flag: '🇿🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rate: 3.67, flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'SAR', rate: 3.75, flag: '🇸🇦' },
];

const NUMPAD = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export default function CurrencyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState<CurrencyDef>(CURRENCIES[0]);
  const [to, setTo] = useState<CurrencyDef>(CURRENCIES[1]);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [search, setSearch] = useState('');

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const numericAmount = parseFloat(amount) || 0;
  const converted = (numericAmount / from.rate) * to.rate;
  const rate = to.rate / from.rate;

  const handleNumpad = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === '⌫') { setAmount(p => p.length > 1 ? p.slice(0, -1) : '0'); return; }
    if (key === '.' && amount.includes('.')) return;
    if (amount === '0' && key !== '.') { setAmount(key); return; }
    if (amount.split('.')[1]?.length >= 2) return;
    setAmount(p => p + key);
  }, [amount]);

  const swap = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setFrom(to); setTo(from); };

  const filteredCurrencies = CURRENCIES.filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()));

  if (picking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => { setPicking(null); setSearch(''); }}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Select Currency</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border, margin: 16 }]}>
          <Ionicons name="search-outline" size={16} color={colors.mutedForeground} />
          <TextInput style={[styles.searchInput, { color: colors.foreground }]} placeholder="Search..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} autoFocus />
        </View>
        <FlatList
          data={filteredCurrencies}
          keyExtractor={c => c.code}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.currRow, { borderBottomColor: colors.border }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); picking === 'from' ? setFrom(item) : setTo(item); setPicking(null); setSearch(''); }}>
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currCode, { color: colors.foreground }]}>{item.code}</Text>
                <Text style={[styles.currName, { color: colors.mutedForeground }]}>{item.name}</Text>
              </View>
              <Text style={[styles.currRate, { color: colors.mutedForeground }]}>{item.symbol}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Currency Converter</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={{ flex: 1, paddingBottom: bottomPadding + 20 }}>
        {/* Converter */}
        <View style={[styles.converterCard, { backgroundColor: colors.card, margin: 16 }]}>
          {/* From */}
          <TouchableOpacity style={[styles.currSelector, { borderBottomColor: colors.border }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPicking('from'); }}>
            <Text style={styles.flag}>{from.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.currCode, { color: colors.foreground }]}>{from.code}</Text>
              <Text style={[styles.currName, { color: colors.mutedForeground }]}>{from.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.amountDisplay, { color: colors.foreground }]}>{from.symbol}{amount}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {/* Swap button */}
          <TouchableOpacity style={[styles.swapBtn, { backgroundColor: colors.primary }]} onPress={swap}>
            <Ionicons name="swap-vertical" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>

          {/* To */}
          <TouchableOpacity style={styles.currSelector} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPicking('to'); }}>
            <Text style={styles.flag}>{to.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.currCode, { color: colors.foreground }]}>{to.code}</Text>
              <Text style={[styles.currName, { color: colors.mutedForeground }]}>{to.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.amountDisplay, { color: colors.primary }]}>{to.symbol}{converted.toLocaleString('en-US', { maximumFractionDigits: 4 })}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Rate info */}
        <View style={[styles.rateCard, { backgroundColor: colors.card + '80', marginHorizontal: 16, marginBottom: 16 }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.mutedForeground} />
          <Text style={[styles.rateText, { color: colors.mutedForeground }]}>
            1 {from.code} = {to.symbol}{rate.toFixed(4)} {to.code} · Indicative rate
          </Text>
        </View>

        {/* Numpad */}
        <View style={[styles.numpad, { backgroundColor: colors.card, marginHorizontal: 16 }]}>
          {NUMPAD.map(k => (
            <TouchableOpacity
              key={k}
              style={[styles.numKey, k === '⌫' && { backgroundColor: colors.destructive + '15' }]}
              onPress={() => handleNumpad(k)}
              activeOpacity={0.6}
            >
              <Text style={[styles.numKeyText, { color: k === '⌫' ? colors.destructive : colors.foreground }]}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick amounts */}
        <View style={styles.quickAmounts}>
          {[100, 500, 1000, 5000].map(n => (
            <TouchableOpacity key={n} style={[styles.quickAmt, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAmount(String(n)); }}>
              <Text style={[styles.quickAmtText, { color: colors.foreground }]}>{from.symbol}{n.toLocaleString()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  currRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  converterCard: { borderRadius: 20, overflow: 'hidden' },
  currSelector: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  flag: { fontSize: 28 },
  currCode: { fontSize: 16, fontWeight: '700' },
  currName: { fontSize: 12, marginTop: 2 },
  currRate: { fontSize: 14 },
  amountDisplay: { fontSize: 22, fontWeight: '700' },
  swapBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', margin: 4 },
  rateCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  rateText: { fontSize: 12, flex: 1 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 20, padding: 8, marginBottom: 12 },
  numKey: { width: '33.333%', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  numKeyText: { fontSize: 22, fontWeight: '500' },
  quickAmounts: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  quickAmt: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  quickAmtText: { fontSize: 12, fontWeight: '600' },
});
