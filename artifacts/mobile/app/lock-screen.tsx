import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useColors } from '@/hooks/useColors';
import * as LocalAuthentication from 'expo-local-authentication';

export default function LockScreen() {
  const { authenticate, skip, biometricType, hasBiometricHardware } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState('');
  const shakeAnim = new Animated.Value(0);

  useEffect(() => {
    // Auto-trigger biometric on mount
    triggerAuth();
  }, []);

  const triggerAuth = async () => {
    const ok = await authenticate();
    if (!ok) {
      setError('Authentication failed. Try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
  };

  const biometricIcon = biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    ? 'scan-outline' : 'finger-print-outline';
  const biometricLabel = biometricType === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
    ? 'Face ID' : 'Touch ID';

  const topPadding = Platform.OS === 'web' ? 60 : insets.top;
  const bottomPadding = Platform.OS === 'web' ? 40 : insets.bottom;

  return (
    <LinearGradient
      colors={['#070D1A', '#0D1829', '#0A1628']}
      style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative orb */}
      <View style={styles.orbContainer}>
        <View style={[styles.orb, { backgroundColor: '#10B981' }]} />
      </View>

      {/* Logo area */}
      <View style={styles.logoArea}>
        <View style={[styles.logoRing, { borderColor: 'rgba(16,185,129,0.4)' }]}>
          <View style={[styles.logoInner, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
            <Text style={styles.logoLetter}>W</Text>
          </View>
        </View>
        <Text style={styles.appName}>Wealthly</Text>
        <Text style={styles.tagline}>Your finances, secured</Text>
      </View>

      {/* Lock icon area */}
      <Animated.View style={[styles.lockArea, { transform: [{ translateX: shakeAnim }] }]}>
        <TouchableOpacity
          style={[styles.biometricBtn, { borderColor: 'rgba(16,185,129,0.4)', backgroundColor: 'rgba(16,185,129,0.1)' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setError(''); triggerAuth(); }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={hasBiometricHardware ? biometricIcon : 'lock-closed-outline'}
            size={52}
            color="#10B981"
          />
        </TouchableOpacity>
        <Text style={styles.biometricLabel}>
          {hasBiometricHardware ? `Tap to use ${biometricLabel}` : 'Tap to unlock'}
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </Animated.View>

      {/* Unlock button */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.unlockBtn, { backgroundColor: '#10B981' }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setError(''); triggerAuth(); }}
          activeOpacity={0.85}
        >
          <Ionicons name={hasBiometricHardware ? biometricIcon : 'lock-open-outline'} size={20} color="#fff" />
          <Text style={styles.unlockText}>{hasBiometricHardware ? biometricLabel : 'Unlock'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Use without biometrics</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'space-between' },
  orbContainer: { position: 'absolute', top: -80, right: -80, opacity: 0.15 },
  orb: { width: 300, height: 300, borderRadius: 150 },
  logoArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 40 },
  logoRing: { width: 100, height: 100, borderRadius: 50, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  logoInner: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#10B981', fontSize: 38, fontWeight: '800' },
  appName: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  tagline: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  lockArea: { alignItems: 'center', gap: 16, marginBottom: 40 },
  biometricBtn: { width: 112, height: 112, borderRadius: 56, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  biometricLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  errorText: { color: '#EF4444', fontSize: 13, textAlign: 'center' },
  bottom: { width: '100%', paddingHorizontal: 32, gap: 12, marginBottom: 20 },
  unlockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 16 },
  unlockText: { color: '#FFFFFF', fontSize: 17, fontWeight: '600' },
  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
});
