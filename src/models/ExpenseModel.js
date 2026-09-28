import { supabaseClient, isSupabaseConfigured, memoryStore } from './storage.js';
import crypto from 'crypto';

class ExpenseModel {
  /**
   * Find expenses for a specific user with filtering, search, pagination, and sorting
   */
  static async findAll({
    userId,
    categoryId = null,
    startDate = null,
    endDate = null,
    search = '',
    limit = 50,
    offset = 0,
    sortBy = 'expense_date',
    sortOrder = 'desc',
  }) {
    if (isSupabaseConfigured) {
      let query = supabaseClient
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          expense_date,
          payment_method,
          created_at,
          category:categories(id, name, icon, color)
        `, { count: 'exact' })
        .eq('user_id', userId);

      if (categoryId) query = query.eq('category_id', categoryId);
      if (startDate) query = query.gte('expense_date', startDate);
      if (endDate) query = query.lte('expense_date', endDate);
      if (search) query = query.ilike('description', `%${search}%`);

      const ascending = sortOrder.toLowerCase() === 'asc';
      query = query.order(sortBy, { ascending });
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;
      if (error) throw new Error(error.message);
      return { expenses: data || [], totalCount: count || 0 };
    }

    // In-memory fallback
    let list = memoryStore.expenses.filter((e) => e.user_id === userId);

    if (categoryId) list = list.filter((e) => e.category_id === categoryId);
    if (startDate) list = list.filter((e) => e.expense_date >= startDate);
    if (endDate) list = list.filter((e) => e.expense_date <= endDate);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((e) => e.description.toLowerCase().includes(q));
    }

    const totalCount = list.length;

    // Sorting
    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === 'amount') {
        valA = Number(valA);
        valB = Number(valB);
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const paginated = list.slice(offset, offset + limit).map((e) => {
      const category = memoryStore.categories.find((c) => c.id === e.category_id) || {
        id: e.category_id,
        name: 'Other',
        icon: 'MoreHorizontal',
        color: '#64748b',
      };
      return { ...e, category };
    });

    return { expenses: paginated, totalCount };
  }

  /**
   * Find a specific expense by ID ensuring it belongs to the user
   */
  static async findById(id, userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('expenses')
        .select(`
          id,
          amount,
          description,
          expense_date,
          payment_method,
          category_id,
          created_at,
          category:categories(id, name, icon, color)
        `)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data || null;
    }

    const expense = memoryStore.expenses.find((e) => e.id === id && e.user_id === userId);
    if (!expense) return null;
    const category = memoryStore.categories.find((c) => c.id === expense.category_id);
    return { ...expense, category };
  }

  /**
   * Create a new expense for a user
   */
  static async create({ userId, categoryId, amount, description, expenseDate, paymentMethod }) {
    const formattedAmount = Number(amount);
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('expenses')
        .insert([
          {
            user_id: userId,
            category_id: categoryId,
            amount: formattedAmount,
            description: description.trim(),
            expense_date: expenseDate,
            payment_method: paymentMethod,
          },
        ])
        .select(`
          id,
          amount,
          description,
          expense_date,
          payment_method,
          category_id,
          created_at,
          category:categories(id, name, icon, color)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const newExpense = {
      id: crypto.randomUUID(),
      user_id: userId,
      category_id: categoryId,
      amount: formattedAmount,
      description: description.trim(),
      expense_date: expenseDate,
      payment_method: paymentMethod,
      created_at: now,
      updated_at: now,
    };
    memoryStore.expenses.push(newExpense);
    const category = memoryStore.categories.find((c) => c.id === categoryId);
    return { ...newExpense, category };
  }

  /**
   * Update an expense belonging to a user
   */
  static async update(id, userId, updates) {
    const allowed = ['category_id', 'amount', 'description', 'expense_date', 'payment_method'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        filtered[key] = key === 'amount' ? Number(updates[key]) : updates[key];
      }
    }
    filtered.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('expenses')
        .update(filtered)
        .eq('id', id)
        .eq('user_id', userId)
        .select(`
          id,
          amount,
          description,
          expense_date,
          payment_method,
          category_id,
          created_at,
          category:categories(id, name, icon, color)
        `)
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const index = memoryStore.expenses.findIndex((e) => e.id === id && e.user_id === userId);
    if (index === -1) return null;

    memoryStore.expenses[index] = { ...memoryStore.expenses[index], ...filtered };
    const category = memoryStore.categories.find((c) => c.id === memoryStore.expenses[index].category_id);
    return { ...memoryStore.expenses[index], category };
  }

  /**
   * Delete an expense belonging to a user
   */
  static async delete(id, userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('expenses')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      return Boolean(data);
    }

    const initialLength = memoryStore.expenses.length;
    memoryStore.expenses = memoryStore.expenses.filter((e) => !(e.id === id && e.user_id === userId));
    return memoryStore.expenses.length < initialLength;
  }
}

export default ExpenseModel;
