import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const NOTIFICATION_PREF_KEY = 'wealthly_notifications_enabled';
const BILL_SCHEDULE_KEY = 'wealthly_bill_notification_ids';
const NOTIFICATION_LOG_KEY = 'wealthly_notification_log';
const CHANNEL_ID = 'wealthly-reminders';

type ReminderBill = {
  id: string;
  name: string;
  amount: number;
  is_paid: number;
  next_due: string;
};

type GoalProgress = {
  id: string;
  name: string;
  saved_amount: number;
  target_amount: number;
};

type NotificationContent = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
};

let configured = false;

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function notificationKey(parts: string[]) {
  return parts.join(':');
}

async function getStoredEnabled() {
  const raw = await AsyncStorage.getItem(NOTIFICATION_PREF_KEY);
  return raw !== 'false';
}

async function setStoredEnabled(enabled: boolean) {
  await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, enabled ? 'true' : 'false');
}

async function getSentLog() {
  try {
    return JSON.parse((await AsyncStorage.getItem(NOTIFICATION_LOG_KEY)) || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

async function markSent(key: string) {
  const log = await getSentLog();
  log[key] = Date.now();
  await AsyncStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(log));
}

async function hasSent(key: string) {
  const log = await getSentLog();
  return Boolean(log[key]);
}

async function clearLogPrefix(prefix: string) {
  const log = await getSentLog();
  let changed = false;
  Object.keys(log).forEach((key) => {
    if (key.startsWith(prefix)) {
      delete log[key];
      changed = true;
    }
  });
  if (changed) {
    await AsyncStorage.setItem(NOTIFICATION_LOG_KEY, JSON.stringify(log));
  }
}

async function ensureConfigured() {
  if (configured) return;
  configured = true;

  if (Platform.OS === 'web') return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Finance reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#0A0E1A',
  });
}

async function canNotify() {
  await ensureConfigured();
  if (Platform.OS === 'web') return false;

  const enabled = await getStoredEnabled();
  if (!enabled) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function initializeNotifications() {
  await ensureConfigured();
  if (Platform.OS === 'web') return false;

  const enabled = await getStoredEnabled();
  if (!enabled) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;

  const requested = await Notifications.requestPermissionsAsync();
  if (requested.status !== 'granted') {
    await setStoredEnabled(false);
    return false;
  }

  return true;
}

export async function areNotificationsEnabled() {
  return getStoredEnabled();
}

export async function setNotificationsEnabled(enabled: boolean) {
  await ensureConfigured();

  if (!enabled) {
    await setStoredEnabled(false);
    await cancelAllBillReminders();
    return false;
  }

  if (Platform.OS === 'web') {
    await setStoredEnabled(false);
    return false;
  }

  const current = await Notifications.getPermissionsAsync();
  let granted = current.status === 'granted';

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.status === 'granted';
  }

  if (!granted) {
    await setStoredEnabled(false);
    return false;
  }

  await setStoredEnabled(true);
  return true;
}

async function scheduleImmediate(content: NotificationContent) {
  if (!(await canNotify())) {
    if (Platform.OS === 'web') {
      Alert.alert(content.title, content.body);
    }
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: content.title,
      body: content.body,
      data: content.data,
      sound: true,
      channelId: CHANNEL_ID,
    },
    trigger: null,
  });

  return true;
}

async function scheduleOnce(key: string, content: NotificationContent) {
  if (await hasSent(key)) return false;
  const sent = await scheduleImmediate(content);
  if (sent) {
    await markSent(key);
  }
  return sent;
}

export async function notifyTransactionSaved(params: {
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description?: string | null;
  accountName?: string;
}) {
  const { type, amount, description, accountName } = params;
  const label =
    type === 'income' ? 'Income recorded' : type === 'transfer' ? 'Transfer saved' : 'Expense recorded';
  const detail = description?.trim() || accountName || 'Transaction';
  return scheduleImmediate({
    title: label,
    body: `${detail} for ${formatCurrency(amount)} was saved successfully.`,
  });
}

export async function sendTestNotification() {
  return scheduleImmediate({
    title: 'Wealthly notifications',
    body: 'Notifications are turned on and ready for bill reminders and goal updates.',
  });
}

