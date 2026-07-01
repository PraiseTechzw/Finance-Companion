import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const PROFILE_KEY = 'wealthly_user_profile';

type OnboardingStatus = 'loading' | 'needed' | 'complete';

interface StoredProfile {
  name: string;
  completedOnboarding: boolean;
}

interface UserProfileContextType {
  status: OnboardingStatus;
  name: string;
  displayName: string;
  completeOnboarding: (name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<OnboardingStatus>('loading');
  const [name, setName] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        const raw = await AsyncStorage.getItem(PROFILE_KEY);
        if (!mounted) return;

        if (!raw) {
          setStatus('needed');
          return;
        }

        const profile = JSON.parse(raw) as Partial<StoredProfile>;
        const nextName = normalizeName(profile.name ?? '');
        setName(nextName);
        setStatus(profile.completedOnboarding && nextName ? 'complete' : 'needed');
      } catch {
        if (mounted) setStatus('needed');
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (nextName: string, completedOnboarding: boolean) => {
    const cleanName = normalizeName(nextName);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify({ name: cleanName, completedOnboarding }));
    setName(cleanName);
    setStatus(completedOnboarding && cleanName ? 'complete' : 'needed');
  }, []);

  const completeOnboarding = useCallback(async (nextName: string) => {
    await persist(nextName, true);
  }, [persist]);

  const updateName = useCallback(async (nextName: string) => {
    await persist(nextName, true);
  }, [persist]);

  const resetOnboarding = useCallback(async () => {
    await AsyncStorage.removeItem(PROFILE_KEY);
    setName('');
    setStatus('needed');
  }, []);

  const value = useMemo<UserProfileContextType>(() => ({
    status,
    name,
    displayName: name || 'there',
    completeOnboarding,
    updateName,
    resetOnboarding,
  }), [completeOnboarding, name, resetOnboarding, status, updateName]);

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const context = useContext(UserProfileContext);
  if (!context) throw new Error('useUserProfile must be used within a UserProfileProvider');
  return context;
}
