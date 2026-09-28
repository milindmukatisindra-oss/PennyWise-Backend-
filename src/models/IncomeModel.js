import { supabaseClient, isSupabaseConfigured, memoryStore } from './storage.js';
import crypto from 'crypto';

class IncomeModel {
  /**
   * Find incomes for a user with sorting and optional date filtering
   */
  static async findAll({ userId, startDate = null, endDate = null, limit = 50, offset = 0 }) {
    if (isSupabaseConfigured) {
      let query = supabaseClient
        .from('incomes')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('income_date', { ascending: false });

      if (startDate) query = query.gte('income_date', startDate);
      if (endDate) query = query.lte('income_date', endDate);
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) throw new Error(error.message);
      return { incomes: data || [], totalCount: count || 0 };
    }

    let list = memoryStore.incomes.filter((i) => i.user_id === userId);
    if (startDate) list = list.filter((i) => i.income_date >= startDate);
    if (endDate) list = list.filter((i) => i.income_date <= endDate);

    list.sort((a, b) => new Date(b.income_date) - new Date(a.income_date));
    const totalCount = list.length;
    const paginated = list.slice(offset, offset + limit);

    return { incomes: paginated, totalCount };
  }

  /**
   * Find income by ID ensuring user ownership
   */
  static async findById(id, userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('incomes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data || null;
    }

    return memoryStore.incomes.find((i) => i.id === id && i.user_id === userId) || null;
  }

  /**
   * Record new income/pocket money
   */
  static async create({ userId, amount, source, description, incomeDate }) {
    const formattedAmount = Number(amount);
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('incomes')
        .insert([
          {
            user_id: userId,
            amount: formattedAmount,
            source,
            description: description ? description.trim() : null,
            income_date: incomeDate,
          },
        ])
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const newIncome = {
      id: crypto.randomUUID(),
      user_id: userId,
      amount: formattedAmount,
      source,
      description: description ? description.trim() : '',
      income_date: incomeDate,
      created_at: now,
      updated_at: now,
    };
    memoryStore.incomes.push(newIncome);
    return newIncome;
  }

  /**
   * Update income entry
   */
  static async update(id, userId, updates) {
    const allowed = ['amount', 'source', 'description', 'income_date'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        filtered[key] = key === 'amount' ? Number(updates[key]) : updates[key];
      }
    }
    filtered.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('incomes')
        .update(filtered)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const index = memoryStore.incomes.findIndex((i) => i.id === id && i.user_id === userId);
    if (index === -1) return null;

    memoryStore.incomes[index] = { ...memoryStore.incomes[index], ...filtered };
    return memoryStore.incomes[index];
  }

  /**
   * Delete income entry
   */
  static async delete(id, userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('incomes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      return Boolean(data);
    }

    const initialLength = memoryStore.incomes.length;
    memoryStore.incomes = memoryStore.incomes.filter((i) => !(i.id === id && i.user_id === userId));
    return memoryStore.incomes.length < initialLength;
  }
}

export default IncomeModel;
