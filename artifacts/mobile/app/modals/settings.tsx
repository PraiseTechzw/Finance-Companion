import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColors } from '@/hooks/useColors';
import { useFinance } from '@/context/FinanceContext';
import { getDb } from '@/lib/database';

const APP_VERSION = '1.0.0';
const BIOMETRIC_KEY = 'wealthly_biometric_enabled';

export default function SettingsModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accounts, transactions, categories, goals, bills, debts, investments, journal, wishlist, refreshAll } = useFinance();
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(BIOMETRIC_KEY).then(v => setBiometricEnabled(v === 'true'));
  }, []);

  const toggleBiometric = async () => {
    if (Platform.OS === 'web') { Alert.alert('Not Available', 'Biometric authentication requires a physical device.'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = !biometricEnabled;
    await AsyncStorage.setItem(BIOMETRIC_KEY, next ? 'true' : 'false');
    setBiometricEnabled(next);
    if (next) Alert.alert('Biometrics Enabled', 'You\'ll be asked to authenticate each time you open the app.');
    else Alert.alert('Biometrics Disabled', 'App will open without biometric authentication.');
  };

  const topPadding = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 34 : insets.bottom;

  const handleExport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lines = [
      'WEALTHLY EXPORT',
      `Exported: ${new Date().toLocaleDateString()}`,
      '',
      'TRANSACTIONS',
      'Date,Description,Amount,Type,Category',
      ...transactions.map(t => {
        const cat = categories.find(c => c.id === t.category_id)?.name || '';
        return `${t.date},"${t.description || ''}",${t.amount},${t.type},"${cat}"`;
      }),
      '',
      'ACCOUNTS',
      'Name,Type,Balance',
      ...accounts.map(a => `"${a.name}",${a.type},${a.balance}`),
      '',
      'GOALS',
      'Name,Target,Saved',
      ...goals.map(g => `"${g.name}",${g.target_amount},${g.saved_amount}`),
    ].join('\n');

    if (Platform.OS === 'web') {
      Alert.alert('Export Data', lines.substring(0, 500) + '\n\n[truncated for display]');
    } else {
      Share.share({ message: lines, title: 'Wealthly Export' });
    }
  };

  const handleClearData = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL your financial data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            try {
              const db = getDb();
              db.withTransactionSync(() => {
                ['transactions', 'accounts', 'categories', 'budgets', 'goals', 'wishlist', 'bills', 'debts', 'investments', 'journal'].forEach(table => {
                  db.runSync(`DELETE FROM ${table}`);
                });
              });
              refreshAll();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (e) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  const stats = [
    { label: 'Transactions', value: transactions.length, icon: 'receipt-outline' },
    { label: 'Accounts', value: accounts.length, icon: 'wallet-outline' },
    { label: 'Goals', value: goals.length, icon: 'flag-outline' },
    { label: 'Journal Entries', value: journal.length, icon: 'journal-outline' },
  ];

  const SettingRow = ({ icon, label, value, onPress, destructive }: { icon: keyof typeof Ionicons.glyphMap; label: string; value?: string; onPress: () => void; destructive?: boolean }) => (
    <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.settingIcon, { backgroundColor: destructive ? colors.destructive + '22' : colors.secondary }]}>
        <Ionicons name={icon} size={18} color={destructive ? colors.destructive : colors.foreground} />
      </View>
      <Text style={[styles.settingLabel, { color: destructive ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={styles.settingRight}>
        {value && <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>}
        <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: bottomPadding + 20 }}>
        {/* App stats */}
        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={[styles.statBox, { backgroundColor: colors.card }]}>
              <Ionicons name={stat.icon as any} size={20} color={colors.primary} />
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DATA</Text>
          <SettingRow icon="download-outline" label="Export Data (CSV)" onPress={handleExport} />
          <SettingRow icon="trash-outline" label="Clear All Data" onPress={handleClearData} destructive />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SECURITY</Text>
          <TouchableOpacity style={[styles.settingRow, { borderBottomColor: colors.border }]} onPress={toggleBiometric} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: colors.primary + '22' }]}>
              <Ionicons name="finger-print-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: colors.foreground }]}>Biometric Lock</Text>
              <Text style={[styles.settingValue, { color: colors.mutedForeground, fontSize: 11 }]}>Require auth on every open</Text>
            </View>
            <View style={[styles.toggle, { backgroundColor: biometricEnabled ? colors.primary : colors.secondary }]}>
              <View style={[styles.toggleThumb, { left: biometricEnabled ? 22 : 2 }]} />
            </View>
          </TouchableOpacity>
          <SettingRow icon="lock-closed-outline" label="Privacy" value="Offline only" onPress={() => {
            Alert.alert('Privacy', 'Wealthly stores all your data locally on your device. No data is ever sent to external servers. Your financial information stays completely private.');
          }} />
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>APP</Text>
          <SettingRow icon="information-circle-outline" label="Version" value={APP_VERSION} onPress={() => {}} />
          <SettingRow icon="calculator-outline" label="Tax Estimator" onPress={() => { router.back(); setTimeout(() => router.push('/modals/tax'), 100); }} />
          <SettingRow icon="repeat-outline" label="Subscriptions" onPress={() => { router.back(); setTimeout(() => router.push('/modals/subscriptions'), 100); }} />
          <SettingRow icon="globe-outline" label="Currency Converter" onPress={() => { router.back(); setTimeout(() => router.push('/modals/currency'), 100); }} />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Wealthly v{APP_VERSION}</Text>
          <Text style={[styles.footerSub, { color: colors.mutedForeground }]}>100% offline · Your data stays on your device</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  title: { fontSize: 17, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16, paddingBottom: 8 },
  statBox: { width: '47%', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 11, textAlign: 'center' },
  section: { marginHorizontal: 16, borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  settingIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  settingLabel: { flex: 1, fontSize: 15 },
  settingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingValue: { fontSize: 14 },
  footer: { alignItems: 'center', paddingVertical: 24, gap: 4 },
  footerText: { fontSize: 13, fontWeight: '500' },
  footerSub: { fontSize: 11 },
  toggle: { width: 50, height: 28, borderRadius: 14 },
  toggleThumb: { position: 'absolute', top: 3, width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
});
