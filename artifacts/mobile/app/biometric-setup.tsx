import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import * as LocalAuthentication from 'expo-local-authentication';

export default function BiometricSetupScreen() {
  const { enableBiometrics, skip, biometricType, hasBiometricHardware } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 40 : insets.bottom;

  const isFaceId = biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION;
  const biometricLabel = isFaceId ? 'Face ID' : 'Touch ID';
  const biometricIcon = isFaceId ? 'scan-outline' : 'finger-print-outline';

  const handleEnable = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await enableBiometrics();
    setLoading(false);
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await skip();
  };

  return (
    <LinearGradient
      colors={['#070D1A', '#0D1829', '#0A1628']}
      style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
    >
      {/* Background orb */}
      <View style={styles.orbContainer}>
        <View style={[styles.orb1, { backgroundColor: '#10B981' }]} />
        <View style={[styles.orb2, { backgroundColor: '#6366F1' }]} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconRing, { borderColor: 'rgba(16,185,129,0.5)' }]}>
          <View style={[styles.iconInner, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <Ionicons name={hasBiometricHardware ? biometricIcon : 'shield-outline'} size={56} color="#10B981" />
          </View>
        </View>

        <Text style={styles.title}>Secure Your{'\n'}Finances</Text>
        <Text style={styles.subtitle}>
          {hasBiometricHardware
            ? `Use ${biometricLabel} to quickly and securely access Wealthly every time you open the app.`
            : 'Protect your financial data with device security every time you open the app.'}
        </Text>

        {/* Features */}
        {[
          { icon: 'lock-closed-outline', text: 'Your data stays private' },
          { icon: 'flash-outline', text: 'Instant, frictionless access' },
          { icon: 'shield-checkmark-outline', text: 'No passwords to remember' },
        ].map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
              <Ionicons name={f.icon as any} size={18} color="#10B981" />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttons}>
        {hasBiometricHardware && (
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: '#10B981', opacity: loading ? 0.7 : 1 }]}
            onPress={handleEnable}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Ionicons name={biometricIcon} size={22} color="#fff" />
            <Text style={styles.primaryBtnText}>Enable {biometricLabel}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryBtnText}>
            {hasBiometricHardware ? 'Skip for now' : 'Continue without biometrics'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.note}>You can change this anytime in Settings</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  orbContainer: { position: 'absolute', top: 0, right: 0, left: 0, bottom: 0, overflow: 'hidden' },
  orb1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, top: -60, right: -60, opacity: 0.12 },
  orb2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: 100, left: -80, opacity: 0.10 },
  content: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 20 },
  iconRing: { width: 130, height: 130, borderRadius: 65, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconInner: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '700', textAlign: 'center', letterSpacing: -0.5, lineHeight: 40 },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 15, textAlign: 'center', lineHeight: 22, maxWidth: 280 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
  featureIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureText: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '500' },
  buttons: { paddingHorizontal: 32, gap: 12, paddingBottom: 16 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17, borderRadius: 16 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 15, borderRadius: 16, borderWidth: 1 },
  secondaryBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '500' },
  note: { color: 'rgba(255,255,255,0.2)', fontSize: 12, textAlign: 'center' },
});
