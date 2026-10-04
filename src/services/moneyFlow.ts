import { Transaction, Category, Subscription, Goal, MoneyFlowBreakdown, UserProfile } from '../types';

export function calculateMoneyFlow(
  user: UserProfile | null,
  transactions: Transaction[],
  categories: Category[],
  subscriptions: Subscription[],
  goals: Goal[],
  displayCurrency: string
): MoneyFlowBreakdown {
  const catMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  // Sum total income
  const loggedIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.convertedAmount || t.amount), 0);

  const totalIncome = loggedIncome > 0
    ? loggedIncome
    : (user?.monthlyIncome && user.monthlyIncome > 0 ? user.monthlyIncome : 0);

  // Essential vs Lifestyle
  let essentialExpenses = 0;
  let lifestyleExpenses = 0;
  let subscriptionExpenses = 0;

  // Active subscription sum for the month
  const activeSubsMonthly = subscriptions
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      let monthlyCost = s.amount;
      if (s.billingCycle === 'yearly') monthlyCost = s.amount / 12;
      else if (s.billingCycle === 'weekly') monthlyCost = s.amount * 4.33;
      else if (s.billingCycle === 'quarterly') monthlyCost = s.amount / 3;
      return sum + monthlyCost;
    }, 0);

  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      const cat = catMap.get(t.categoryId);
      const isSubCat = cat?.name?.toLowerCase().includes('subscription') || t.notes?.toLowerCase().includes('subscription');
      
      if (isSubCat) {
        subscriptionExpenses += (t.convertedAmount || t.amount);
      } else if (cat?.isEssential) {
        essentialExpenses += (t.convertedAmount || t.amount);
      } else {
        lifestyleExpenses += (t.convertedAmount || t.amount);
      }
    });

  // If no transactions logged for subscriptions specifically, use active subscriptions model
  if (subscriptionExpenses === 0 && activeSubsMonthly > 0) {
    subscriptionExpenses = activeSubsMonthly;
  }

  // Sum money allocated to goals
  const goalsAllocated = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  const totalSpent = essentialExpenses + lifestyleExpenses + subscriptionExpenses;
  const remainingCashflow = Math.max(0, totalIncome - totalSpent);
  const savings = Math.max(0, remainingCashflow);

  return {
    totalIncome: Number(totalIncome.toFixed(2)),
    essentialExpenses: Number(essentialExpenses.toFixed(2)),
    lifestyleExpenses: Number(lifestyleExpenses.toFixed(2)),
    subscriptions: Number(subscriptionExpenses.toFixed(2)),
    savings: Number(savings.toFixed(2)),
    goalsAllocated: Number(goalsAllocated.toFixed(2)),
    remainingCashflow: Number(remainingCashflow.toFixed(2)),
    currency: displayCurrency,
  };
}
