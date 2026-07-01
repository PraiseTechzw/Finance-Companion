import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

interface CurrencyDef { code: string; name: string; symbol: string; rate: number; flag: string; }

const BASE_CURRENCIES: Omit<CurrencyDef, 'rate'>[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'Fr', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$', flag: '🇲🇽' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', flag: '🇭🇰' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', flag: '🇳🇴' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', flag: '🇸🇪' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', flag: '🇳🇿' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', flag: '🇿🇦' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', flag: '🇸🇦' },
  { code: 'ZWG', name: 'Zimbabwe Gold (ZiG)', symbol: 'ZiG', flag: '🇿🇼' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', flag: '🇳🇬' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', flag: '🇰🇪' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵', flag: '🇬🇭' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£', flag: '🇪🇬' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺', flag: '🇹🇷' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', flag: '🇮🇩' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', flag: '🇲🇾' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱', flag: '🇵🇭' },
];

const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149.50, CAD: 1.36, AUD: 1.53,
  CHF: 0.88, CNY: 7.24, INR: 83.12, BRL: 4.97, MXN: 17.15, KRW: 1325.4,
  SGD: 1.34, HKD: 7.82, NOK: 10.57, SEK: 10.39, NZD: 1.63, ZAR: 16.38,
  AED: 3.67, SAR: 3.75, ZWG: 26.77, NGN: 1570, KES: 129, GHS: 15.2,
  EGP: 48.5, TRY: 32.1, THB: 35.1, IDR: 15750, MYR: 4.72, PHP: 56.4,
};

const NUMPAD = ['1','2','3','4','5','6','7','8','9','.','0','⌫'];

