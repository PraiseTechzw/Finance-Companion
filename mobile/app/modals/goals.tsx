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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useColors } from "@/hooks/useColors";
import { useFinance } from "@/context/FinanceContext";
import { CircularProgress } from "@/components/CircularProgress";
import { EmptyState } from "@/components/EmptyState";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDeadline(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number | null {
  const target = new Date(dateStr + "T00:00:00");
  if (isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
}

const GOAL_COLORS = [
  "#10B981",
  "#6366F1",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#8B5CF6",
];

// A broader set of goal categories, all outline-style to match the rest of the app.
const GOAL_ICONS = [
  "airplane-outline", // travel
  "home-outline", // home / down payment
  "car-outline", // vehicle
  "school-outline", // education
  "heart-outline", // wedding / relationship
  "gift-outline", // gift
  "briefcase-outline", // business
  "laptop-outline", // tech / equipment
  "cash-outline", // general savings
  "wallet-outline", // emergency fund
  "shield-checkmark-outline", // safety net
  "medkit-outline", // health / medical
  "paw-outline", // pet
  "boat-outline", // boat
  "bicycle-outline", // bike
  "barbell-outline", // fitness
  "restaurant-outline", // dining
  "bag-handle-outline", // shopping
  "musical-notes-outline", // hobby / instrument
  "star-outline", // other / dream goal
  "trophy-outline", // achievement / award
  "game-controller-outline", // gaming
  "shirt-outline", // fashion / clothing
  "camera-outline", // photography
  "book-outline", // reading / literature
];

export default function GoalsModal() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { goals, addGoal, editGoal, deleteGoal } = useFinance();

  const [showAdd, setShowAdd] = useState(false);
  const [showContrib, setShowContrib] = useState<string | null>(null);
  const [contrib, setContrib] = useState("");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState(""); // stored as 'YYYY-MM-DD'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selColor, setSelColor] = useState(GOAL_COLORS[0]);
  const [selIcon, setSelIcon] = useState(GOAL_ICONS[0]);

  const topPadding = Platform.OS === "web" ? 67 : insets.top;
  const bottomPadding = Platform.OS === "web" ? 34 : insets.bottom;

  const resetForm = () => {
    setName("");
    setTarget("");
    setDeadline("");
    setSelColor(GOAL_COLORS[0]);
    setSelIcon(GOAL_ICONS[0]);
  };

  const handleAdd = () => {
    if (!name.trim() || !target) {
      Alert.alert("Required", "Name and target amount are required");
      return;
    }
    addGoal({
      name: name.trim(),
      target_amount: parseFloat(target),
      saved_amount: 0,
      color: selColor,
      icon: selIcon,
      deadline: deadline || null,
      notes: null,
    });
    setShowAdd(false);
    resetForm();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleContrib = (goalId: string) => {
    const amount = parseFloat(contrib);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid", "Enter a valid amount");
      return;
    }
    const goal = goals.find((g) => g.id === goalId);
    if (goal) editGoal(goalId, { saved_amount: goal.saved_amount + amount });
    setShowContrib(null);
    setContrib("");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Goal", "Delete this savings goal?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteGoal(id) },
    ]);
  };

  const onDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (event.type === "dismissed") return;
    if (selected) {
      const iso = selected.toISOString().split("T")[0];
      setDeadline(iso);
    }
  };

  const activeGoal = goals.find((g) => g.id === showContrib) || null;
  const contribAmount = parseFloat(contrib) || 0;
  const previewProgress =
    activeGoal && activeGoal.target_amount > 0
      ? Math.min(
          (activeGoal.saved_amount + contribAmount) / activeGoal.target_amount,
          1,
        )
      : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPadding + 12, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.headerIconBtn, { backgroundColor: colors.card }]}
        >
          <Ionicons name="close" size={20} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Savings Goals
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAdd(true);
          }}
          style={[
            styles.headerIconBtn,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: bottomPadding + 20,
        }}
      >
        {goals.length === 0 ? (
          <EmptyState
            icon="flag-outline"
            title="No savings goals"
            subtitle="Set a goal and start saving toward it"
          />
        ) : (
          goals.map((goal) => {
            const progress =
              goal.target_amount > 0
                ? goal.saved_amount / goal.target_amount
                : 0;
            const isComplete = progress >= 1;
            const days = goal.deadline ? daysUntil(goal.deadline) : null;
            const overdue = days !== null && days < 0 && !isComplete;
            return (
              <View
                key={goal.id}
                style={[
                  styles.goalCard,
                  {
                    backgroundColor: colors.card,
                    shadowColor: Platform.OS === "ios" ? "#000" : undefined,
                  },
                ]}
              >
                {isComplete && (
                  <View
                    style={[
                      styles.completeBanner,
                      { backgroundColor: colors.income + "22" },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={colors.income}
                    />
                    <Text
                      style={[styles.completeTxt, { color: colors.income }]}
                    >
                      Goal Reached!
                    </Text>
                  </View>
                )}
                <View style={styles.goalTop}>
                  <CircularProgress
                    progress={progress}
                    size={72}
                    strokeWidth={7}
                    color={goal.color}
                    label={`${Math.round(progress * 100)}%`}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.goalName, { color: colors.foreground }]}
                    >
                      {goal.name}
                    </Text>
                    <Text style={[styles.goalSaved, { color: goal.color }]}>
                      {fmt(goal.saved_amount)}
                    </Text>
                    <Text
                      style={[
                        styles.goalTarget,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      of {fmt(goal.target_amount)}
                    </Text>
                    {goal.deadline && days !== null && (
                      <View style={styles.deadlineRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={11}
                          color={
                            overdue
                              ? colors.destructive
                              : colors.mutedForeground
                          }
                        />
                        <Text
                          style={[
                            styles.goalDeadline,
                            {
                              color: overdue
                                ? colors.destructive
                                : colors.mutedForeground,
                            },
                          ]}
                        >
                          {overdue
                            ? `Overdue · ${formatDeadline(goal.deadline)}`
                            : days === 0
                              ? "Due today"
                              : days === 1
                                ? "Due tomorrow"
                                : `${formatDeadline(goal.deadline)} · ${days}d left`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.goalActions}>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      {
                        backgroundColor: goal.color + "22",
                        borderColor: goal.color + "44",
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowContrib(goal.id);
                      setContrib("");
                    }}
                  >
                    <Ionicons name="add" size={16} color={goal.color} />
                    <Text style={[styles.addBtnText, { color: goal.color }]}>
                      Add funds
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(goal.id)}
                    style={[
                      styles.delBtn,
                      { backgroundColor: colors.destructive + "14" },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.destructive}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Add Goal Modal */}
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
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              New Goal
            </Text>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!name.trim() || !target}
            >
              <Text
                style={{
                  color:
                    !name.trim() || !target
                      ? colors.mutedForeground
                      : colors.primary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={{ padding: 20, gap: 14 }}
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="Goal name"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: colors.border,
                  color: colors.foreground,
                  backgroundColor: colors.card,
                },
              ]}
              placeholder="Target amount ($)"
              placeholderTextColor={colors.mutedForeground}
              value={target}
              onChangeText={setTarget}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              Deadline (optional)
            </Text>
            {Platform.OS === "web" ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    color: colors.foreground,
                    backgroundColor: colors.card,
                  },
                ]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.mutedForeground}
                value={deadline}
                onChangeText={setDeadline}
              />
            ) : (
              <>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.dateButtonText,
                      {
                        color: deadline
                          ? colors.foreground
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    {deadline ? formatDeadline(deadline) : "Set a deadline"}
                  </Text>
                  {!!deadline && (
                    <TouchableOpacity
                      onPress={() => setDeadline("")}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {showDatePicker && (
                  <View
                    style={[
                      styles.datePickerWrap,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {Platform.OS === "ios" && (
                      <View style={styles.datePickerHeader}>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(false)}
                        >
                          <Text
                            style={{
                              color: colors.primary,
                              fontWeight: "600",
                              fontSize: 15,
                            }}
                          >
                            Done
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <DateTimePicker
                      value={
                        deadline ? new Date(deadline + "T00:00:00") : new Date()
                      }
                      mode="date"
                      minimumDate={new Date()}
                      display={Platform.OS === "ios" ? "inline" : "default"}
                      onChange={onDateChange}
                    />
                  </View>
                )}
              </>
            )}

            <Text
              style={[
                styles.label,
                { color: colors.mutedForeground, marginTop: 6 },
              ]}
            >
              Color
            </Text>
            <View style={styles.colorRow}>
              {GOAL_COLORS.map((c) => (
                <TouchableOpacity key={c} onPress={() => setSelColor(c)}>
                  <View style={[styles.colorDot, { backgroundColor: c }]}>
                    {selColor === c && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text
              style={[
                styles.label,
                { color: colors.mutedForeground, marginTop: 6 },
              ]}
            >
              Icon
            </Text>
            <View style={styles.iconRow}>
              {GOAL_ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic}
                  style={[
                    styles.iconBtn,
                    {
                      backgroundColor:
                        selIcon === ic ? selColor + "22" : colors.card,
                      borderColor: selIcon === ic ? selColor : colors.border,
                    },
                  ]}
                  onPress={() => setSelIcon(ic)}
                >
                  <Ionicons
                    name={ic as any}
                    size={20}
                    color={selIcon === ic ? selColor : colors.mutedForeground}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        visible={!!showContrib}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowContrib(null)}
      >
        <View
          style={[styles.contribModal, { backgroundColor: colors.background }]}
        >
          <Text style={[styles.contribTitle, { color: colors.foreground }]}>
            Add Funds
          </Text>
          {activeGoal && (
            <Text
              style={[
                styles.contribSubtitle,
                { color: colors.mutedForeground },
              ]}
            >
              to {activeGoal.name}
            </Text>
          )}
          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.foreground,
                backgroundColor: colors.card,
              },
            ]}
            placeholder="Amount ($)"
            placeholderTextColor={colors.mutedForeground}
            value={contrib}
            onChangeText={setContrib}
            keyboardType="decimal-pad"
            autoFocus
          />
          {activeGoal && contribAmount > 0 && (
            <Text
              style={[styles.contribPreview, { color: colors.mutedForeground }]}
            >
              New total: {fmt(activeGoal.saved_amount + contribAmount)} (
              {Math.round(previewProgress * 100)}%)
            </Text>
          )}
          <View style={styles.contribBtns}>
            <TouchableOpacity
              style={[styles.contribCancel, { borderColor: colors.border }]}
              onPress={() => setShowContrib(null)}
            >
              <Text style={{ color: colors.mutedForeground, fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.contribSave, { backgroundColor: colors.primary }]}
              onPress={() => showContrib && handleContrib(showContrib)}
            >
              <Text
                style={{
                  color: colors.primaryForeground,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Add
              </Text>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "700" },

  goalCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  completeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  completeTxt: { fontSize: 12, fontWeight: "600" },
  goalTop: { flexDirection: "row", gap: 16, marginBottom: 12 },
  goalName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  goalSaved: { fontSize: 22, fontWeight: "700" },
  goalTarget: { fontSize: 12, marginTop: 2 },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  goalDeadline: { fontSize: 11 },
  goalActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
  },
  addBtnText: { fontSize: 13, fontWeight: "600" },
  delBtn: { padding: 8, borderRadius: 10 },

  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: "600" },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.4 },

  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  dateButtonText: { flex: 1, fontSize: 15 },
  datePickerWrap: { borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  datePickerHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },

  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  contribModal: { flex: 1, padding: 24, paddingTop: 40, gap: 16 },
  contribTitle: { fontSize: 22, fontWeight: "700" },
  contribSubtitle: { fontSize: 13, marginTop: -12 },
  contribPreview: { fontSize: 13, marginTop: -8 },
  contribBtns: { flexDirection: "row", gap: 12, marginTop: 8 },
  contribCancel: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
  contribSave: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 14,
  },
});
