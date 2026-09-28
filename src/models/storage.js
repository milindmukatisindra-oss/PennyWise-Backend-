import { supabaseClient, isSupabaseConfigured } from '../config/supabase.js';

// Default system categories
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food', icon: 'Utensils', color: '#f97316', is_default: true, user_id: null },
  { id: 'cat-2', name: 'Transport', icon: 'Bus', color: '#06b6d4', is_default: true, user_id: null },
  { id: 'cat-3', name: 'Education', icon: 'GraduationCap', color: '#3b82f6', is_default: true, user_id: null },
  { id: 'cat-4', name: 'Entertainment', icon: 'Film', color: '#a855f7', is_default: true, user_id: null },
  { id: 'cat-5', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', is_default: true, user_id: null },
  { id: 'cat-6', name: 'Subscriptions', icon: 'Tv', color: '#8b5cf6', is_default: true, user_id: null },
  { id: 'cat-7', name: 'Gaming', icon: 'Gamepad2', color: '#10b981', is_default: true, user_id: null },
  { id: 'cat-8', name: 'Health', icon: 'HeartPulse', color: '#ef4444', is_default: true, user_id: null },
  { id: 'cat-9', name: 'Mobile/Internet', icon: 'Wifi', color: '#14b8a6', is_default: true, user_id: null },
  { id: 'cat-10', name: 'Other', icon: 'MoreHorizontal', color: '#64748b', is_default: true, user_id: null },
];

// In-memory data store for local dev fallback
export const memoryStore = {
  users: [],
  categories: [...DEFAULT_CATEGORIES],
  expenses: [],
  incomes: [],
  budgets: [],
  goals: [],
};

export { supabaseClient, isSupabaseConfigured, DEFAULT_CATEGORIES };
