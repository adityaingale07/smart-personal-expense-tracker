import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Transaction,
  Category,
  Budget,
  Goal,
  Subscription,
  RecurringTransaction,
  AppNotification,
  FinancialHealthScoreResult,
  MoneyFlowBreakdown,
  SpendingPattern
} from '../types';
import { useAuth } from './AuthContext';
import {
  getTransactions,
  getCategories,
  getBudgets,
  getGoals,
  getSubscriptions,
  getRecurringTransactions,
  getNotifications,
  addTransaction as dbAddTx,
  updateTransaction as dbUpdateTx,
  deleteTransaction as dbDeleteTx,
  deleteAllTransactions as dbDeleteAllTx,
  saveCategory as dbSaveCat,
  deleteCategory as dbDeleteCat,
  saveBudget as dbSaveBudget,
  deleteBudget as dbDeleteBudget,
  saveGoal as dbSaveGoal,
  deleteGoal as dbDeleteGoal,
  contributeToGoal as dbContributeGoal,
  saveSubscription as dbSaveSub,
  deleteSubscription as dbDeleteSub,
  saveRecurringTransaction as dbSaveRec,
  deleteRecurringTransaction as dbDeleteRec,
  markNotificationRead as dbMarkNotifRead,
  markAllNotificationsRead as dbMarkAllNotifRead,
  clearAllNotifications as dbClearNotifs,
  subscribeToDataChanges
} from '../services/db';
import {
  fetchLiveExchangeRates,
  convertCurrency,
  ExchangeRatesData,
} from '../services/currency';
import { processDueRecurringTransactions } from '../services/recurringEngine';
import { generateSmartInsights, syncBudgetNotifications, SmartInsight } from '../services/insightsEngine';
import { calculateFinancialHealthScore } from '../services/healthScore';
import { calculateMoneyFlow } from '../services/moneyFlow';
import { detectSpendingPatterns } from '../services/spendingPatterns';

interface FinanceContextType {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  subscriptions: Subscription[];
  recurringTransactions: RecurringTransaction[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  exchangeRates: ExchangeRatesData | null;
  displayCurrency: string;
  setDisplayCurrency: (currency: string) => void;
  isLoading: boolean;

  // Real data calculations
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  monthlySpending: number;
  monthlyBudgetRemaining: number;
  healthScore: FinancialHealthScoreResult;
  moneyFlow: MoneyFlowBreakdown;
  spendingPatterns: SpendingPattern[];
  smartInsights: SmartInsight[];

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'convertedAmount' | 'exchangeRate'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (tx: Transaction) => Promise<Transaction>;
  deleteAllTransactions: () => Promise<void>;

  addCategory: (cat: Omit<Category, 'id' | 'userId' | 'createdAt'>) => Promise<Category>;
  updateCategory: (cat: Category) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  saveBudget: (b: Omit<Budget, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;

  saveGoal: (g: Omit<Goal, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (goalId: string, amount: number) => Promise<void>;

  saveSubscription: (s: Omit<Subscription, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Promise<Subscription>;
  deleteSubscription: (id: string) => Promise<void>;

  saveRecurring: (r: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'> & { id?: string }) => Promise<RecurringTransaction>;
  deleteRecurring: (id: string) => Promise<void>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRatesData | null>(null);
  const [displayCurrency, setDisplayCurrencyState] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync display currency with user preference
  useEffect(() => {
    if (user?.preferredCurrency) {
      setDisplayCurrencyState(user.preferredCurrency);
    }
  }, [user?.preferredCurrency]);

  const setDisplayCurrency = (curr: string) => {
    setDisplayCurrencyState(curr);
  };

  // Fetch exchange rates on start
  useEffect(() => {
    fetchLiveExchangeRates().then(rates => {
      setExchangeRates(rates);
    });
  }, []);

  // Load user data
  const loadData = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setCategories([]);
      setBudgets([]);
      setGoals([]);
      setSubscriptions([]);
      setRecurringTransactions([]);
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const [txs, cats, bdgs, gls, subs, recs, notifs] = await Promise.all([
        getTransactions(user.id),
        getCategories(user.id),
        getBudgets(user.id),
        getGoals(user.id),
        getSubscriptions(user.id),
        getRecurringTransactions(user.id),
        getNotifications(user.id)
      ]);

      setTransactions(txs);
      setCategories(cats);
      setBudgets(bdgs);
      setGoals(gls);
      setSubscriptions(subs);
      setRecurringTransactions(recs);
      setNotifications(notifs);

      // Check recurring engine & budget alerts in background
      processDueRecurringTransactions(user.id, user.preferredCurrency).then(count => {
        if (count > 0) {
          getTransactions(user.id).then(setTransactions);
          getNotifications(user.id).then(setNotifications);
        }
      });

      syncBudgetNotifications(user.id, txs, bdgs, cats, user.preferredCurrency).then(() => {
        getNotifications(user.id).then(setNotifications);
      });

    } catch (e) {
      console.error('Failed to load user financial data', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDataChanges(() => {
      loadData();
    });
    return unsubscribe;
  }, [loadData]);

  // Derived financial metrics based on display currency
  const convertedTransactions = useMemo(() => {
    return transactions.map(t => {
      // If display currency is same as transaction currency, use transaction amount
      // If transaction already has stored exchange rate to preferred currency, and displayCurrency is preferred, use that!
      const converted = convertCurrency(t.amount, t.currency, displayCurrency);
      return {
        ...t,
        displayAmount: converted
      };
    });
  }, [transactions, displayCurrency]);

  const totalIncome = useMemo(() => {
    return convertedTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.displayAmount, 0);
  }, [convertedTransactions]);

  const totalExpenses = useMemo(() => {
    return convertedTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.displayAmount, 0);
  }, [convertedTransactions]);

  const totalBalance = useMemo(() => {
    return totalIncome - totalExpenses;
  }, [totalIncome, totalExpenses]);

  const netSavings = useMemo(() => {
    return Math.max(0, totalBalance);
  }, [totalBalance]);

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const rate = ((totalIncome - totalExpenses) / totalIncome) * 100;
    return Number(Math.max(0, rate).toFixed(1));
  }, [totalIncome, totalExpenses]);

