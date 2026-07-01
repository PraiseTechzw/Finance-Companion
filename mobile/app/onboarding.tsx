import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUserProfile } from '@/context/UserProfileContext';
import { useColors } from '@/hooks/useColors';

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
  const colors = useColors();
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useUserProfile();
  const [name, setName] = useState('');
  const [activeCard, setActiveCard] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const carouselRef = useRef<FlatList<(typeof features)[number]>>(null);
  const lastInteractionAt = useRef(Date.now());

  const cleanName = useMemo(() => name.trim().replace(/\s+/g, ' '), [name]);
  const canContinue = cleanName.length >= 2;
  const topPadding = Platform.OS === 'web' ? 56 : insets.top + 16;
  const bottomPadding = Platform.OS === 'web' ? 36 : insets.bottom + 18;
  const horizontalPadding = 24;
  const cardWidth = Math.min(width - horizontalPadding * 2 - 18, 340);
  const cardStep = cardWidth * 0.78;

  const handleContinue = async () => {
    if (!canContinue || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    await completeOnboarding(cleanName);
    setSubmitting(false);
  };

  const setActiveFeatureCard = useCallback((index: number, shouldVibrate = true) => {
    setActiveCard(current => {
      if (current === index) return current;
      if (shouldVibrate) Haptics.selectionAsync();
      return index;
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastInteractionAt.current < 3200) return;
      const nextIndex = (activeCard + 1) % features.length;
      carouselRef.current?.scrollToOffset({ offset: nextIndex * cardStep, animated: true });
      setActiveFeatureCard(nextIndex);
    }, 3600);

    return () => clearInterval(timer);
  }, [activeCard, cardStep, setActiveFeatureCard]);

  const handleCardScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = event.nativeEvent.contentOffset.x;
    const nextIndex = Math.max(0, Math.min(features.length - 1, Math.round(x / cardStep)));
    setActiveFeatureCard(nextIndex);
  };

  const handleCarouselTouch = () => {
    lastInteractionAt.current = Date.now();
  };

  return (
    <LinearGradient
      colors={colors.isDark ? ['#0A0E1A', '#0F172A', '#0A1628'] : ['#F8FAFC', '#ECFDF5', '#EEF2FF']}
      style={[styles.container, { paddingTop: topPadding, paddingBottom: bottomPadding }]}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.brandRow}>
            <View style={[styles.logo, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Image source={require('@/assets/images/icon.png')} style={styles.logoImage} />
            </View>
            <Text style={[styles.brand, { color: colors.foreground }]}>Wealthly</Text>
          </View>

          <View style={styles.hero}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>Welcome</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Let's set up your finance companion.</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Start with your name so Wealthly can greet you properly, then use the app to track, plan, and understand your money.
            </Text>
          </View>

          <View style={[styles.nameCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>What should we call you?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.input, borderColor: colors.border }]}
            />
          </View>

          <View style={styles.carouselBlock}>
            <FlatList
              ref={carouselRef}
              data={features}
              horizontal
              keyExtractor={item => item.title}
              showsHorizontalScrollIndicator={false}
              snapToInterval={cardStep}
              decelerationRate="fast"
              disableIntervalMomentum
              onScrollBeginDrag={handleCarouselTouch}
              onMomentumScrollEnd={handleCardScroll}
              onTouchStart={handleCarouselTouch}
              contentContainerStyle={[styles.carouselContent, { paddingRight: horizontalPadding + cardWidth - cardStep }]}
              getItemLayout={(_, index) => ({ length: cardStep, offset: cardStep * index, index })}
              renderItem={({ item, index }) => (
                <View
                  style={[
                    styles.featureCard,
                    {
                      width: cardWidth,
                      backgroundColor: colors.card,
                      borderColor: index === activeCard ? colors.primary + '66' : colors.border,
                      marginRight: index === features.length - 1 ? 0 : -(cardWidth - cardStep),
                      opacity: index < activeCard ? 0.55 : 1,
                      transform: [
                        { translateY: index === activeCard ? 0 : 12 },
                        { scale: index === activeCard ? 1 : 0.94 },
                        { rotate: index < activeCard ? '-2deg' : index > activeCard ? '2deg' : '0deg' },
                      ],
                      zIndex: features.length - Math.abs(index - activeCard),
                    },
                  ]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: colors.primary + '18' }]}>
                    <Ionicons name={item.icon as any} size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.featureTitle, { color: colors.foreground }]}>{item.title}</Text>
                  <Text style={[styles.featureBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                </View>
              )}
            />
            <View style={styles.dots}>
              {features.map((feature, index) => (
                <View
                  key={feature.title}
                  style={[
                    styles.dot,
                    {
                      width: activeCard === index ? 18 : 7,
                      backgroundColor: activeCard === index ? colors.primary : colors.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!canContinue || submitting}
            onPress={handleContinue}
            style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: canContinue && !submitting ? 1 : 0.45 }]}
          >
            <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{submitting ? 'Setting up...' : 'Continue'}</Text>
            <Ionicons name="arrow-forward" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
          <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>You can update your name later in Settings.</Text>
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
  logo: { width: 46, height: 46, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logoImage: { width: 42, height: 42, borderRadius: 12 },
  brand: { fontSize: 20, fontWeight: '700' },
  hero: { marginBottom: 24 },
  eyebrow: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 23, marginTop: 12 },
  nameCard: { borderWidth: 1, borderRadius: 20, padding: 16, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  input: { minHeight: 52, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 17, fontWeight: '600' },
  carouselBlock: { marginHorizontal: -24 },
  carouselContent: { paddingHorizontal: 24 },
  featureCard: { minHeight: 164, borderRadius: 20, borderWidth: 1, padding: 18, justifyContent: 'space-between' },
  featureIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 17, fontWeight: '700', marginTop: 16, marginBottom: 6 },
  featureBody: { fontSize: 14, lineHeight: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7, marginTop: 14 },
  dot: { height: 7, borderRadius: 4 },
  footer: { paddingHorizontal: 24, gap: 10 },
  primaryButton: { height: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryButtonText: { fontSize: 17, fontWeight: '800' },
  footerNote: { fontSize: 12, textAlign: 'center' },
});
