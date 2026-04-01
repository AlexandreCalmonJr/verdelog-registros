import { supabase } from './supabase';

export const supabaseService = {
  // Auth
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  async signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data.user;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Profile
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsertProfile(profile) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Logs (Ponto)
  async getLogs(userId) {
    const { data, error } = await supabase
      .from('logs')
      .select('*, tickets(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createLog(log) {
    const { data, error } = await supabase
      .from('logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Tickets (Chamados)
  async getTickets(userId) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async upsertTicket(ticket) {
    const { data, error } = await supabase
      .from('tickets')
      .upsert(ticket)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTicket(ticketId) {
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);
    if (error) throw error;
  },

  // Active Shift
  async getActiveShift(userId) {
    const { data, error } = await supabase
      .from('active_shifts')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async startShift(userId) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('active_shifts')
      .insert({ user_id: userId, start_time: now })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async endShift(userId) {
    const { error } = await supabase
      .from('active_shifts')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
};
