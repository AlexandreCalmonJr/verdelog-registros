import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import Auth from './components/Auth';
import Layout from './components/Layout';
import { validarCPF } from './lib/utils';
import { supabase } from './lib/supabase';
import { supabaseService } from './lib/supabaseService';

// Standard imports instead of lazy to prevent Vercel chunk 404 errors
import Home from './components/Home';
import Ponto from './components/Ponto';
import Chamados from './components/Chamados';
import Historico from './components/Historico';
import Relatorio from './components/Relatorio';
import Inventory from './components/Inventory';
import Logistics from './components/Logistics';
import Admin from './components/Admin';
import Tutorial from './components/Tutorial';
import Wiki from './components/Wiki';
import ClientPortal from './components/ClientPortal';

// Modals
import { StopShiftModal, TicketModal, ProfileModal, LogDetailModal } from './components/Modals';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('verdeit_active_tab') || 'home';
  });

  useEffect(() => {
    localStorage.setItem('verdeit_active_tab', activeTab);
  }, [activeTab]);

  const [logs, setLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [activeShiftsCount, setActiveShiftsCount] = useState(0);
  const [assignedEquipment, setAssignedEquipment] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const ticketLimitRef = useRef(20);
  const [hasMoreTickets, setHasMoreTickets] = useState(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Module Visibility State
  const [enabledModules, setEnabledModules] = useState(() => {
    const saved = localStorage.getItem('verdeit_modules');
    return saved ? JSON.parse(saved) : {
      home: true,
      ponto: true,
      inventario: true,
      logistica: true,
      chamados: true,
      historico: true,
      relatorio: true,
      wiki: true,
      admin: true,
      tutorial: true
    };
  });

  useEffect(() => {
    localStorage.setItem('verdeit_modules', JSON.stringify(enabledModules));
  }, [enabledModules]);

  const toggleModule = (moduleId) => {
    setEnabledModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Modal States
  const [modals, setModals] = useState({
    stop: false,
    ticket: false,
    profile: false,
    logDetail: false,
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Offline Sync Listener
  useEffect(() => {
    const handleOnline = async () => {
      const offlineQueue = JSON.parse(localStorage.getItem('verdeit_offline_tickets') || '[]');
      if (offlineQueue.length > 0) {
        showToast(`Sincronizando ${offlineQueue.length} chamados offline...`, 'info');
        try {
          for (const ticket of offlineQueue) {
            const dataToSave = { ...ticket };
            if (dataToSave.id && dataToSave.id.startsWith('temp_')) {
              delete dataToSave.id;
            }
            await supabaseService.upsertTicket(dataToSave);
          }
          localStorage.removeItem('verdeit_offline_tickets');
          if (user) await loadUserData(user);
          showToast('Sincronização offline concluída!', 'success');
        } catch (err) {
          console.error("Offline sync failed", err);
          showToast('Erro ao sincronizar chamados offline.', 'error');
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [user]);

  // Auth Listener — uses Supabase v2 onAuthStateChange
  useEffect(() => {
    if (!supabase || !supabase.auth || typeof supabase.auth.onAuthStateChange !== 'function') {
      setLoading(false);
      return;
    }

    // Get initial session on load (crucial for PWA/refresh persistence)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error getting session:", error);
        setLoading(false);
      } else if (session) {
        setUser(session.user);
        loadUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth state changes (Supabase v2: onAuthStateChange)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session) {
          setUser(session.user);
          await loadUserData(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setLogs([]);
        setTickets([]);
        setIsWorking(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime Updates Listener
  useEffect(() => {
    if (!user) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          if (payload.table === 'tickets' && payload.eventType === 'INSERT') {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Novo Chamado', {
                body: `Chamado #${payload.new.ref} aberto por ${payload.new.requester || 'Usuário'}`,
                icon: '/favicon.svg'
              });
            }
          }
          loadUserData(user);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadUserData = async (authUser) => {
    if (!authUser) return;
    const userId = authUser.id;
    try {
      let [p, s] = await Promise.all([
        supabaseService.getProfile(userId).catch(e => { console.error("Error fetching profile:", e); return null; }),
        supabaseService.getActiveShift(userId).catch(e => { console.error("Error fetching shift:", e); return null; })
      ]);

      if (authUser?.email?.toLowerCase() === 'alexandrecalmonjunior@gmail.com' && p?.role !== 'admin_sistema') {
        try {
          p = await supabaseService.upsertProfile({ 
            ...p, 
            id: userId, 
            role: 'admin_sistema', 
            email: authUser.email,
            name: p?.name || 'Alexandre Calmon',
            cargo: p?.cargo || 'Administrador'
          });
        } catch (e) {
          console.error("Failed to auto-promote user", e);
        }
      }

      setProfile(p || { name: '', cpf: '', cargo: '', email: authUser?.email || '' });
      
      if (s) {
        setIsWorking(true);
        setShiftStartTime(new Date(s.start_time));
        setCurrentShiftId(s.id);
      } else {
        setIsWorking(false);
        setShiftStartTime(null);
        setCurrentShiftId(null);
      }

      const [l, t, e, sec] = await Promise.all([
        supabaseService.getLogs(userId).catch(e => { console.error("Error fetching logs:", e); return []; }),
        supabaseService.getTickets(userId, p?.role, ticketLimitRef.current).catch(e => { console.error("Error fetching tickets:", e); return []; }),
        supabaseService.getEquipment().catch(e => { console.error("Error fetching equipment:", e); return []; }),
        supabaseService.getSectors().catch(e => { console.error("Error fetching sectors:", e); return []; })
      ]);

      const logsWithTickets = (l || []).map(log => ({
        ...log,
        tickets: (t || []).filter(ticket => ticket.ponto_id === log.id)
      }));

      setLogs(logsWithTickets);
      setTickets(t || []);
      setHasMoreTickets((t || []).length === ticketLimitRef.current);
      setEquipment(e || []);
      setSectors(sec || []);

      const assigned = (e || []).filter(item => 
        item.assigned_user_id === userId || 
        (item.assigned_user_name && item.assigned_user_name.toLowerCase() === p?.name?.toLowerCase())
      );
      setAssignedEquipment(assigned);
      
      const { count } = await supabase
        .from('active_shifts')
        .select('*', { count: 'exact', head: true })
        .catch(e => { console.error("Error fetching active shifts count:", e); return { count: 0 }; });
      setActiveShiftsCount(count || 0);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (u) => {
    setUser(u);
    ticketLimitRef.current = 20;
    await loadUserData(u);
  };

  const loadMoreTickets = async () => {
    ticketLimitRef.current += 20;
    await loadUserData(user);
  };

  const handleLogout = async () => {
    if (isWorking) return showToast('Encerre o turno antes de sair', 'error');
    await supabaseService.signOut();
    setModals({ ...modals, profile: false });
  };

  const startShift = async () => {
    if (!user) return;
    
    let location = null;
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = `${position.coords.latitude},${position.coords.longitude}`;
      } catch (err) {
        console.warn("Geolocation not available or denied:", err);
      }
    }

    try {
      const shift = await supabaseService.startShift(user.id, location);
      setIsWorking(true);
      setShiftStartTime(new Date(shift.start_time));
      setCurrentShiftId(shift.id);
      showToast('Turno iniciado com sucesso!');
    } catch (error) {
      showToast('Erro ao iniciar turno: ' + error.message, 'error');
    }
  };

  const confirmStopShift = async (summary) => {
    if (!summary || !shiftStartTime || !user) return;
    const now = new Date();
    const totalH = (now.getTime() - shiftStartTime.getTime()) / 3600000;
    
    try {
      const newLog = await supabaseService.createLog({
        user_id: user.id,
        date: now.toLocaleDateString('pt-BR'),
        date_iso: now.toISOString().split('T')[0],
        hora_inicio: shiftStartTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        hora_fim: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        resumo: summary,
        total_horas: Math.round(totalH * 100) / 100,
      });

      await supabaseService.linkTicketsToLog(user.id, newLog.id);
      await supabaseService.endShift(user.id);
      await loadUserData(user);
      
      setIsWorking(false);
      setShiftStartTime(null);
      setCurrentShiftId(null);
      setModals({ ...modals, stop: false });
      showToast('Turno encerrado com sucesso!');
    } catch (error) {
      showToast('Erro ao encerrar turno: ' + error.message, 'error');
    }
  };

  const saveTicket = async (data) => {
    if (!user) return;
    const now = new Date();
    
    try {
      let dateDisplay = now.toLocaleDateString('pt-BR');
      if (data.date) {
        const [year, month, day] = data.date.split('-');
        if (year && month && day) {
          dateDisplay = `${day}/${month}/${year}`;
        }
      }

      const ticketData = {
        ...data,
        user_id: user.id,
        is_active: data.status === 'resolved' ? false : (data.id ? (data.is_active ?? true) : true),
        ponto_id: data.ponto_id || null,
        equipment_id: data.equipment_id || null,
        date: data.date || now.toISOString().split('T')[0],
        date_display: dateDisplay,
        hora: data.hora || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      if (data.status === 'resolved' && !data.data_fim) {
        ticketData.data_fim = now.toLocaleDateString('pt-BR');
        ticketData.hora_fim = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }

      if (selectedTicket) {
        ticketData.id = selectedTicket.id;
      }

      if (!navigator.onLine) {
        const offlineQueue = JSON.parse(localStorage.getItem('verdeit_offline_tickets') || '[]');
        if (!ticketData.id) {
          ticketData.id = 'temp_' + Date.now();
          ticketData.ref = 'OFF-' + Math.floor(Math.random() * 1000);
        }
        offlineQueue.push(ticketData);
        localStorage.setItem('verdeit_offline_tickets', JSON.stringify(offlineQueue));
        
        setTickets(prev => {
          const exists = prev.find(t => t.id === ticketData.id);
          if (exists) return prev.map(t => t.id === ticketData.id ? ticketData : t);
          return [ticketData, ...prev];
        });
        
        setModals({ ...modals, ticket: false });
        setSelectedTicket(null);
        showToast('Salvo offline. Será sincronizado quando houver conexão.', 'warning');
        return;
      }

      await supabaseService.upsertTicket(ticketData);
      await loadUserData(user);
      setModals({ ...modals, ticket: false });
      setSelectedTicket(null);
      showToast('Chamado salvo com sucesso!');
    } catch (error) {
      showToast('Erro ao salvar chamado: ' + error.message, 'error');
    }
  };

  const deleteTicket = async (id) => {
    if (!user) return;
    if (!confirm('Deseja excluir este chamado?')) return;
    try {
      await supabaseService.deleteTicket(id);
      await loadUserData(user);
      showToast('Chamado excluído!');
    } catch (error) {
      showToast('Erro ao excluir chamado: ' + error.message, 'error');
    }
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    await saveTicket({ ...ticket, status: newStatus });
  };

  const saveProfile = async (p) => {
    if (!user) return;
    if (p.cpf && !validarCPF(p.cpf)) return alert('CPF inválido');
    
    try {
      await supabaseService.upsertProfile({ ...p, id: user.id });
      setProfile(p);
      setModals({ ...modals, profile: false });
      showToast('Perfil atualizado!');
    } catch (error) {
      showToast('Erro ao salvar perfil: ' + error.message, 'error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-12 h-12 border-4 border-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || !profile) return <Auth onLogin={handleLogin} />;

  const stats = {
    equipmentCount: equipment.length,
    activeTickets: tickets.filter(t => t.is_active).length,
    sectorCount: sectors.length,
    activeShifts: activeShiftsCount
  };

  return (
    <Layout 
      user={user} 
      profile={profile} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      enabledModules={enabledModules}
      onOpenProfile={() => setModals({ ...modals, profile: true })}
      tickets={tickets}
      equipment={equipment}
      onSelectSearchResult={(result) => {
        if (result.type === 'ticket') {
          setActiveTab('chamados');
          setSelectedTicket(result.data);
          setModals({ ...modals, ticket: true });
        } else if (result.type === 'equipment') {
          setActiveTab('inventario');
        }
      }}
    >
      {activeTab === 'home' && (
        profile?.role === 'colaborador' || profile?.role === 'cliente' ? (
          <ClientPortal 
            user={user}
            profile={profile}
            tickets={tickets}
            onNewTicket={() => {
              setSelectedTicket(null);
              setModals({ ...modals, ticket: true });
            }}
            onEditTicket={(t) => {
              setSelectedTicket(t);
              setModals({ ...modals, ticket: true });
            }}
          />
        ) : (
          <Home 
            user={user} 
            onNavigate={setActiveTab} 
            stats={stats} 
            assignedEquipment={assignedEquipment}
            enabledModules={enabledModules}
            profile={profile}
            tickets={tickets}
          />
        )
      )}

      {activeTab === 'ponto' && (
        <Ponto 
          isWorking={isWorking}
          shiftStartTime={shiftStartTime}
          logs={logs}
          tickets={tickets}
          onStartShift={startShift}
          onStopShift={() => setModals({ ...modals, stop: true })}
          onNewTicket={() => { setSelectedTicket(null); setModals({ ...modals, ticket: true }); }}
          onViewLog={(log) => { setSelectedLog(log); setModals({ ...modals, logDetail: true }); }}
        />
      )}

      {activeTab === 'inventario' && (
        <Inventory 
          user={user} 
          profile={profile}
          onNewTicket={(equipId) => { 
            setSelectedTicket({ equipment_id: equipId }); 
            setModals({ ...modals, ticket: true }); 
          }} 
          showToast={showToast}
        />
      )}

      {activeTab === 'logistica' && (
        <Logistics user={user} profile={profile} />
      )}

      {activeTab === 'chamados' && (
        <Chamados 
          tickets={tickets}
          hasMoreTickets={hasMoreTickets}
          onLoadMore={loadMoreTickets}
          onNewTicket={() => { setSelectedTicket(null); setModals({ ...modals, ticket: true }); }}
          onEditTicket={(t) => { setSelectedTicket(t); setModals({ ...modals, ticket: true }); }}
          onDeleteTicket={deleteTicket}
          onUpdateTicketStatus={updateTicketStatus}
        />
      )}

      {activeTab === 'historico' && (
        <Historico 
          logs={logs}
          onViewLog={(log) => { setSelectedLog(log); setModals({ ...modals, logDetail: true }); }}
        />
      )}

      {activeTab === 'relatorio' && (
        <Relatorio 
          logs={logs}
          tickets={tickets}
          profile={profile}
        />
      )}

      {activeTab === 'wiki' && (
        <Wiki 
          user={user}
          showToast={showToast}
        />
      )}

      {activeTab === 'admin' && (
        <Admin 
          enabledModules={enabledModules}
          onToggleModule={toggleModule}
          profile={profile}
        />
      )}

      {activeTab === 'tutorial' && (
        <Tutorial />
      )}

      {/* Modals */}
      <StopShiftModal 
        isOpen={modals.stop} 
        onClose={() => setModals({ ...modals, stop: false })}
        onConfirm={confirmStopShift}
      />
      <TicketModal 
        isOpen={modals.ticket}
        onClose={() => setModals({ ...modals, ticket: false })}
        onSave={saveTicket}
        ticket={selectedTicket}
        equipment={equipment}
        profile={profile}
      />
      <ProfileModal 
        isOpen={modals.profile}
        onClose={() => setModals({ ...modals, profile: false })}
        onSave={saveProfile}
        onLogout={handleLogout}
        profile={profile}
        userEmail={user.email}
      />
      <LogDetailModal 
        isOpen={modals.logDetail}
        onClose={() => setModals({ ...modals, logDetail: false })}
        log={selectedLog}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 z-[1000] flex items-center justify-center"
          >
            <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${
              toast.type === 'error' 
                ? 'bg-red/10 border-red/20 text-red' 
                : 'bg-green/10 border-green/20 text-green'
            } backdrop-blur-xl min-w-[280px]`}>
              {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
              <span className="text-sm font-bold flex-1">{toast.message}</span>
              <button onClick={() => setToast(null)} className="p-1 hover:bg-white/10 rounded-lg">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}