import { supabaseClient, isSupabaseConfigured, memoryStore } from './storage.js';
import crypto from 'crypto';

class BudgetModel {
  /**
   * Find budgets for a user for a specific month/year
   */
  static async findAll({ userId, month, year }) {
    const m = Number(month);
    const y = Number(year);

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('budgets')
        .select(`
          id,
          amount,
          month,
          year,
          category_id,
          created_at,
          category:categories(id, name, icon, color)
        `)
        .eq('user_id', userId)
        .eq('month', m)
        .eq('year', y);

      if (error) throw new Error(error.message);
      return data || [];
    }

    const budgets = memoryStore.budgets.filter(
      (b) => b.user_id === userId && b.month === m && b.year === y
    );

    return budgets.map((b) => {
      const category = memoryStore.categories.find((c) => c.id === b.category_id) || {
        id: b.category_id,
        name: 'General',
        icon: 'Tag',
        color: '#6366f1',
      };
      return { ...b, category };
    });
  }

  /**
   * Upsert (create or update) a monthly category budget
   */
  static async upsert({ userId, categoryId, amount, month, year }) {
    const formattedAmount = Number(amount);
    const m = Number(month);
    const y = Number(year);
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('budgets')
        .upsert(
          [
            {
              user_id: userId,
              category_id: categoryId,
              amount: formattedAmount,
              month: m,
              year: y,
              updated_at: now,
            },
          ],
          { onConflict: 'user_id, category_id, month, year' }
        )
        .select(`
          id,
          amount,
          month,
          year,
          category_id,
          created_at,
          category:categories(id, name, icon, color)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const existingIndex = memoryStore.budgets.findIndex(
      (b) => b.user_id === userId && b.category_id === categoryId && b.month === m && b.year === y
    );

    if (existingIndex > -1) {
      memoryStore.budgets[existingIndex].amount = formattedAmount;
      memoryStore.budgets[existingIndex].updated_at = now;
      const category = memoryStore.categories.find((c) => c.id === categoryId);
      return { ...memoryStore.budgets[existingIndex], category };
    }

    const newBudget = {
      id: crypto.randomUUID(),
      user_id: userId,
      category_id: categoryId,
      amount: formattedAmount,
      month: m,
      year: y,
      created_at: now,
      updated_at: now,
    };
    memoryStore.budgets.push(newBudget);
    const category = memoryStore.categories.find((c) => c.id === categoryId);
    return { ...newBudget, category };
  }

  /**
   * Delete a budget by ID
   */
  static async delete(id, userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      return Boolean(data);
    }

    const initialLength = memoryStore.budgets.length;
    memoryStore.budgets = memoryStore.budgets.filter((b) => !(b.id === id && b.user_id === userId));
    return memoryStore.budgets.length < initialLength;
  }
}

export default BudgetModel;
