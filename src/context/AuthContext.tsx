import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, FinancialPreferences } from '../types';
import {
  getProfile,
  saveProfile,
  savePreferences,
  seedCategoriesIfEmpty,
  deleteUserAccount as dbDeleteAccount
} from '../services/db';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  preferences: FinancialPreferences | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<FinancialPreferences>) => Promise<void>;
  completeOnboarding: (data: OnboardingSubmission) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export interface SignupData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredCurrency: string;
  countryRegion?: string;
  monthlyIncome?: number;
}

export interface OnboardingSubmission {
  currency: string;
  monthlyIncome?: number;
  monthlySpendingTarget?: number;
  categories: string[];
  notifications: boolean;
  theme: 'light' | 'dark' | 'system';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'spendly_current_user_id';
const REGISTERED_USERS_KEY = 'spendly_registered_users';

interface StoredLocalUser {
  id: string;
  email: string;
  passwordHash: string;
}

// Simple SHA-256 password hash for local storage security
async function hashPassword(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<FinancialPreferences | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    async function loadAuth() {
      try {
        const supabase = getSupabaseClient();
        if (isSupabaseConfigured() && supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await getProfile(session.user.id);
            if (profile) {
              setUser(profile);
            }
          }
        } else {
          // Check local stored session
          const activeUserId = localStorage.getItem(CURRENT_USER_KEY);
          if (activeUserId) {
            const profile = await getProfile(activeUserId);
            if (profile) {
              setUser(profile);
            } else {
              localStorage.removeItem(CURRENT_USER_KEY);
            }
          }
        }
      } catch (err) {
        console.error('Failed to restore auth session', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAuth();
  }, []);

  const signup = async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!data.fullName.trim()) return { success: false, error: 'Full name is required.' };
      if (!data.email.trim()) return { success: false, error: 'Email address is required.' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { success: false, error: 'Please enter a valid email address.' };
      if (data.password.length < 6) return { success: false, error: 'Password must be at least 6 characters.' };
      if (data.password !== data.confirmPassword) return { success: false, error: 'Passwords do not match.' };

      const normalizedEmail = data.email.toLowerCase().trim();

      // Check Supabase mode
      const supabase = getSupabaseClient();
      if (isSupabaseConfigured() && supabase) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: data.password,
          options: {
            data: {
              full_name: data.fullName,
              preferred_currency: data.preferredCurrency || 'USD',
            }
          }
        });

        if (authError) {
          return { success: false, error: authError.message };
        }

        if (authData.user) {
          const newProfile: UserProfile = {
            id: authData.user.id,
            email: normalizedEmail,
            fullName: data.fullName.trim(),
            preferredCurrency: data.preferredCurrency || 'USD',
            countryRegion: data.countryRegion || '',
            monthlyIncome: data.monthlyIncome || 0,
            monthlySpendingTarget: 0,
            onboardingCompleted: false,
            createdAt: new Date().toISOString()
          };

          await saveProfile(newProfile);
          setUser(newProfile);
          return { success: true };
        }
      }

      // Local persistent mode
      const registeredUsers: StoredLocalUser[] = JSON.parse(
        localStorage.getItem(REGISTERED_USERS_KEY) || '[]'
      );

      if (registeredUsers.some(u => u.email === normalizedEmail)) {
        return { success: false, error: 'An account with this email already exists. Please log in.' };
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const pwdHash = await hashPassword(data.password);

      registeredUsers.push({
        id: userId,
        email: normalizedEmail,
        passwordHash: pwdHash
      });
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));

      const newProfile: UserProfile = {
        id: userId,
        email: normalizedEmail,
        fullName: data.fullName.trim(),
        preferredCurrency: data.preferredCurrency || 'USD',
        countryRegion: data.countryRegion || '',
        monthlyIncome: data.monthlyIncome || 0,
        monthlySpendingTarget: 0,
        onboardingCompleted: false,
        createdAt: new Date().toISOString()
      };

      await saveProfile(newProfile);
      localStorage.setItem(CURRENT_USER_KEY, userId);
      setUser(newProfile);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed. Please try again.' };
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      if (!normalizedEmail || !password) {
        return { success: false, error: 'Please enter both email and password.' };
      }

      const supabase = getSupabaseClient();
      if (isSupabaseConfigured() && supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        if (error) {
          return { success: false, error: error.message };
        }
        if (data.user) {
          const profile = await getProfile(data.user.id);
          if (profile) {
            setUser(profile);
            return { success: true };
          }
        }
      }

      // Local persistent mode
      const registeredUsers: StoredLocalUser[] = JSON.parse(
        localStorage.getItem(REGISTERED_USERS_KEY) || '[]'
      );

      const found = registeredUsers.find(u => u.email === normalizedEmail);
      if (!found) {
        return { success: false, error: 'No account found with this email. Please check your credentials or register.' };
      }

      const pwdHash = await hashPassword(password);
      if (found.passwordHash !== pwdHash) {
        return { success: false, error: 'Incorrect password. Please try again or reset your password.' };
      }

      const profile = await getProfile(found.id);
      if (!profile) {
        return { success: false, error: 'Profile data corrupted. Please contact support.' };
      }

      localStorage.setItem(CURRENT_USER_KEY, found.id);
      setUser(profile);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please try again.' };
    }
  };

  const logout = async (): Promise<void> => {
    const supabase = getSupabaseClient();
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(CURRENT_USER_KEY);
    setUser(null);
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) return { success: false, error: 'Email is required.' };

    const supabase = getSupabaseClient();
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
      if (error) return { success: false, error: error.message };
      return { success: true, message: 'Password reset link sent to your email.' };
    }

    const registeredUsers: StoredLocalUser[] = JSON.parse(
      localStorage.getItem(REGISTERED_USERS_KEY) || '[]'
    );
    const found = registeredUsers.find(u => u.email === normalizedEmail);
    if (!found) {
      return { success: false, error: 'No account exists with this email address.' };
    }

    return {
      success: true,
      message: 'Password reset instructions have been dispatched. You can reset your password immediately below.'
    };
  };

  const resetPassword = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters.' };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const registeredUsers: StoredLocalUser[] = JSON.parse(
      localStorage.getItem(REGISTERED_USERS_KEY) || '[]'
    );
    const index = registeredUsers.findIndex(u => u.email === normalizedEmail);
    if (index === -1) {
      return { success: false, error: 'Account not found.' };
    }

    registeredUsers[index].passwordHash = await hashPassword(newPassword);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
    return { success: true };
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated.' };
    if (newPassword.length < 6) return { success: false, error: 'New password must be at least 6 characters.' };

    const registeredUsers: StoredLocalUser[] = JSON.parse(
      localStorage.getItem(REGISTERED_USERS_KEY) || '[]'
    );
    const found = registeredUsers.find(u => u.id === user.id);
    if (!found) return { success: false, error: 'User not found.' };

    const oldHash = await hashPassword(oldPassword);
    if (found.passwordHash !== oldHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    found.passwordHash = await hashPassword(newPassword);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
    return { success: true };
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...updates, updatedAt: new Date().toISOString() };
    await saveProfile(updated);
    setUser(updated);
  };

  const updatePreferences = async (updates: Partial<FinancialPreferences>): Promise<void> => {
    if (!user) return;
    const current = preferences || {
      userId: user.id,
      theme: 'system',
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'en-US',
      notificationsEnabled: true,
      budgetAlerts: true,
      subscriptionAlerts: true,
      goalAlerts: true,
      weeklySummaryEmail: false
    };
    const updated = { ...current, ...updates };
    await savePreferences(updated);
    setPreferences(updated);
  };

  const completeOnboarding = async (data: OnboardingSubmission): Promise<void> => {
    if (!user) return;

    // 1. Seed categories according to user selection
    await seedCategoriesIfEmpty(user.id, data.categories);

    // 2. Save preferences
    await savePreferences({
      userId: user.id,
      theme: data.theme,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: data.currency === 'INR' ? 'en-IN' : 'en-US',
      notificationsEnabled: data.notifications,
      budgetAlerts: data.notifications,
      subscriptionAlerts: data.notifications,
      goalAlerts: data.notifications,
      weeklySummaryEmail: false
    });

    // 3. Update profile with currency & targets, mark onboardingCompleted
    const updatedProfile: UserProfile = {
      ...user,
      preferredCurrency: data.currency,
      monthlyIncome: data.monthlyIncome || user.monthlyIncome || 0,
      monthlySpendingTarget: data.monthlySpendingTarget || 0,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString()
    };

    await saveProfile(updatedProfile);
    setUser(updatedProfile);
  };

  const deleteAccount = async (): Promise<void> => {
    if (!user) return;
    await dbDeleteAccount(user.id);
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        signup,
        login,
        logout,
        forgotPassword,
        resetPassword,
        changePassword,
        updateProfile,
        updatePreferences,
        completeOnboarding,
        deleteAccount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
