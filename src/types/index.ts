// ==============================================================================
// SPENDLY — DATA MODELS AND TYPE DEFINITIONS
// ==============================================================================

export type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'AUD' | 'CAD' | 'CHF' | 'CNY' | 'SGD'
  | 'AED' | 'SAR' | 'NZD' | 'HKD' | 'SEK' | 'KRW' | 'BRL' | 'MXN' | 'ZAR' | 'THB'
  | 'MYR' | 'IDR' | 'TRY' | 'PLN' | 'DKK' | 'NOK' | 'ILS' | 'PHP' | 'CZK' | 'HUF'
  | string;

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  flag: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  preferredCurrency: string;
  countryRegion?: string;
  monthlyIncome?: number;
  monthlySpendingTarget?: number;
  avatarUrl?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type ThemePreference = 'light' | 'dark' | 'system';

export interface FinancialPreferences {
  userId: string;
  theme: ThemePreference;
  dateFormat: string; // 'YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'
  numberFormat: string; // 'en-US', 'en-IN', 'de-DE'
  notificationsEnabled: boolean;
  budgetAlerts: boolean;
  subscriptionAlerts: boolean;
  goalAlerts: boolean;
  weeklySummaryEmail: boolean;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  parentId?: string | null;
  monthlyBudget?: number | null;
  isEssential: boolean; // For "Where did my money go?" breakdown
  isDefault?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  convertedAmount: number; // Converted to user's preferred currency at transaction time
  exchangeRate: number; // Snapshot of exchange rate at transaction creation
  type: TransactionType;
  categoryId: string;
  subcategory?: string;
  merchant?: string;
  date: string; // ISO format 'YYYY-MM-DD'
  paymentMethod: string;
  notes?: string;
  tags: string[];
  isRecurring: boolean;
  recurringTransactionId?: string;
  receiptUrl?: string;
  receiptName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string; // Can be a specific category ID or 'all' for total spending target
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  month: number; // 1 - 12
  year: number; // e.g. 2026
  alertThreshold: number; // e.g. 80 (%)
  createdAt: string;
  updatedAt?: string;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string; // 'YYYY-MM-DD'
  category: string;
  description?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type BillingCycle = 'monthly' | 'yearly' | 'weekly' | 'quarterly';

export interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: BillingCycle;
  nextBillingDate: string; // 'YYYY-MM-DD'
  categoryId?: string;
  status: 'active' | 'paused' | 'cancelled';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RecurringTransaction {
  id: string;
  userId: string;
  description: string;
  amount: number;
  currency: string;
  type: 'expense' | 'income' | 'transfer';
  categoryId?: string;
  frequency: RecurrenceFrequency;
  startDate: string; // 'YYYY-MM-DD'
  endDate?: string;
  nextDueDate: string; // 'YYYY-MM-DD'
  lastGeneratedDate?: string;
  paymentMethod: string;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'budget_warning' | 'budget_exceeded' | 'subscription_renewal' | 'recurring_created' | 'goal_milestone' | 'spending_insight';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface FinancialHealthScoreResult {
  isEligible: boolean;
  ineligibleReason?: string;
  overallScore: number; // 0 - 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  breakdown: {
    spendingControl: number; // 0-100
    savingsRate: number; // 0-100
    budgetAdherence: number; // 0-100
    recurringBurden: number; // 0-100
    goalProgress: number; // 0-100
    incomeStability: number; // 0-100
  };
  keyInsights: string[];
  recommendations: string[];
}

export interface MoneyFlowBreakdown {
  totalIncome: number;
  essentialExpenses: number;
  lifestyleExpenses: number;
  subscriptions: number;
  savings: number;
  goalsAllocated: number;
  remainingCashflow: number;
  currency: string;
}

export interface SpendingPattern {
  id: string;
  title: string;
  description: string;
  significance: 'positive' | 'warning' | 'neutral';
  metric?: string;
}
