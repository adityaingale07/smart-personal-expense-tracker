import { Category } from '../types';

export interface DefaultCategoryTemplate {
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isEssential: boolean;
}

export const INITIAL_CATEGORY_TEMPLATES: DefaultCategoryTemplate[] = [
  // Expenses - Essential
  { name: 'Housing', type: 'expense', icon: 'Home', color: '#3B82F6', isEssential: true },
  { name: 'Food & Groceries', type: 'expense', icon: 'Utensils', color: '#10B981', isEssential: true },
  { name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#F59E0B', isEssential: true },
  { name: 'Transport', type: 'expense', icon: 'Car', color: '#6366F1', isEssential: true },
  { name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#EF4444', isEssential: true },
  { name: 'Insurance', type: 'expense', icon: 'ShieldCheck', color: '#0EA5E9', isEssential: true },
  { name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#8B5CF6', isEssential: true },

  // Expenses - Lifestyle & Discretionary
  { name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', isEssential: false },
  { name: 'Entertainment', type: 'expense', icon: 'Film', color: '#F43F5E', isEssential: false },
  { name: 'Travel', type: 'expense', icon: 'Plane', color: '#14B8A6', isEssential: false },
  { name: 'Subscriptions', type: 'expense', icon: 'Tv', color: '#A855F7', isEssential: false },
  { name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#D946EF', isEssential: false },
  { name: 'Investments', type: 'expense', icon: 'TrendingUp', color: '#10B981', isEssential: false },
  { name: 'Other Expenses', type: 'expense', icon: 'MoreHorizontal', color: '#64748B', isEssential: false },

  // Incomes
  { name: 'Salary', type: 'income', icon: 'Briefcase', color: '#10B981', isEssential: false },
  { name: 'Freelance & Consulting', type: 'income', icon: 'Laptop', color: '#06B6D4', isEssential: false },
  { name: 'Investments & Dividends', type: 'income', icon: 'BadgePercent', color: '#8B5CF6', isEssential: false },
  { name: 'Business Revenue', type: 'income', icon: 'Building2', color: '#F59E0B', isEssential: false },
  { name: 'Gifts & Bonuses', type: 'income', icon: 'Gift', color: '#EC4899', isEssential: false },
  { name: 'Other Income', type: 'income', icon: 'Coins', color: '#64748B', isEssential: false },
];

export function generateDefaultCategoriesForUser(
  userId: string,
  selectedNames?: string[]
): Category[] {
  const templates = selectedNames && selectedNames.length > 0
    ? INITIAL_CATEGORY_TEMPLATES.filter(
        t => t.type === 'income' || selectedNames.includes(t.name)
      )
    : INITIAL_CATEGORY_TEMPLATES;

  const now = new Date().toISOString();

  return templates.map((tmpl) => ({
    id: `cat_${tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).slice(2, 7)}`,
    userId,
    name: tmpl.name,
    type: tmpl.type,
    icon: tmpl.icon,
    color: tmpl.color,
    parentId: null,
    monthlyBudget: null,
    isEssential: tmpl.isEssential,
    isDefault: true,
    createdAt: now,
  }));
}
