import {
  UserProfile,
  FinancialPreferences,
  Category,
  Transaction,
  Budget,
  Goal,
  Subscription,
  RecurringTransaction,
  AppNotification
} from '../types';
import { generateDefaultCategoriesForUser } from './defaultCategories';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

// Event PubSub for reactive real-time updates
type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

export function subscribeToDataChanges(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyDataChanged(): void {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error in data change listener', e);
    }
  });
}

// Storage Keys
const prefix = 'spendly_';
const keyFor = (entity: string, userId: string) => `${prefix}${userId}_${entity}`;

// Helpers for localStorage
function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key}`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing ${key}`, err);
  }
}

// ============================================================================
// PROFILES & PREFERENCES
// ============================================================================

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) {
        return {
          id: data.id,
          email: data.email,
          fullName: data.full_name,
          preferredCurrency: data.preferred_currency,
          countryRegion: data.country_region,
          monthlyIncome: Number(data.monthly_income || 0),
          monthlySpendingTarget: Number(data.monthly_spending_target || 0),
          avatarUrl: data.avatar_url,
          onboardingCompleted: data.onboarding_completed,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        };
      }
    } catch (e) {
      console.warn('Supabase fetch profile error, falling back to local', e);
    }
  }

  return getItem<UserProfile | null>(keyFor('profile', userId), null);
}

export async function saveProfile(profile: UserProfile): Promise<void> {
  setItem(keyFor('profile', profile.id), profile);

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('profiles').upsert({
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        preferred_currency: profile.preferredCurrency,
        country_region: profile.countryRegion,
        monthly_income: profile.monthlyIncome,
        monthly_spending_target: profile.monthlySpendingTarget,
        avatar_url: profile.avatarUrl,
        onboarding_completed: profile.onboardingCompleted,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase save profile failed', e);
    }
  }

  notifyDataChanged();
}

export async function getPreferences(userId: string): Promise<FinancialPreferences> {
  const defaultPrefs: FinancialPreferences = {
    userId,
    theme: 'system',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: 'en-US',
    notificationsEnabled: true,
    budgetAlerts: true,
    subscriptionAlerts: true,
    goalAlerts: true,
    weeklySummaryEmail: false
  };

  const stored = getItem<FinancialPreferences>(keyFor('preferences', userId), defaultPrefs);
  return stored;
}