export default function CurrencyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [rateStatus, setRateStatus] = useState<'loading' | 'live' | 'offline'>('loading');
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [amount, setAmount] = useState('1');
  const [from, setFrom] = useState<string>('USD');
  const [to, setTo] = useState<string>('ZWG');
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [search, setSearch] = useState('');
  const fetchedRef = useRef(false);

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchLiveRates();
  }, []);

  const fetchLiveRates = async () => {
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (data.rates && typeof data.rates === 'object') {
        const merged: Record<string, number> = { ...FALLBACK_RATES, ...data.rates };
        if (!merged['ZWG'] && data.rates['ZWL']) merged['ZWG'] = data.rates['ZWL'];
        setRates(merged);
        setRateStatus('live');
        if (data.date) setUpdatedAt(data.date);
      }
    } catch {
      setRateStatus('offline');
    }
  };

  const currencies: CurrencyDef[] = BASE_CURRENCIES.map(c => ({
    ...c,
    rate: rates[c.code] ?? FALLBACK_RATES[c.code] ?? 1,
  }));

  const fromCurr = currencies.find(c => c.code === from) ?? currencies[0];
  const toCurr = currencies.find(c => c.code === to) ?? currencies[1];

  const numericAmount = parseFloat(amount) || 0;
  const fromRateUSD = rates[from] ?? 1;
  const toRateUSD = rates[to] ?? 1;
  const converted = (numericAmount / fromRateUSD) * toRateUSD;
  const rate = toRateUSD / fromRateUSD;

  const handleNumpad = useCallback((key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === '⌫') { setAmount(p => p.length > 1 ? p.slice(0, -1) : '0'); return; }
    if (key === '.' && amount.includes('.')) return;
    if (amount === '0' && key !== '.') { setAmount(key); return; }
    if (amount.split('.')[1]?.length >= 2) return;
    setAmount(p => p + key);
  }, [amount]);

  const swap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFrom(to);
    setTo(from);
  };

  const filteredCurrencies = currencies.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatConverted = (n: number) => {
    if (n >= 1000000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (n >= 100) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return n.toLocaleString('en-US', { maximumFractionDigits: 4 });
  };

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
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search currency..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoFocus
          />
        </View>
        <FlatList
          data={filteredCurrencies}
          keyExtractor={c => c.code}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.currRow, { borderBottomColor: colors.border }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (picking === 'from') setFrom(item.code);
                else setTo(item.code);
                setPicking(null);
                setSearch('');
              }}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.currCode, { color: colors.foreground }]}>{item.code}</Text>
                <Text style={[styles.currName, { color: colors.mutedForeground }]}>{item.name}</Text>
              </View>
              <Text style={[styles.currRateLabel, { color: colors.mutedForeground }]}>{item.symbol}</Text>
              {(from === item.code || to === item.code) && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              )}
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
        <TouchableOpacity onPress={fetchLiveRates} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          {rateStatus === 'loading'
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name="refresh-outline" size={22} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, paddingBottom: bottomPadding + 20 }}>
        <View style={[styles.converterCard, { backgroundColor: colors.card, margin: 16 }]}>
          <TouchableOpacity
            style={[styles.currSelector, { borderBottomColor: colors.border }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPicking('from'); }}
          >
            <Text style={styles.flag}>{fromCurr.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.currCode, { color: colors.foreground }]}>{fromCurr.code}</Text>
              <Text style={[styles.currName, { color: colors.mutedForeground }]}>{fromCurr.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.amountDisplay, { color: colors.foreground }]}>{fromCurr.symbol} {amount}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.swapBtn, { backgroundColor: colors.primary }]} onPress={swap}>
            <Ionicons name="swap-vertical" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.currSelector}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPicking('to'); }}
          >
            <Text style={styles.flag}>{toCurr.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.currCode, { color: colors.foreground }]}>{toCurr.code}</Text>
              <Text style={[styles.currName, { color: colors.mutedForeground }]}>{toCurr.name}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.amountDisplay, { color: colors.primary }]}>{toCurr.symbol} {formatConverted(converted)}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <View style={[styles.rateCard, { backgroundColor: colors.card + '80', marginHorizontal: 16, marginBottom: 16 }]}>
          <View style={[styles.rateBadge, { backgroundColor: rateStatus === 'live' ? colors.income + '25' : rateStatus === 'offline' ? colors.warning + '25' : colors.border }]}>
            <Text style={[styles.rateBadgeText, { color: rateStatus === 'live' ? colors.income : rateStatus === 'offline' ? colors.warning : colors.mutedForeground }]}>
              {rateStatus === 'live' ? 'LIVE' : rateStatus === 'offline' ? 'OFFLINE' : 'LOADING'}
            </Text>
          </View>
          <Text style={[styles.rateText, { color: colors.mutedForeground }]}>
            {`1 ${from} = ${toCurr.symbol} ${rate >= 1000 ? rate.toLocaleString('en-US', { maximumFractionDigits: 2 }) : rate.toFixed(4)} ${to}`}
            {updatedAt ? ` · Updated ${updatedAt}` : ''}
          </Text>
        </View>

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

        <View style={styles.quickAmounts}>
          {[100, 500, 1000, 5000].map(n => (
            <TouchableOpacity
              key={n}
              style={[styles.quickAmt, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setAmount(String(n)); }}
            >
              <Text style={[styles.quickAmtText, { color: colors.foreground }]}>{fromCurr.symbol}{n.toLocaleString()}</Text>
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
  currRateLabel: { fontSize: 14 },
  amountDisplay: { fontSize: 22, fontWeight: '700' },
  swapBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', margin: 4 },
  rateCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  rateBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  rateBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  rateText: { fontSize: 12, flex: 1 },
  numpad: { flexDirection: 'row', flexWrap: 'wrap', borderRadius: 20, padding: 8, marginBottom: 12 },
  numKey: { width: '33.333%', alignItems: 'center', paddingVertical: 16, borderRadius: 12 },
  numKeyText: { fontSize: 22, fontWeight: '500' },
  quickAmounts: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  quickAmt: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  quickAmtText: { fontSize: 12, fontWeight: '600' },
});
