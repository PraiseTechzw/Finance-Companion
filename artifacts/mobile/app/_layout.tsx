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

SplashScreen.preventAutoHideAsync();

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
        <FinanceProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <RootLayoutNav />
            </KeyboardProvider>
          </GestureHandlerRootView>
        </FinanceProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
