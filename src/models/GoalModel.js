import { supabaseClient, isSupabaseConfigured, memoryStore } from './storage.js';
import crypto from 'crypto';

class GoalModel {
  /**
   * Find all saving goals for a user
   */
  static async findAll(userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return data || [];
    }

    return memoryStore.goals.filter((g) => g.user_id === userId);
  }

  /**
   * Find a specific goal by ID ensuring user ownership
   */
  static async findById(id, userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('goals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data || null;
    }

    return memoryStore.goals.find((g) => g.id === id && g.user_id === userId) || null;
  }

  /**
   * Create a new saving goal
   */
  static async create({ userId, title, targetAmount, savedAmount = 0, targetDate = null, icon = '🎯' }) {
    const target = Number(targetAmount);
    const saved = Number(savedAmount) || 0;
    const isCompleted = saved >= target;
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('goals')
        .insert([
          {
            user_id: userId,
            title: title.trim(),
            target_amount: target,
            saved_amount: saved,
            target_date: targetDate,
            icon,
            is_completed: isCompleted,
          },
        ])
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const newGoal = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: title.trim(),
      target_amount: target,
      saved_amount: saved,
      target_date: targetDate,
      icon,
      is_completed: isCompleted,
      created_at: now,
      updated_at: now,
    };
    memoryStore.goals.push(newGoal);
    return newGoal;
  }

  /**
   * Update goal details
   */
  static async update(id, userId, updates) {
    const allowed = ['title', 'target_amount', 'saved_amount', 'target_date', 'icon', 'is_completed'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (key === 'target_amount' || key === 'saved_amount') {
          filtered[key] = Number(updates[key]);
        } else {
          filtered[key] = updates[key];
        }
      }
    }

    if (filtered.target_amount !== undefined || filtered.saved_amount !== undefined) {
      const current = await this.findById(id, userId);
      if (current) {
        const target = filtered.target_amount !== undefined ? filtered.target_amount : current.target_amount;
        const saved = filtered.saved_amount !== undefined ? filtered.saved_amount : current.saved_amount;
        filtered.is_completed = saved >= target;
      }
    }
    filtered.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('goals')
        .update(filtered)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const index = memoryStore.goals.findIndex((g) => g.id === id && g.user_id === userId);
    if (index === -1) return null;

    memoryStore.goals[index] = { ...memoryStore.goals[index], ...filtered };
    return memoryStore.goals[index];
  }

  /**
   * Delete goal
   */
  static async delete(id, userId) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (error) throw new Error(error.message);
      return Boolean(data);
    }

    const initialLength = memoryStore.goals.length;
    memoryStore.goals = memoryStore.goals.filter((g) => !(g.id === id && g.user_id === userId));
    return memoryStore.goals.length < initialLength;
  }
}

export default GoalModel;
