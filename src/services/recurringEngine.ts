import { RecurringTransaction, Transaction } from '../types';
import {
  getRecurringTransactions,
  saveRecurringTransaction,
  addTransaction,
  addNotification
} from './db';
import { convertCurrency, formatCurrency } from './currency';

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function addYears(dateStr: string, years: number): string {
  const d = new Date(dateStr);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().split('T')[0];
}

export function calculateNextDueDate(currentDue: string, frequency: RecurringTransaction['frequency']): string {
  switch (frequency) {
    case 'daily':
      return addDays(currentDue, 1);
    case 'weekly':
      return addDays(currentDue, 7);
    case 'monthly':
      return addMonths(currentDue, 1);
    case 'yearly':
      return addYears(currentDue, 1);
    default:
      return addMonths(currentDue, 1);
  }
}

export async function processDueRecurringTransactions(
  userId: string,
  preferredCurrency: string
): Promise<number> {
  const recurringList = await getRecurringTransactions(userId);
  const today = new Date().toISOString().split('T')[0];
  let generatedCount = 0;

  for (const item of recurringList) {
    if (item.status !== 'active') continue;

    // If an end date exists and has passed, auto-pause
    if (item.endDate && item.endDate < today) {
      item.status = 'cancelled';
      await saveRecurringTransaction(item);
      continue;
    }

    // Check if due
    if (item.nextDueDate <= today) {
      const converted = convertCurrency(item.amount, item.currency, preferredCurrency);
      const rate = item.amount > 0 ? converted / item.amount : 1.0;

      const newTx: Transaction = {
        id: `tx_rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: item.userId,
        amount: item.amount,
        currency: item.currency,
        convertedAmount: converted,
        exchangeRate: Number(rate.toFixed(6)),
        type: item.type,
        categoryId: item.categoryId || 'other',
        merchant: item.description,
        date: item.nextDueDate,
        paymentMethod: item.paymentMethod || 'Automatic Payment',
        notes: `Automatically generated from recurring schedule (${item.frequency})`,
        tags: ['Recurring', item.frequency],
        isRecurring: true,
        recurringTransactionId: item.id,
        createdAt: new Date().toISOString(),
      };

      await addTransaction(newTx);

      // Advance due date
      item.lastGeneratedDate = item.nextDueDate;
      item.nextDueDate = calculateNextDueDate(item.nextDueDate, item.frequency);
      await saveRecurringTransaction(item);

      // Post notification
      await addNotification({
        id: `notif_rec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: item.userId,
        title: 'Recurring Transaction Posted',
        message: `${item.description} (${formatCurrency(item.amount, item.currency)}) was automatically recorded.`,
        type: 'recurring_created',
        isRead: false,
        link: '/transactions',
        createdAt: new Date().toISOString()
      });

      generatedCount++;
    }
  }

  return generatedCount;
}
