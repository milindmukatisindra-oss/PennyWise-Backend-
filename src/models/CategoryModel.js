import { supabaseClient, isSupabaseConfigured, memoryStore } from './storage.js';
import crypto from 'crypto';

class CategoryModel {
  /**
   * Get all categories accessible by the user (system default + user custom)
   */
  static async findAll(userId = null) {
    if (isSupabaseConfigured) {
      let query = supabaseClient.from('categories').select('*');
      if (userId) {
        query = query.or(`is_default.eq.true,user_id.eq.${userId}`);
      } else {
        query = query.eq('is_default', true);
      }
      query = query.order('name', { ascending: true });

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    }

    return memoryStore.categories
      .filter((c) => c.is_default || (userId && c.user_id === userId))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Find a specific category by ID
   */
  static async findById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw new Error(error.message);
      return data || null;
    }

    return memoryStore.categories.find((c) => c.id === id) || null;
  }

  /**
   * Create a custom category for a user
   */
  static async create({ name, icon = 'Tag', color = '#6366f1', userId }) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('categories')
        .insert([
          {
            name: name.trim(),
            icon,
            color,
            is_default: false,
            user_id: userId,
          },
        ])
        .select('*')
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const newCat = {
      id: crypto.randomUUID(),
      name: name.trim(),
      icon,
      color,
      is_default: false,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    memoryStore.categories.push(newCat);
    return newCat;
  }
}

export default CategoryModel;
