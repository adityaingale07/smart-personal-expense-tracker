import { Transaction, Budget, Category, AppNotification } from '../types';
import { formatCurrency } from './currency';
import { addNotification } from './db';

export interface SmartInsight {
  id: string;
  type: 'positive' | 'warning' | 'alert' | 'info';
  title: string;
  message: string;
  category?: string;
  actionText?: string;
}

export function generateSmartInsights(
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  preferredCurrency: string
): SmartInsight[] {
  // Never display an insight based on nonexistent data!
  if (transactions.length === 0) {
    return [];
  }

  const insights: SmartInsight[] = [];
  const catMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Current month expense sum
  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  const currentExpense = currentMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

  const currentIncome = currentMonthTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

  // 1. Check Budgets
  budgets.forEach(b => {
    // Only evaluate current month budgets or yearly/all
    if (b.month === currentMonth && b.year === currentYear) {
      const cat = catMap.get(b.categoryId);
      const catName = b.categoryId === 'all' ? 'Overall Monthly Spending' : (cat?.name || 'Category');

      const catSpent = currentMonthTx
        .filter(t => t.type === 'expense' && (b.categoryId === 'all' || t.categoryId === b.categoryId))
        .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

      const pct = (catSpent / b.amount) * 100;

      if (pct > 100) {
        insights.push({
          id: `budget_over_${b.id}`,
          type: 'alert',
          title: `Budget Exceeded: ${catName}`,
          message: `You have spent ${formatCurrency(catSpent, preferredCurrency)} (${Math.round(pct)}%) of your ${formatCurrency(b.amount, preferredCurrency)} budget limit.`,
          category: catName,
        });
      } else if (pct >= (b.alertThreshold || 80)) {
        insights.push({
          id: `budget_warn_${b.id}`,
          type: 'warning',
          title: `Approaching Budget Limit: ${catName}`,
          message: `You've utilized ${Math.round(pct)}% of your ${formatCurrency(b.amount, preferredCurrency)} limit for this month. Remaining: ${formatCurrency(b.amount - catSpent, preferredCurrency)}.`,
          category: catName,
        });
      }
    }
  });

  // 2. Savings Rate insight
  if (currentIncome > 0 && currentExpense > 0) {
    const savings = currentIncome - currentExpense;
    const rate = Math.round((savings / currentIncome) * 100);

    if (rate >= 25) {
      insights.push({
        id: 'savings_rate_healthy',
        type: 'positive',
        title: 'Strong Monthly Savings Rate',
        message: `You are saving ${rate}% of your income this month (${formatCurrency(savings, preferredCurrency)} net surplus).`,
      });
    } else if (rate < 0) {
      insights.push({
        id: 'savings_deficit',
        type: 'alert',
        title: 'Monthly Cash Deficit',
        message: `Expenses currently exceed logged income by ${formatCurrency(Math.abs(savings), preferredCurrency)}.`,
      });
    }
  }

  // 3. Previous month comparison (if past month data exists)
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const prevMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === prevMonth && d.getFullYear() === prevYear;
  });

  const prevExpense = prevMonthTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

  if (prevExpense > 0 && currentExpense > 0) {
    const diff = currentExpense - prevExpense;
    const pctDiff = Math.round((Math.abs(diff) / prevExpense) * 100);

    if (diff > 0 && pctDiff >= 15) {
      insights.push({
        id: 'expense_surge_prev_month',
        type: 'warning',
        title: 'Spending Increased vs Last Month',
        message: `Your total spending is ${pctDiff}% higher compared with the same period last month (${formatCurrency(diff, preferredCurrency)} increase).`,
      });
    } else if (diff < 0 && pctDiff >= 10) {
      insights.push({
        id: 'expense_drop_prev_month',
        type: 'positive',
        title: 'Reduced Spending vs Last Month',
        message: `You have spent ${pctDiff}% less compared to last month. Great job holding down expenses!`,
      });
    }
  }

  return insights;
}

/**
 * Checks budgets and creates notifications if thresholds are reached
 */
export async function syncBudgetNotifications(
  userId: string,
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[],
  preferredCurrency: string
): Promise<void> {
  const catMap = new Map<string, Category>(categories.map(c => [c.id, c]));
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const currentMonthTx = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear;
  });

  for (const b of budgets) {
    if (b.month === currentMonth && b.year === currentYear) {
      const cat = catMap.get(b.categoryId);
      const catName = b.categoryId === 'all' ? 'Total Monthly Budget' : (cat?.name || 'Category');

      const spent = currentMonthTx
        .filter(t => t.type === 'expense' && (b.categoryId === 'all' || t.categoryId === b.categoryId))
        .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

      const pct = (spent / b.amount) * 100;

      if (pct >= 100) {
        // Notification for exceeded
        const notifId = `notif_exceeded_${b.id}_${currentMonth}_${currentYear}`;
        const existingKey = `spendly_notif_sent_${notifId}`;
        if (!sessionStorage.getItem(existingKey)) {
          await addNotification({
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId,
            title: `Budget Limit Reached: ${catName}`,
            message: `You've reached 100% of your ${formatCurrency(b.amount, preferredCurrency)} budget for ${catName}. Current spent: ${formatCurrency(spent, preferredCurrency)}.`,
            type: 'budget_exceeded',
            isRead: false,
            link: '/budgets',
            createdAt: new Date().toISOString()
          });
          sessionStorage.setItem(existingKey, 'true');
        }
      } else if (pct >= (b.alertThreshold || 80)) {
        const notifId = `notif_approaching_${b.id}_${currentMonth}_${currentYear}`;
        const existingKey = `spendly_notif_sent_${notifId}`;
        if (!sessionStorage.getItem(existingKey)) {
          await addNotification({
            id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            userId,
            title: `Approaching Budget Limit: ${catName}`,
            message: `You've utilized ${Math.round(pct)}% of your ${formatCurrency(b.amount, preferredCurrency)} budget limit for ${catName}.`,
            type: 'budget_warning',
            isRead: false,
            link: '/budgets',
            createdAt: new Date().toISOString()
          });
          sessionStorage.setItem(existingKey, 'true');
        }
      }
    }
  }
}
