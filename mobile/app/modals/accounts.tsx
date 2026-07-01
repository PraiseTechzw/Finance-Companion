import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Modal,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { SvgUri } from "react-native-svg";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useFinance, Account } from "@/context/FinanceContext";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

const ACCOUNT_COLORS = [
  "#10B981",
  "#6366F1",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
  "#EC4899",
  "#F97316",
];
const ACCOUNT_TYPES = [
  "checking",
  "savings",
  "cash",
  "investment",
  "credit",
  "ecocash",
] as const;

const TYPE_ICONS: Record<
  (typeof ACCOUNT_TYPES)[number],
  keyof typeof Ionicons.glyphMap
> = {
  checking: "card-outline",
  savings: "save-outline",
  cash: "cash-outline",
  investment: "trending-up-outline",
  credit: "card",
  ecocash: "cash-outline",
};

function AccountTypeIcon({
  type,
  size = 22,
  color,
}: {
  type: string;
  size?: number;
  color?: string;
}) {
  if (type === "ecocash") {
    return (
      <SvgUri
        width={30}
        height={20}
        uri={
          Image.resolveAssetSource(require("../../assets/images/ecocash.svg"))
            .uri
        }
      />
    );
  }

  const iconName = (TYPE_ICONS[type as keyof typeof TYPE_ICONS] ||
    "wallet-outline") as keyof typeof Ionicons.glyphMap;

  return <Ionicons name={iconName} size={size} color={color} />;
}