export async function notifyBillAdded(bill: { name: string; amount: number; next_due: string }) {
  const due = new Date(`${bill.next_due}T09:00:00`);
  const now = new Date();
  const days = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const body =
    days <= 0
      ? `A reminder is ready for ${formatCurrency(bill.amount)}.`
      : `We’ll remind you again in ${days} day${days === 1 ? '' : 's'}.`;
  return scheduleImmediate({
    title: `Bill added: ${bill.name}`,
    body,
  });
}

export async function notifyBillToggled(name: string, isPaid: boolean) {
  return scheduleImmediate({
    title: isPaid ? 'Bill marked as paid' : 'Bill reopened',
    body: `${name} is now ${isPaid ? 'marked paid' : 'back on the due list'}.`,
  });
}

export async function notifyGoalCreated(name: string, targetAmount: number) {
  return scheduleImmediate({
    title: 'Goal created',
    body: `${name} is ready with a target of ${formatCurrency(targetAmount)}.`,
  });
}

export async function notifyGoalProgress(goal: GoalProgress, previousSaved: number) {
  const nextSaved = goal.saved_amount;
  const target = goal.target_amount;
  if (target <= 0 || nextSaved <= previousSaved) return false;

  const previousProgress = previousSaved / target;
  const nextProgress = nextSaved / target;
  const reached80 = previousProgress < 0.8 && nextProgress >= 0.8 && nextProgress < 1;
  const completed = previousProgress < 1 && nextProgress >= 1;

  if (completed) {
    return scheduleOnce(
      notificationKey(['goal', goal.id, 'complete']),
      {
        title: 'Goal reached',
        body: `${goal.name} hit ${formatCurrency(goal.target_amount)}.`,
      }
    );
  }

  if (reached80) {
    return scheduleOnce(
      notificationKey(['goal', goal.id, '80']),
      {
        title: 'Goal milestone',
        body: `${goal.name} is now ${(nextProgress * 100).toFixed(0)}% funded.`,
      }
    );
  }

  return false;
}

export async function syncBillReminders(bills: ReminderBill[]) {
  await ensureConfigured();
  if (Platform.OS === 'web') return;

  const enabled = await getStoredEnabled();
  if (!enabled) {
    await cancelAllBillReminders();
    return;
  }

  const stored = await AsyncStorage.getItem(BILL_SCHEDULE_KEY);
  const previousSchedules = stored ? (JSON.parse(stored) as Record<string, string>) : {};
  await Promise.all(
    Object.values(previousSchedules).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );

  const nextSchedules: Record<string, string> = {};
  const now = Date.now();

  for (const bill of bills) {
    if (bill.is_paid) continue;

    const dueDate = new Date(`${bill.next_due}T09:00:00`);
    if (Number.isNaN(dueDate.getTime())) continue;

    const dueTime = dueDate.getTime();
    const daysAway = Math.ceil((dueTime - now) / (1000 * 60 * 60 * 24));

    if (daysAway <= 0) {
      const dueKey = notificationKey(['bill', bill.id, bill.next_due, 'due']);
      await scheduleOnce(dueKey, {
        title: `Bill due now: ${bill.name}`,
        body: `${formatCurrency(bill.amount)} is due today. Open Wealthly to review it.`,
        data: { billId: bill.id, billDue: bill.next_due },
      });
      continue;
    }

    const scheduledId = await Notifications.scheduleNotificationAsync({
      content: {
        title:
          daysAway === 1
            ? `Bill due tomorrow: ${bill.name}`
            : `Bill due in ${daysAway} days: ${bill.name}`,
        body: `${formatCurrency(bill.amount)} is due on ${bill.next_due}.`,
        data: { billId: bill.id, billDue: bill.next_due },
        sound: true,
        channelId: CHANNEL_ID,
      },
      trigger: dueDate,
    });

    nextSchedules[bill.id] = scheduledId;
  }

  await AsyncStorage.setItem(BILL_SCHEDULE_KEY, JSON.stringify(nextSchedules));
}

export async function cancelAllBillReminders() {
  await ensureConfigured();
  if (Platform.OS === 'web') return;

  const stored = await AsyncStorage.getItem(BILL_SCHEDULE_KEY);
  const schedules = stored ? (JSON.parse(stored) as Record<string, string>) : {};
  await Promise.all(
    Object.values(schedules).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {}),
    ),
  );
  await AsyncStorage.removeItem(BILL_SCHEDULE_KEY);
  await clearLogPrefix('bill:');
}
