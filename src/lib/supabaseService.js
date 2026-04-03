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
      .select('*')
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

  // Sectors
  async getSectors() {
    checkClient();
    const { data, error } = await supabase
      .from('sectors')
      .select('*')
      .order('floor', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async upsertSector(sector) {
    checkClient();
    const { data, error } = await supabase
      .from('sectors')
      .upsert(sector)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSector(sectorId) {
    checkClient();
    const { error } = await supabase
      .from('sectors')
      .delete()
      .eq('id', sectorId);
    if (error) throw error;
  },

  // Equipment
  async getEquipment(sectorId = null) {
    checkClient();
    let query = supabase.from('equipment').select('*, sectors(name, floor)');
    if (sectorId) {
      query = query.eq('sector_id', sectorId);
    }
    const { data, error } = await query.order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async upsertEquipment(equipment) {
    checkClient();
    const { data, error } = await supabase
      .from('equipment')
      .upsert(equipment)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteEquipment(equipmentId) {
    checkClient();
    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', equipmentId);
    if (error) throw error;
  },

  // Maintenance Logs
  async getMaintenanceLogs(equipmentId) {
    checkClient();
    const { data, error } = await supabase
      .from('maintenance_logs')
      .select('*, profiles(name)')
      .eq('equipment_id', equipmentId)
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createMaintenanceLog(log) {
    checkClient();
    const { data, error } = await supabase
      .from('maintenance_logs')
      .insert(log)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Logistics: Supplies
  async getSupplies() {
    checkClient();
    const { data, error } = await supabase
      .from('supplies')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async upsertSupply(supply) {
    checkClient();
    const { data, error } = await supabase
      .from('supplies')
      .upsert({ ...supply, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteSupply(supplyId) {
    checkClient();
    const { error } = await supabase
      .from('supplies')
      .delete()
      .eq('id', supplyId);
    if (error) throw error;
  },

  // Logistics: Movements
  async getMovements() {
    checkClient();
    const { data, error } = await supabase
      .from('equipment_movements')
      .select('*, equipment(name, serial_number), from_sector:from_sector_id(name), to_sector:to_sector_id(name), profiles:user_id(name)')
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createMovement(movement) {
    checkClient();
    const { data, error } = await supabase
      .from('equipment_movements')
      .insert(movement)
      .select()
      .single();
    if (error) throw error;
    return data;
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
