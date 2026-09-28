import { supabaseClient, isSupabaseConfigured, memoryStore } from './storage.js';
import crypto from 'crypto';

class UserModel {
  /**
   * Find a user by their email address (includes password_hash for auth checks)
   */
  static async findByEmail(email) {
    const normalizedEmail = email.toLowerCase().trim();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', normalizedEmail)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      return data || null;
    }

    const user = memoryStore.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    return user ? { ...user } : null;
  }

  /**
   * Find a user by their ID (excludes password_hash for safety)
   */
  static async findById(id) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email, currency, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(error.message);
      }
      return data || null;
    }

    const user = memoryStore.users.find((u) => u.id === id);
    if (!user) return null;
    const { password_hash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Create a new user record
   */
  static async create({ name, email, password_hash, currency = '₹' }) {
    const normalizedEmail = email.toLowerCase().trim();
    const now = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('users')
        .insert([
          {
            name: name.trim(),
            email: normalizedEmail,
            password_hash,
            currency,
          },
        ])
        .select('id, name, email, currency, created_at, updated_at')
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    }

    const newUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password_hash,
      currency,
      created_at: now,
      updated_at: now,
    };

    memoryStore.users.push(newUser);
    const { password_hash: _, ...safeUser } = newUser;
    return safeUser;
  }

  /**
   * Update user details (e.g., currency, name)
   */
  static async update(id, updates) {
    const allowed = ['name', 'currency'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }
    filtered.updated_at = new Date().toISOString();

    if (isSupabaseConfigured) {
      const { data, error } = await supabaseClient
        .from('users')
        .update(filtered)
        .eq('id', id)
        .select('id, name, email, currency, created_at, updated_at')
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const index = memoryStore.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    memoryStore.users[index] = { ...memoryStore.users[index], ...filtered };
    const { password_hash, ...safeUser } = memoryStore.users[index];
    return safeUser;
  }
}

export default UserModel;