export default function AccountsModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accounts, addAccount, deleteAccount } = useFinance();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("checking");
  const [balance, setBalance] = useState("");
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const netWorth = accounts.reduce(
    (s, a) => s + (a.type === "credit" ? -a.balance : a.balance),
    0,
  );
  const totalAbsBalance =
    accounts.reduce((s, a) => s + Math.abs(a.balance), 0) || 1;

  const resetForm = () => {
    setName("");
    setBalance("");
    setType("checking");
    setSelectedColor(ACCOUNT_COLORS[0]);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter an account name");
      return;
    }
    addAccount({
      name: name.trim(),
      type,
      balance: parseFloat(balance) || 0,
      currency: "USD",
      color: selectedColor,
      icon: TYPE_ICONS[type],
      is_primary: accounts.length === 0 ? 1 : 0,
    });
    setShowAdd(false);
    resetForm();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Account",
      `Delete "${name}" and all its transactions?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAccount(id),
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Accounts
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAdd(true);
          }}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Net worth summary */}
      <View style={[styles.netWorthBanner, { backgroundColor: colors.card }]}>
        <Text style={[styles.netWorthLabel, { color: colors.mutedForeground }]}>
          TOTAL NET WORTH
        </Text>
        <Text
          style={[
            styles.netWorthValue,
            { color: netWorth >= 0 ? colors.income : colors.expense },
          ]}
        >
          {fmt(netWorth)}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPadding + 20,
        }}
      >
        {accounts.map((acc) => {
          const share = Math.abs(acc.balance) / totalAbsBalance;
          return (
            <View
              key={acc.id}
              style={[
                styles.accountCard,
                {
                  backgroundColor: colors.card,
                  shadowColor: Platform.OS === "ios" ? "#000" : undefined,
                },
              ]}
            >
              <View style={styles.accountTopRow}>
                <View
                  style={[
                    styles.accountLeft,
                    {
                      backgroundColor: acc.color + "1A",
                      borderColor: acc.color + "3D",
                    },
                  ]}
                >
                  <AccountTypeIcon
                    type={acc.type}
                    size={22}
                    color={acc.color}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.accNameRow}>
                    <Text
                      style={[styles.accName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {acc.name}
                    </Text>
                    {!!acc.is_primary && (
                      <View
                        style={[
                          styles.primaryBadge,
                          { backgroundColor: colors.primary + "1F" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.primaryBadgeText,
                            { color: colors.primary },
                          ]}
                        >
                          Primary
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={[styles.accType, { color: colors.mutedForeground }]}
                  >
                    {acc.type} · {acc.currency}
                  </Text>
                </View>

                <Text
                  style={[
                    styles.accBalance,
                    {
                      color:
                        acc.type === "credit" ? colors.expense : colors.income,
                    },
                  ]}
                >
                  {fmt(acc.balance)}
                </Text>

                <TouchableOpacity
                  onPress={() => handleDelete(acc.id, acc.name)}
                  style={[
                    styles.deleteBtn,
                    { backgroundColor: colors.destructive + "14" },
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={15}
                    color={colors.destructive}
                  />
                </TouchableOpacity>
              </View>

              <View
                style={[styles.shareTrack, { backgroundColor: colors.border }]}
              >
                <View
                  style={[
                    styles.shareFill,
                    {
                      width: `${Math.min(share * 100, 100)}%`,
                      backgroundColor: acc.color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={showAdd}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAdd(false)}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {Platform.OS !== "ios" && (
            <View style={styles.dragHandleWrap}>
              <View
                style={[styles.dragHandle, { backgroundColor: colors.border }]}
              />
            </View>
          )}

          <View
            style={[
              styles.modalHeader,
              { paddingTop: topPadding + 12, borderBottomColor: colors.border },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setShowAdd(false);
                resetForm();
              }}
              style={styles.headerSide}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              New Account
            </Text>
            <View style={styles.headerSide} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Live preview */}
            <View
              style={[
                styles.previewCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.previewIcon,
                  {
                    backgroundColor: selectedColor + "1A",
                    borderColor: selectedColor + "3D",
                  },
                ]}
              >
                <AccountTypeIcon type={type} size={22} color={selectedColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.previewName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {name.trim() || "Account name"}
                </Text>
                <Text
                  style={[
                    styles.previewType,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {type}
                </Text>
              </View>
              <Text
                style={[styles.previewBalance, { color: colors.foreground }]}
              >
                {fmt(parseFloat(balance) || 0)}
              </Text>
            </View>

            <Text
              style={[styles.sectionLabel, { color: colors.mutedForeground }]}
            >
              ACCOUNT DETAILS
            </Text>
            <View
              style={[
                styles.inputGroup,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <TextInput
                style={[styles.groupedInput, { color: colors.foreground }]}
                placeholder="Account name"
                placeholderTextColor={colors.mutedForeground}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
              <View
                style={[
                  styles.inputDivider,
                  { backgroundColor: colors.border },
                ]}
              />
              <View style={styles.balanceInputRow}>
                <Text
                  style={[
                    styles.currencyPrefix,
                    { color: colors.mutedForeground },
                  ]}
                >
                  $
                </Text>
                <TextInput
                  style={[
                    styles.groupedInput,
                    styles.balanceInput,
                    { color: colors.foreground },
                  ]}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text
              style={[
                styles.sectionLabel,
                { color: colors.mutedForeground, marginTop: 24 },
              ]}
            >
              TYPE
            </Text>
            <View style={styles.typeGrid}>
              {ACCOUNT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeCard,
                    {
                      backgroundColor:
                        type === t ? colors.primary + "15" : colors.card,
                      borderColor: type === t ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setType(t);
                  }}
                >
                  <AccountTypeIcon
                    type={t}
                    size={19}
                    color={type === t ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.typeCardText,
                      {
                        color: type === t ? colors.primary : colors.foreground,
                      },
                    ]}
                  >
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={[
                styles.sectionLabel,
                { color: colors.mutedForeground, marginTop: 24 },
              ]}
            >
              COLOR
            </Text>
            <View style={styles.colorRow}>
              {ACCOUNT_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedColor(c);
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: c }]}>
                    {selectedColor === c && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                backgroundColor: colors.background,
                borderTopColor: colors.border,
                paddingBottom: bottomPadding + 12,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.createBtn,
                {
                  backgroundColor: name.trim() ? colors.primary : colors.border,
                  opacity: name.trim() ? 1 : 0.6,
                },
              ]}
              onPress={handleAdd}
              disabled={!name.trim()}
              activeOpacity={0.85}
            >
              <Text style={styles.createBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "600" },
  netWorthBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  netWorthLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  netWorthValue: { fontSize: 28, fontWeight: "700" },

  accountCard: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  accountTopRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountLeft: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  accNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  accName: { fontSize: 15, fontWeight: "600", flexShrink: 1 },
  primaryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  primaryBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  accType: { fontSize: 12, textTransform: "capitalize", marginTop: 2 },
  accBalance: { fontSize: 16, fontWeight: "700" },
  deleteBtn: { padding: 8, borderRadius: 10 },

  shareTrack: { height: 4, borderRadius: 2, marginTop: 12, overflow: "hidden" },
  shareFill: { height: 4, borderRadius: 2 },

  // Modal
  modalContainer: { flex: 1 },
  dragHandleWrap: { alignItems: "center", paddingTop: 8 },
  dragHandle: { width: 36, height: 4, borderRadius: 2 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerSide: { width: 60 },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  modalScroll: { padding: 20, paddingBottom: 12 },

  previewCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 28,
  },
  previewIcon: {
    width: 46,
    height: 4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  previewName: { fontSize: 15, fontWeight: "600" },
  previewType: { fontSize: 12, textTransform: "capitalize", marginTop: 2 },
  previewBalance: { fontSize: 16, fontWeight: "700" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 10,
  },

  inputGroup: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  groupedInput: { fontSize: 15, paddingHorizontal: 16, paddingVertical: 14 },
  inputDivider: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  balanceInputRow: { flexDirection: "row", alignItems: "center" },
  currencyPrefix: { fontSize: 15, fontWeight: "600", paddingLeft: 16 },
  balanceInput: { flex: 1, paddingLeft: 4 },

  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  typeCardText: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  createBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  createBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