  // Current month spending
  const monthlySpending = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    return convertedTransactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() + 1 === curMonth && d.getFullYear() === curYear;
      })
      .reduce((sum, t) => sum + t.displayAmount, 0);
  }, [convertedTransactions]);

  // Monthly budget remaining
  const monthlyBudgetRemaining = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const overallBudget = budgets.find(b => b.categoryId === 'all' && b.month === curMonth && b.year === curYear);
    const target = overallBudget?.amount || user?.monthlySpendingTarget || 0;
    if (target <= 0) return 0;

    return Math.max(0, target - monthlySpending);
  }, [budgets, user?.monthlySpendingTarget, monthlySpending]);

  // Financial Health Score
  const healthScore = useMemo(() => {
    return calculateFinancialHealthScore(
      user,
      transactions,
      budgets,
      goals,
      subscriptions,
      recurringTransactions
    );
  }, [user, transactions, budgets, goals, subscriptions, recurringTransactions]);

  // Money Flow Breakdown
  const moneyFlow = useMemo(() => {
    return calculateMoneyFlow(
      user,
      transactions,
      categories,
      subscriptions,
      goals,
      displayCurrency
    );
  }, [user, transactions, categories, subscriptions, goals, displayCurrency]);

  // Spending Patterns
  const spendingPatterns = useMemo(() => {
    return detectSpendingPatterns(transactions, categories, subscriptions);
  }, [transactions, categories, subscriptions]);

  // Smart Insights
  const smartInsights = useMemo(() => {
    return generateSmartInsights(transactions, budgets, categories, displayCurrency);
  }, [transactions, budgets, categories, displayCurrency]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // Actions
  const handleAddTransaction = async (
    txData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'convertedAmount' | 'exchangeRate'>
  ): Promise<Transaction> => {
    if (!user) throw new Error('User not authenticated');

    const preferredCurr = user.preferredCurrency || 'USD';
    const converted = convertCurrency(txData.amount, txData.currency, preferredCurr);
    const rate = txData.amount > 0 ? Number((converted / txData.amount).toFixed(6)) : 1.0;

    const newTx: Transaction = {
      ...txData,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      convertedAmount: converted,
      exchangeRate: rate,
      createdAt: new Date().toISOString(),
    };

    const saved = await dbAddTx(newTx);
    return saved;
  };

  const handleUpdateTransaction = async (tx: Transaction): Promise<Transaction> => {
    if (!user) throw new Error('User not authenticated');
    const preferredCurr = user.preferredCurrency || 'USD';
    const converted = convertCurrency(tx.amount, tx.currency, preferredCurr);
    const rate = tx.amount > 0 ? Number((converted / tx.amount).toFixed(6)) : 1.0;

    const updated = await dbUpdateTx({
      ...tx,
      convertedAmount: converted,
      exchangeRate: rate
    });
    return updated;
  };

  const handleDeleteTransaction = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbDeleteTx(user.id, id);
  };

  const handleDuplicateTransaction = async (tx: Transaction): Promise<Transaction> => {
    if (!user) throw new Error('User not authenticated');
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };
    return await dbAddTx(newTx);
  };

  const handleDeleteAllTransactions = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbDeleteAllTx(user.id);
  };

  const handleAddCategory = async (catData: Omit<Category, 'id' | 'userId' | 'createdAt'>): Promise<Category> => {
    if (!user) throw new Error('User not authenticated');
    const newCat: Category = {
      ...catData,
      id: `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    return await dbSaveCat(newCat);
  };

  const handleUpdateCategory = async (cat: Category): Promise<Category> => {
    return await dbSaveCat(cat);
  };

  const handleDeleteCategory = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbDeleteCat(user.id, id);
  };

  const handleSaveBudget = async (bData: Omit<Budget, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Budget> => {
    if (!user) throw new Error('User not authenticated');
    const budget: Budget = {
      ...bData,
      id: bData.id || `bdg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    return await dbSaveBudget(budget);
  };

  const handleDeleteBudget = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbDeleteBudget(user.id, id);
  };

  const handleSaveGoal = async (gData: Omit<Goal, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Goal> => {
    if (!user) throw new Error('User not authenticated');
    const goal: Goal = {
      ...gData,
      id: gData.id || `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    return await dbSaveGoal(goal);
  };

  const handleDeleteGoal = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbDeleteGoal(user.id, id);
  };

  const handleContributeGoal = async (goalId: string, amount: number): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbContributeGoal(user.id, goalId, amount, user.preferredCurrency);
  };

  const handleSaveSubscription = async (sData: Omit<Subscription, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<Subscription> => {
    if (!user) throw new Error('User not authenticated');
    const sub: Subscription = {
      ...sData,
      id: sData.id || `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    return await dbSaveSub(sub);
  };

  const handleDeleteSubscription = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbDeleteSub(user.id, id);
  };

  const handleSaveRecurring = async (rData: Omit<RecurringTransaction, 'id' | 'userId' | 'createdAt'> & { id?: string }): Promise<RecurringTransaction> => {
    if (!user) throw new Error('User not authenticated');
    const rec: RecurringTransaction = {
      ...rData,
      id: rData.id || `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    return await dbSaveRec(rec);
  };

  const handleDeleteRecurring = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    await dbDeleteRec(user.id, id);
  };

  const handleMarkNotifRead = async (id: string): Promise<void> => {
    if (!user) return;
    await dbMarkNotifRead(user.id, id);
  };

  const handleMarkAllNotifRead = async (): Promise<void> => {
    if (!user) return;
    await dbMarkAllNotifRead(user.id);
  };

  const handleClearNotifs = async (): Promise<void> => {
    if (!user) return;
    await dbClearNotifs(user.id);
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        categories,
        budgets,
        goals,
        subscriptions,
        recurringTransactions,
        notifications,
        unreadNotificationCount,
        exchangeRates,
        displayCurrency,
        setDisplayCurrency,
        isLoading,

        totalBalance,
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        monthlySpending,
        monthlyBudgetRemaining,
        healthScore,
        moneyFlow,
        spendingPatterns,
        smartInsights,

        addTransaction: handleAddTransaction,
        updateTransaction: handleUpdateTransaction,
        deleteTransaction: handleDeleteTransaction,
        duplicateTransaction: handleDuplicateTransaction,
        deleteAllTransactions: handleDeleteAllTransactions,

        addCategory: handleAddCategory,
        updateCategory: handleUpdateCategory,
        deleteCategory: handleDeleteCategory,

        saveBudget: handleSaveBudget,
        deleteBudget: handleDeleteBudget,

        saveGoal: handleSaveGoal,
        deleteGoal: handleDeleteGoal,
        contributeToGoal: handleContributeGoal,

        saveSubscription: handleSaveSubscription,
        deleteSubscription: handleDeleteSubscription,

        saveRecurring: handleSaveRecurring,
        deleteRecurring: handleDeleteRecurring,

        markNotificationRead: handleMarkNotifRead,
        markAllNotificationsRead: handleMarkAllNotifRead,
        clearAllNotifications: handleClearNotifs,
        refreshData: loadData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within a FinanceProvider');
  return ctx;
};
