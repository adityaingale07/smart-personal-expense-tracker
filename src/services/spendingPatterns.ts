import { Transaction, Category, Subscription, SpendingPattern } from '../types';

export function detectSpendingPatterns(
  transactions: Transaction[],
  categories: Category[],
  subscriptions: Subscription[]
): SpendingPattern[] {
  // Only detect when sufficient real transactions exist (at least 4 expense transactions)
  const expenseTx = transactions.filter(t => t.type === 'expense');
  if (expenseTx.length < 4) {
    return [];
  }

  const patterns: SpendingPattern[] = [];
  const catMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  // 1. Weekend vs Weekday analysis
  let weekendTotal = 0;
  let weekendCount = 0;
  let weekdayTotal = 0;
  let weekdayCount = 0;

  expenseTx.forEach(t => {
    const day = new Date(t.date).getDay();
    const amt = t.convertedAmount || t.amount;
    if (day === 0 || day === 6) {
      // Sunday (0) or Saturday (6)
      weekendTotal += amt;
      weekendCount++;
    } else {
      weekdayTotal += amt;
      weekdayCount++;
    }
  });

  const avgWeekend = weekendCount > 0 ? weekendTotal / weekendCount : 0;
  const avgWeekday = weekdayCount > 0 ? weekdayTotal / weekdayCount : 0;

  if (avgWeekend > 0 && avgWeekday > 0) {
    if (avgWeekend >= avgWeekday * 1.25) {
      const diffPct = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);
      patterns.push({
        id: 'pattern_weekend_higher',
        title: 'Higher Weekend Spending',
        description: `Your average spending on weekends is ${diffPct}% higher than on weekdays. Consider setting weekend allowance limits.`,
        significance: 'warning',
        metric: `+${diffPct}% on weekends`,
      });
    } else if (avgWeekday >= avgWeekend * 1.25) {
      const diffPct = Math.round(((avgWeekday - avgWeekend) / avgWeekend) * 100);
      patterns.push({
        id: 'pattern_weekday_higher',
        title: 'Weekday Heavy Spending',
        description: `Your workweek expenses are ${diffPct}% higher per transaction than weekend leisure spending.`,
        significance: 'neutral',
        metric: `+${diffPct}% weekdays`,
      });
    }
  }

  // 2. Fixed Commitments & Subscriptions % of Total Spending
  const totalExpenseSum = expenseTx.reduce((s, t) => s + (t.convertedAmount || t.amount), 0);
  const totalSubMonthly = subscriptions
    .filter(s => s.status === 'active')
    .reduce((s, sub) => {
      if (sub.billingCycle === 'yearly') return s + sub.amount / 12;
      if (sub.billingCycle === 'weekly') return s + sub.amount * 4.33;
      return s + sub.amount;
    }, 0);

  if (totalExpenseSum > 0 && totalSubMonthly > 0) {
    const subPct = Math.round((totalSubMonthly / totalExpenseSum) * 100);
    if (subPct >= 20) {
      patterns.push({
        id: 'pattern_subs_burden',
        title: 'Subscription Load',
        description: `Active subscriptions account for approximately ${subPct}% of your regular monthly spending.`,
        significance: subPct > 35 ? 'warning' : 'neutral',
        metric: `${subPct}% of total spent`,
      });
    }
  }

  // 3. Highest spending category concentration
  const catSums: Record<string, number> = {};
  expenseTx.forEach(t => {
    catSums[t.categoryId] = (catSums[t.categoryId] || 0) + (t.convertedAmount || t.amount);
  });

  const sortedCats = Object.entries(catSums).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0 && totalExpenseSum > 0) {
    const topCatId = sortedCats[0][0];
    const topCatSum = sortedCats[0][1];
    const topCatShare = Math.round((topCatSum / totalExpenseSum) * 100);
    const cat = catMap.get(topCatId);

    if (topCatShare >= 40 && cat) {
      patterns.push({
        id: 'pattern_dominant_cat',
        title: `Dominant Category: ${cat.name}`,
        description: `${cat.name} accounts for ${topCatShare}% of your total logged expenses.`,
        significance: cat.isEssential ? 'neutral' : 'warning',
        metric: `${topCatShare}% of all expenses`,
      });
    }
  }

  // 4. Frequent payment method
  const methodCounts: Record<string, number> = {};
  expenseTx.forEach(t => {
    const method = t.paymentMethod || 'Cash';
    methodCounts[method] = (methodCounts[method] || 0) + 1;
  });

  const sortedMethods = Object.entries(methodCounts).sort((a, b) => b[1] - a[1]);
  if (sortedMethods.length > 0 && sortedMethods[0][1] >= 3) {
    const [favMethod, count] = sortedMethods[0];
    const methodPct = Math.round((count / expenseTx.length) * 100);
    if (methodPct >= 60) {
      patterns.push({
        id: 'pattern_payment_method',
        title: `Primary Payment Method: ${favMethod}`,
        description: `You complete ${methodPct}% of transactions using ${favMethod}.`,
        significance: 'positive',
        metric: `${methodPct}% transactions`,
      });
    }
  }

  return patterns;
}
