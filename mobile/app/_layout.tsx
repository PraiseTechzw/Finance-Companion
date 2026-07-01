import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FinanceProvider } from "@/context/FinanceContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { UserProfileProvider, useUserProfile } from "@/context/UserProfileContext";
import LockScreen from "@/app/lock-screen";
import BiometricSetupScreen from "@/app/biometric-setup";
import OnboardingScreen from "@/app/onboarding";

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { status: profileStatus } = useUserProfile();
  if (status === 'loading' || profileStatus === 'loading') return null;
  if (profileStatus === 'needed') return <OnboardingScreen />;
  if (status === 'setup') return <BiometricSetupScreen />;
  if (status === 'locked') return <LockScreen />;
  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modals/add-transaction" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/accounts" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/goals" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/wishlist" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/bills" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/debt" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/investments" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/journal" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/settings" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/categories" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/subscriptions" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/calendar" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/currency" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/tax" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="modals/reports" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AuthProvider>
          <UserProfileProvider>
            <FinanceProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <AuthGate>
                    <RootLayoutNav />
                  </AuthGate>
                </KeyboardProvider>
              </GestureHandlerRootView>
            </FinanceProvider>
          </UserProfileProvider>
        </AuthProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
