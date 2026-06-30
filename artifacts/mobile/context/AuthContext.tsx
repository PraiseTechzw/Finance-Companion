import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_KEY = 'wealthly_biometric_enabled';

type AuthStatus = 'loading' | 'setup' | 'locked' | 'unlocked';

interface AuthContextType {
  status: AuthStatus;
  biometricType: LocalAuthentication.AuthenticationType | null;
  hasBiometricHardware: boolean;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  authenticate: () => Promise<boolean>;
  skip: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [biometricType, setBiometricType] = useState<LocalAuthentication.AuthenticationType | null>(null);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    // Web — skip auth entirely
    if (Platform.OS === 'web') {
      setStatus('unlocked');
      return;
    }

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometricHardware(hasHardware && isEnrolled);

      if (hasHardware && isEnrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricType(types[0] ?? null);
      }

      const stored = await AsyncStorage.getItem(BIOMETRIC_KEY);
      if (stored === null) {
        // First launch — show setup
        setStatus('setup');
      } else if (stored === 'true') {
        // Biometrics enabled — lock screen
        setStatus('locked');
      } else {
        // User opted out
        setStatus('unlocked');
      }
    } catch {
      setStatus('unlocked');
    }
  };

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') { setStatus('unlocked'); return true; }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Wealthly',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setStatus('unlocked');
        return true;
      }
      return false;
    } catch {
      setStatus('unlocked');
      return true;
    }
  }, []);

  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable biometric lock',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_KEY, 'true');
        setStatus('unlocked');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const disableBiometrics = useCallback(async () => {
    await AsyncStorage.setItem(BIOMETRIC_KEY, 'false');
  }, []);

  const skip = useCallback(async () => {
    await AsyncStorage.setItem(BIOMETRIC_KEY, 'false');
    setStatus('unlocked');
  }, []);

  return (
    <AuthContext.Provider value={{ status, biometricType, hasBiometricHardware, enableBiometrics, disableBiometrics, authenticate, skip }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
