import { supabase } from './supabase';

const checkClient = () => {
  if (!supabase) {
    throw new Error('Supabase não configurado. Adicione as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  }
};

export const supabaseService = {
  // Auth
  async signIn(email, password) {
    checkClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  async signUp(email, password, metadata) {
    checkClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    return data.user;
  },

  async signOut() {
    checkClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Profile
  async getProfile(userId) {
    checkClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async upsertProfile(profile) {
    checkClient();
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
    checkClient();
    const { data, error } = await supabase
      .from('logs')
      .select('*, tickets(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createLog(log) {
    checkClient();
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
    checkClient();
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getActiveTickets(userId) {
    checkClient();
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async upsertTicket(ticket) {
    checkClient();
    const { data, error } = await supabase
      .from('tickets')
      .upsert(ticket)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async linkTicketsToLog(userId, logId) {
    checkClient();
    const { error } = await supabase
      .from('tickets')
      .update({ ponto_id: logId, is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);
    if (error) throw error;
  },

  async deleteTicket(ticketId) {
    checkClient();
    const { error } = await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);
    if (error) throw error;
  },

  // Active Shift
  async getActiveShift(userId) {
    checkClient();
    const { data, error } = await supabase
      .from('active_shifts')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async startShift(userId) {
    checkClient();
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
    checkClient();
    const { error } = await supabase
      .from('active_shifts')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
};
