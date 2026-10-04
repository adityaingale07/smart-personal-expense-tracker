import {
  Transaction,
  Budget,
  Goal,
  Subscription,
  RecurringTransaction,
  UserProfile,
  FinancialHealthScoreResult
} from '../types';

export function calculateFinancialHealthScore(
  user: UserProfile | null,
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  subscriptions: Subscription[],
  recurringTransactions: RecurringTransaction[]
): FinancialHealthScoreResult {
  // If user has insufficient data, do not fabricate numbers!
  if (!user || transactions.length < 3) {
    return {
      isEligible: false,
      ineligibleReason: 'Requires at least 3 logged transactions to establish a baseline financial score.',
      overallScore: 0,
      grade: 'D',
      breakdown: {
        spendingControl: 0,
        savingsRate: 0,
        budgetAdherence: 0,
        recurringBurden: 0,
        goalProgress: 0,
        incomeStability: 0,
      },
      keyInsights: [],
      recommendations: [
        'Record your regular daily expenses to start building an accurate financial profile.',
        'Set up monthly budgets for key categories like Groceries, Dining, and Utilities.',
      ],
    };
  }

  // 1. Calculate Total Income & Expenses (using convertedAmount in user's preferred currency)
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

  // Fallback to monthlyIncome from profile if no income transaction was logged yet
  const effectiveMonthlyIncome = totalIncome > 0
    ? totalIncome
    : (user.monthlyIncome && user.monthlyIncome > 0 ? user.monthlyIncome : 0);

  // 2. Component: Savings Rate (0 - 100)
  let savingsRateScore = 50;
  if (effectiveMonthlyIncome > 0) {
    const netSavings = effectiveMonthlyIncome - totalExpense;
    const rawRate = (netSavings / effectiveMonthlyIncome) * 100;
    if (rawRate >= 40) savingsRateScore = 98;
    else if (rawRate >= 30) savingsRateScore = 90;
    else if (rawRate >= 20) savingsRateScore = 80;
    else if (rawRate >= 10) savingsRateScore = 68;
    else if (rawRate >= 0) savingsRateScore = 55;
    else if (rawRate >= -10) savingsRateScore = 40;
    else savingsRateScore = 25;
  } else {
    // If no income recorded at all, lower score
    savingsRateScore = totalExpense === 0 ? 50 : 30;
  }

  // 3. Component: Spending Control (0 - 100)
  let spendingControlScore = 70;
  const target = user.monthlySpendingTarget || (effectiveMonthlyIncome > 0 ? effectiveMonthlyIncome * 0.8 : 0);
  if (target > 0) {
    const spendRatio = totalExpense / target;
    if (spendRatio <= 0.6) spendingControlScore = 95;
    else if (spendRatio <= 0.8) spendingControlScore = 88;
    else if (spendRatio <= 1.0) spendingControlScore = 78;
    else if (spendRatio <= 1.15) spendingControlScore = 60;
    else if (spendRatio <= 1.3) spendingControlScore = 45;
    else spendingControlScore = 30;
  } else {
    spendingControlScore = totalExpense > 0 ? 65 : 75;
  }

  // 4. Component: Budget Adherence (0 - 100)
  let budgetAdherenceScore = 75;
  if (budgets.length > 0) {
    let compliantCount = 0;
    budgets.forEach(b => {
      const catSpent = transactions
        .filter(t => t.type === 'expense' && (b.categoryId === 'all' || t.categoryId === b.categoryId))
        .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);
      if (catSpent <= b.amount) {
        compliantCount++;
      } else {
        const overPercent = (catSpent - b.amount) / b.amount;
        compliantCount += Math.max(0, 1 - overPercent);
      }
    });
    budgetAdherenceScore = Math.min(100, Math.round((compliantCount / budgets.length) * 100));
  }

  // 5. Component: Recurring Burden (0 - 100)
  // Lower burden = Higher score
  let recurringBurdenScore = 80;
  const recurringMonthlySum = [
    ...subscriptions.filter(s => s.status === 'active').map(s => {
      if (s.billingCycle === 'yearly') return s.amount / 12;
      if (s.billingCycle === 'weekly') return s.amount * 4.33;
      return s.amount;
    }),
    ...recurringTransactions.filter(r => r.status === 'active' && r.type === 'expense').map(r => {
      if (r.frequency === 'yearly') return r.amount / 12;
      if (r.frequency === 'weekly') return r.amount * 4.33;
      if (r.frequency === 'daily') return r.amount * 30;
      return r.amount;
    })
  ].reduce((a, b) => a + b, 0);

  if (effectiveMonthlyIncome > 0) {
    const recurringRatio = (recurringMonthlySum / effectiveMonthlyIncome) * 100;
    if (recurringRatio <= 20) recurringBurdenScore = 95;
    else if (recurringRatio <= 35) recurringBurdenScore = 85;
    else if (recurringRatio <= 50) recurringBurdenScore = 70;
    else if (recurringRatio <= 65) recurringBurdenScore = 55;
    else recurringBurdenScore = 35;
  } else if (recurringMonthlySum > 0) {
    recurringBurdenScore = 60;
  }

  // 6. Component: Goal Progress (0 - 100)
  let goalProgressScore = 70;
  if (goals.length > 0) {
    const avgProgress = goals.reduce((acc, g) => {
      const p = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
      return acc + Math.min(100, p);
    }, 0) / goals.length;
    goalProgressScore = Math.round(Math.min(100, Math.max(30, avgProgress)));
  }

  // 7. Component: Income Stability (0 - 100)
  const incomeCount = transactions.filter(t => t.type === 'income').length;
  let incomeStabilityScore = 70;
  if (incomeCount >= 3) incomeStabilityScore = 95;
  else if (incomeCount >= 1 || (user.monthlyIncome && user.monthlyIncome > 0)) incomeStabilityScore = 82;
  else incomeStabilityScore = 50;

  // Weighted Overall Score
  const overall = Math.round(
    spendingControlScore * 0.25 +
    savingsRateScore * 0.25 +
    budgetAdherenceScore * 0.20 +
    recurringBurdenScore * 0.15 +
    goalProgressScore * 0.10 +
    incomeStabilityScore * 0.05
  );

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' = 'D';
  if (overall >= 90) grade = 'A+';
  else if (overall >= 80) grade = 'A';
  else if (overall >= 70) grade = 'B';
  else if (overall >= 55) grade = 'C';

  // Dynamic Key Insights
  const insights: string[] = [];
  if (savingsRateScore >= 80) insights.push('Strong savings capacity based on current net cashflow.');
  else if (savingsRateScore < 55) insights.push('Expenses are absorbing the majority of your cashflow.');

  if (budgetAdherenceScore >= 85 && budgets.length > 0) insights.push('Excellent discipline staying within category limits.');
  else if (budgets.length === 0) insights.push('No budgets set yet. Creating category limits will strengthen your score.');

  if (recurringBurdenScore < 60) insights.push('High recurring subscription & fixed commitment load relative to income.');

  const recommendations: string[] = [];
  if (savingsRateScore < 70) recommendations.push('Review non-essential discretionary expenses to improve savings rate.');
  if (budgets.length < 2) recommendations.push('Set at least two monthly category budgets for closer financial control.');
  if (goals.length === 0) recommendations.push('Create a financial goal (e.g., Emergency Fund) to track purposeful saving.');

  return {
    isEligible: true,
    overallScore: Math.min(100, Math.max(0, overall)),
    grade,
    breakdown: {
      spendingControl: spendingControlScore,
      savingsRate: savingsRateScore,
      budgetAdherence: budgetAdherenceScore,
      recurringBurden: recurringBurdenScore,
      goalProgress: goalProgressScore,
      incomeStability: incomeStabilityScore,
    },
    keyInsights: insights,
    recommendations,
  };
}
