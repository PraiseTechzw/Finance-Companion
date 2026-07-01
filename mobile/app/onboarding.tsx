import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserProfile } from '@/context/UserProfileContext';

const features = [
  {
    icon: 'wallet-outline',
    title: 'Track every account',
    body: 'Bring cash, savings, cards, and investments into one private snapshot.',
  },
  {
    icon: 'receipt-outline',
    title: 'Understand spending',
    body: 'Log income and expenses, sort them by category, and spot patterns quickly.',
  },
  {
    icon: 'flag-outline',
    title: 'Plan what is next',
    body: 'Build budgets, bills, goals, wishlists, debts, and subscriptions around real life.',
  },
  {
    icon: 'shield-checkmark-outline',
    title: 'Keep it offline',
    body: 'Your financial data stays on this device, with optional biometric protection.',
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useUserProfile();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cleanName = useMemo(() => name.trim().replace(/\s+/g, ' '), [name]);
  const canContinue = cleanName.length >= 2;
  const topPadding = Platform.OS === 'web' ? 56 : insets.top + 16;
  const bottomPadding = Platform.OS === 'web' ? 36 : insets.bottom + 18;

  const handleContinue = async () => {
    if (!canContinue || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    await completeOnboarding(cleanName);
    setSubmitting(false);
  };

  return (
    <LinearGradient
      colors={['#07111F', '#0C1A2C', '#0A1628']}
      style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="leaf" size={24} color="#07111F" />
            </View>
            <Text style={styles.brand}>Wealthly</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>Welcome</Text>
            <Text style={styles.title}>Let's set up your finance companion.</Text>
            <Text style={styles.subtitle}>
              Start with your name so Wealthly can greet you properly, then use the app to track, plan, and understand your money.
            </Text>
          </View>

          <View style={styles.nameCard}>
            <Text style={styles.inputLabel}>What should we call you?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="rgba(255,255,255,0.35)"
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              style={styles.input}
            />
          </View>

          <View style={styles.featureList}>
            {features.map(feature => (
              <View key={feature.title} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={18} color="#10B981" />
                </View>
                <View style={styles.featureTextBlock}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureBody}>{feature.body}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!canContinue || submitting}
            onPress={handleContinue}
            style={[styles.primaryButton, { opacity: canContinue && !submitting ? 1 : 0.45 }]}
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Setting up...' : 'Continue'}</Text>
            <Ionicons name="arrow-forward" size={20} color="#07111F" />
          </TouchableOpacity>
          <Text style={styles.footerNote}>You can update your name later in Settings.</Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 36 },
  logo: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  brand: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  hero: { marginBottom: 24 },
  eyebrow: { color: '#10B981', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  title: { color: '#FFFFFF', fontSize: 34, lineHeight: 39, fontWeight: '700' },
  subtitle: { color: 'rgba(255,255,255,0.58)', fontSize: 15, lineHeight: 23, marginTop: 12 },
  nameCard: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 20 },
  inputLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 13, fontWeight: '600', marginBottom: 10 },
  input: { minHeight: 52, borderRadius: 14, paddingHorizontal: 14, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.08)', fontSize: 17, fontWeight: '600' },
  featureList: { gap: 12 },
  featureRow: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.15)' },
  featureTextBlock: { flex: 1 },
  featureTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  featureBody: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 18 },
  footer: { paddingHorizontal: 24, gap: 10 },
  primaryButton: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#10B981' },
  primaryButtonText: { color: '#07111F', fontSize: 17, fontWeight: '800' },
  footerNote: { color: 'rgba(255,255,255,0.35)', fontSize: 12, textAlign: 'center' },
});
