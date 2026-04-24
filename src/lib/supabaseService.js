import { supabase, getAdminClient } from './supabase';

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

  async adminCreateUser(email, password, metadata) {
    checkClient();
    const adminClient = getAdminClient();
    // Uses a separate client instance so it doesn't log the admin out
    const { data, error } = await adminClient.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    if (error) throw error;
    
    // Create the profile for the new user immediately
    if (data?.user?.id) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: email,
        name: metadata.name || email.split('@')[0],
        role: metadata.role || 'colaborador',
        cargo: metadata.cargo || ''
      });
      if (profileError) console.error("Error creating profile for new user:", profileError);
    }
    
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
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getAllProfiles() {
    checkClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name') // ONLY select non-sensitive data
      .order('name', { ascending: true });
    if (error) throw error;
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
  async getLogs(userId, limit = 100) {
    checkClient();
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
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
  async getTickets(userId, role, limit = 500) {
    checkClient();
    let query = supabase.from('tickets').select('*').order('created_at', { ascending: false }).limit(limit);
    
    if (role !== 'admin_sistema' && role !== 'admin_ti' && role !== 'tecnico_ti') {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
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
    const dataToSave = { ...ticket };
    
    // Se estiver resolvendo agora, salva o timestamp real para o SLA
    if (ticket.status === 'resolved' && !ticket.resolved_at) {
      dataToSave.resolved_at = new Date().toISOString();
    }

    // Se não tem ID, é um chamado novo (INSERT)
    if (!dataToSave.id || dataToSave.id === "") {
      delete dataToSave.id;
      const { error } = await supabase
        .from('tickets')
        .insert(dataToSave);
        
      if (error) {
        console.error("VerdeIT: Supabase insert error:", error);
        throw error;
      }
      return true;
    } else {
      // Se tem ID, é uma edição (UPDATE)
      const ticketId = dataToSave.id;
      // Remover campos que não devem ser atualizados diretamente se necessário, mas aqui mandamos o objeto todo
      const { error } = await supabase
        .from('tickets')
        .update(dataToSave)
        .eq('id', ticketId);

      if (error) {
        console.error("VerdeIT: Supabase update error:", error);
        throw error;
      }
      return true;
    }
  },

  async uploadTicketPhoto(file) {
    checkClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `tickets/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('ticket-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('ticket-photos')
      .getPublicUrl(filePath);

    return data.publicUrl;
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

  async getTicketsByEquipment(equipmentId) {
    checkClient();
    const { data, error } = await supabase
      .from('tickets')
      .select('*, profiles(name)')
      .eq('equipment_id', equipmentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
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
      .select('*, equipment(name, serial_number), from_sector:from_sector_id(name), to_sector:to_sector_id(name), user:profiles!user_id(name)')
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

  // Wiki
  async getWikiArticles() {
    checkClient();
    const { data, error } = await supabase
      .from('wiki_articles')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async upsertWikiArticle(article) {
    checkClient();
    const { data, error } = await supabase
      .from('wiki_articles')
      .upsert({ ...article, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteWikiArticle(articleId) {
    checkClient();
    const { error } = await supabase
      .from('wiki_articles')
      .delete()
      .eq('id', articleId);
    if (error) throw error;
  },

  // Active Shift
  async getActiveShift(userId) {
    checkClient();
    const { data, error } = await supabase
      .from('active_shifts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async startShift(userId, location = null) {
    checkClient();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('active_shifts')
      .insert({ user_id: userId, start_time: now, location: location })
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
