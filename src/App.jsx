import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Ponto from './components/Ponto';
import Chamados from './components/Chamados';
import Historico from './components/Historico';
import Relatorio from './components/Relatorio';
import Inventory from './components/Inventory';
import { StopShiftModal, TicketModal, ProfileModal, LogDetailModal } from './components/Modals';
import { validarCPF } from './lib/utils';
import { supabase } from './lib/supabase';
import { supabaseService } from './lib/supabaseService';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('ponto');
  const [logs, setLogs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState(null);
  const [currentShiftId, setCurrentShiftId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modals, setModals] = useState({
    stop: false,
    ticket: false,
    profile: false,
    logDetail: false,
  });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);

  // Auth Listener
  useEffect(() => {
    console.log('App initialized. Supabase client:', supabase);
    if (supabase) {
      console.log('Supabase keys:', Object.keys(supabase));
      console.log('Supabase auth property:', supabase.auth);
      console.log('Supabase auth type:', typeof supabase.auth);
      if (supabase.auth) {
        console.log('Supabase auth keys:', Object.keys(supabase.auth));
      }
    }
    if (!supabase || !supabase.auth || typeof supabase.auth.onAuthStateChanged !== 'function') {
      console.error('Supabase auth or onAuthStateChanged is missing! Client:', supabase);
      setLoading(false);
      return;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChanged(async (event, session) => {
      if (session) {
        const u = session.user;
        setUser(u);
        await loadUserData(u.id);
      } else {
        setUser(null);
        setProfile(null);
        setLogs([]);
        setTickets([]);
        setIsWorking(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    try {
      const [p, l, t, s, e] = await Promise.all([
        supabaseService.getProfile(userId),
        supabaseService.getLogs(userId),
        supabaseService.getTickets(userId),
        supabaseService.getActiveShift(userId),
        supabaseService.getEquipment()
      ]);

      const logsWithTickets = (l || []).map(log => ({
        ...log,
        tickets: (t || []).filter(ticket => ticket.ponto_id === log.id)
      }));

      setProfile(p || { name: '', cpf: '', cargo: '', email: user?.email || '' });
      setLogs(logsWithTickets);
      setTickets(t || []);
      setEquipment(e || []);
      
      if (s) {
        setIsWorking(true);
        setShiftStartTime(new Date(s.start_time));
        setCurrentShiftId(s.id);
      } else {
        setIsWorking(false);
        setShiftStartTime(null);
        setCurrentShiftId(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleLogin = async (u) => {
    // If it's a demo account, we might need to handle it differently 
    // but for now let's assume standard Supabase Auth
    setUser(u);
    await loadUserData(u.id);
  };

  const handleLogout = async () => {
    if (isWorking) return alert('Encerre o turno antes de sair');
    await supabaseService.signOut();
    setModals({ ...modals, profile: false });
  };

  const startShift = async () => {
    if (!user) return;
    try {
      const shift = await supabaseService.startShift(user.id);
      setIsWorking(true);
      setShiftStartTime(new Date(shift.start_time));
      setCurrentShiftId(shift.id);
    } catch (error) {
      alert('Erro ao iniciar turno: ' + error.message);
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

      // Link active tickets to this log
      await supabaseService.linkTicketsToLog(user.id, newLog.id);

      await supabaseService.endShift(user.id);
      await loadUserData(user.id);
      
      setIsWorking(false);
      setShiftStartTime(null);
      setCurrentShiftId(null);
      setModals({ ...modals, stop: false });
    } catch (error) {
      alert('Erro ao encerrar turno: ' + error.message);
    }
  };

  const saveTicket = async (data) => {
    if (!user) return;
    const now = new Date();
    
    try {
      const ticketData = {
        ...data,
        user_id: user.id,
        is_active: data.id ? (data.is_active ?? true) : true, // New tickets are active by default
        ponto_id: data.ponto_id || null,
        date: data.date || now.toISOString().split('T')[0],
        date_display: data.date_display || now.toLocaleDateString('pt-BR'),
        hora: data.hora || now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      if (selectedTicket) {
        ticketData.id = selectedTicket.id;
      }

      await supabaseService.upsertTicket(ticketData);
      await loadUserData(user.id);
      setModals({ ...modals, ticket: false });
      setSelectedTicket(null);
    } catch (error) {
      alert('Erro ao salvar chamado: ' + error.message);
    }
  };

  const deleteTicket = async (id) => {
    if (!user) return;
    if (!confirm('Deseja excluir este chamado?')) return;
    try {
      await supabaseService.deleteTicket(id);
      await loadUserData(user.id);
    } catch (error) {
      alert('Erro ao excluir chamado: ' + error.message);
    }
  };

  const saveProfile = async (p) => {
    if (!user) return;
    if (p.cpf && !validarCPF(p.cpf)) return alert('CPF inválido');
    
    try {
      await supabaseService.upsertProfile({ ...p, id: user.id });
      setProfile(p);
      setModals({ ...modals, profile: false });
    } catch (error) {
      alert('Erro ao salvar perfil: ' + error.message);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-12 h-12 border-4 border-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user || !profile) return <Auth onLogin={handleLogin} />;

  return (
    <Layout 
      user={user} 
      profile={profile} 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onOpenProfile={() => setModals({ ...modals, profile: true })}
    >
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
        <Inventory user={user} />
      )}

      {activeTab === 'chamados' && (
        <Chamados 
          tickets={tickets}
          onNewTicket={() => { setSelectedTicket(null); setModals({ ...modals, ticket: true }); }}
          onEditTicket={(t) => { setSelectedTicket(t); setModals({ ...modals, ticket: true }); }}
          onDeleteTicket={deleteTicket}
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
    </Layout>
  );
}