export async function savePreferences(preferences: FinancialPreferences): Promise<void> {
  setItem(keyFor('preferences', preferences.userId), preferences);

  const supabase = getSupabaseClient();
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('financial_preferences').upsert({
        user_id: preferences.userId,
        theme: preferences.theme,
        date_format: preferences.dateFormat,
        number_format: preferences.numberFormat,
        notifications_enabled: preferences.notificationsEnabled,
        budget_alerts: preferences.budgetAlerts,
        subscription_alerts: preferences.subscriptionAlerts,
        goal_alerts: preferences.goalAlerts,
        weekly_summary_email: preferences.weeklySummaryEmail,
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Supabase save preferences failed', e);
    }
  }

  notifyDataChanged();
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(userId: string): Promise<Category[]> {
  const localCats = getItem<Category[]>(keyFor('categories', userId), []);
  return localCats;
}

export async function saveCategory(category: Category): Promise<Category> {
  const list = await getCategories(category.userId);
  const index = list.findIndex(c => c.id === category.id);
  if (index >= 0) {
    list[index] = category;
  } else {
    list.push(category);
  }
  setItem(keyFor('categories', category.userId), list);
  notifyDataChanged();
  return category;
}

export async function deleteCategory(userId: string, categoryId: string): Promise<void> {
  const list = await getCategories(userId);
  const updated = list.filter(c => c.id !== categoryId);
  setItem(keyFor('categories', userId), updated);
  notifyDataChanged();
}

export async function seedCategoriesIfEmpty(userId: string, selectedNames?: string[]): Promise<Category[]> {
  const existing = await getCategories(userId);
  if (existing.length === 0) {
    const defaults = generateDefaultCategoriesForUser(userId, selectedNames);
    setItem(keyFor('categories', userId), defaults);
    notifyDataChanged();
    return defaults;
  }
  return existing;
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function getTransactions(userId: string): Promise<Transaction[]> {
  const list = getItem<Transaction[]>(keyFor('transactions', userId), []);
  // Sort descending by date, then createdAt
  return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function addTransaction(transaction: Transaction): Promise<Transaction> {
  const list = await getTransactions(transaction.userId);
  list.unshift(transaction);
  setItem(keyFor('transactions', transaction.userId), list);
  notifyDataChanged();
  return transaction;
}

export async function updateTransaction(transaction: Transaction): Promise<Transaction> {
  const list = await getTransactions(transaction.userId);
  const index = list.findIndex(t => t.id === transaction.id);
  if (index >= 0) {
    list[index] = { ...transaction, updatedAt: new Date().toISOString() };
    setItem(keyFor('transactions', transaction.userId), list);
    notifyDataChanged();
  }
  return transaction;
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
  const list = await getTransactions(userId);
  const filtered = list.filter(t => t.id !== transactionId);
  setItem(keyFor('transactions', userId), filtered);
  notifyDataChanged();
}

export async function deleteAllTransactions(userId: string): Promise<void> {
  setItem(keyFor('transactions', userId), []);
  notifyDataChanged();
}

// ============================================================================
// BUDGETS
// ============================================================================

export async function getBudgets(userId: string, month?: number, year?: number): Promise<Budget[]> {
  const list = getItem<Budget[]>(keyFor('budgets', userId), []);
  if (month !== undefined && year !== undefined) {
    return list.filter(b => b.month === month && b.year === year);
  }
  return list;
}

export async function saveBudget(budget: Budget): Promise<Budget> {
  const list = getItem<Budget[]>(keyFor('budgets', budget.userId), []);
  const index = list.findIndex(b => b.id === budget.id);
  if (index >= 0) {
    list[index] = { ...budget, updatedAt: new Date().toISOString() };
  } else {
    list.push(budget);
  }
  setItem(keyFor('budgets', budget.userId), list);
  notifyDataChanged();
  return budget;
}

export async function deleteBudget(userId: string, budgetId: string): Promise<void> {
  const list = getItem<Budget[]>(keyFor('budgets', userId), []);
  const updated = list.filter(b => b.id !== budgetId);
  setItem(keyFor('budgets', userId), updated);
  notifyDataChanged();
}

// ============================================================================
// FINANCIAL GOALS
// ============================================================================

export async function getGoals(userId: string): Promise<Goal[]> {
  return getItem<Goal[]>(keyFor('goals', userId), []);
}

export async function saveGoal(goal: Goal): Promise<Goal> {
  const list = await getGoals(goal.userId);
  const index = list.findIndex(g => g.id === goal.id);
  if (index >= 0) {
    list[index] = { ...goal, updatedAt: new Date().toISOString() };
  } else {
    list.push(goal);
  }
  setItem(keyFor('goals', goal.userId), list);
  notifyDataChanged();
  return goal;
}

export async function deleteGoal(userId: string, goalId: string): Promise<void> {
  const list = await getGoals(userId);
  const updated = list.filter(g => g.id !== goalId);
  setItem(keyFor('goals', userId), updated);
  notifyDataChanged();
}

export async function contributeToGoal(
  userId: string,
  goalId: string,
  amount: number,
  currency: string
): Promise<Goal | null> {
  const goals = await getGoals(userId);
  const goal = goals.find(g => g.id === goalId);
  if (!goal) return null;

  goal.currentAmount = Number((goal.currentAmount + amount).toFixed(2));
  if (goal.currentAmount >= goal.targetAmount) {
    goal.isCompleted = true;
  }
  goal.updatedAt = new Date().toISOString();

  await saveGoal(goal);

  // Also add a corresponding savings/transfer transaction
  await addTransaction({
    id: `tx_goal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    amount,
    currency,
    convertedAmount: amount,
    exchangeRate: 1.0,
    type: 'transfer',
    categoryId: 'goal_contribution',
    merchant: `Savings Goal: ${goal.name}`,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    notes: `Contribution toward financial goal: ${goal.name}`,
    tags: ['Goal', 'Savings'],
    isRecurring: false,
    createdAt: new Date().toISOString()
  });

  return goal;
}

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export async function getSubscriptions(userId: string): Promise<Subscription[]> {
  return getItem<Subscription[]>(keyFor('subscriptions', userId), []);
}

export async function saveSubscription(subscription: Subscription): Promise<Subscription> {
  const list = await getSubscriptions(subscription.userId);
  const index = list.findIndex(s => s.id === subscription.id);
  if (index >= 0) {
    list[index] = { ...subscription, updatedAt: new Date().toISOString() };
  } else {
    list.push(subscription);
  }
  setItem(keyFor('subscriptions', subscription.userId), list);
  notifyDataChanged();
  return subscription;
}

export async function deleteSubscription(userId: string, subscriptionId: string): Promise<void> {
  const list = await getSubscriptions(userId);
  const updated = list.filter(s => s.id !== subscriptionId);
  setItem(keyFor('subscriptions', userId), updated);
  notifyDataChanged();
}

// ============================================================================
// RECURRING TRANSACTIONS
// ============================================================================

export async function getRecurringTransactions(userId: string): Promise<RecurringTransaction[]> {
  return getItem<RecurringTransaction[]>(keyFor('recurring', userId), []);
}

export async function saveRecurringTransaction(item: RecurringTransaction): Promise<RecurringTransaction> {
  const list = await getRecurringTransactions(item.userId);
  const index = list.findIndex(r => r.id === item.id);
  if (index >= 0) {
    list[index] = { ...item, updatedAt: new Date().toISOString() };
  } else {
    list.push(item);
  }
  setItem(keyFor('recurring', item.userId), list);
  notifyDataChanged();
  return item;
}

export async function deleteRecurringTransaction(userId: string, id: string): Promise<void> {
  const list = await getRecurringTransactions(userId);
  const updated = list.filter(r => r.id !== id);
  setItem(keyFor('recurring', userId), updated);
  notifyDataChanged();
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const list = getItem<AppNotification[]>(keyFor('notifications', userId), []);
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addNotification(notification: AppNotification): Promise<void> {
  const list = await getNotifications(notification.userId);
  list.unshift(notification);
  // Keep maximum 50 recent notifications
  if (list.length > 50) list.length = 50;
  setItem(keyFor('notifications', notification.userId), list);
  notifyDataChanged();
}

export async function markNotificationRead(userId: string, notificationId: string): Promise<void> {
  const list = await getNotifications(userId);
  const item = list.find(n => n.id === notificationId);
  if (item) {
    item.isRead = true;
    setItem(keyFor('notifications', userId), list);
    notifyDataChanged();
  }
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const list = await getNotifications(userId);
  list.forEach(n => { n.isRead = true; });
  setItem(keyFor('notifications', userId), list);
  notifyDataChanged();
}

export async function clearAllNotifications(userId: string): Promise<void> {
  setItem(keyFor('notifications', userId), []);
  notifyDataChanged();
}

// ============================================================================
// ACCOUNT DELETION
// ============================================================================

export async function deleteUserAccount(userId: string): Promise<void> {
  // Wipe all user data
  localStorage.removeItem(keyFor('profile', userId));
  localStorage.removeItem(keyFor('preferences', userId));
  localStorage.removeItem(keyFor('categories', userId));
  localStorage.removeItem(keyFor('transactions', userId));
  localStorage.removeItem(keyFor('budgets', userId));
  localStorage.removeItem(keyFor('goals', userId));
  localStorage.removeItem(keyFor('subscriptions', userId));
  localStorage.removeItem(keyFor('recurring', userId));
  localStorage.removeItem(keyFor('notifications', userId));

  // Remove from registered users list
  const users = getItem<any[]>('spendly_registered_users', []);
  const updated = users.filter(u => u.id !== userId);
  setItem('spendly_registered_users', updated);

  notifyDataChanged();
}
