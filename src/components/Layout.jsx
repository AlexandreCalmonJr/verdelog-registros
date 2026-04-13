import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Omnisearch from './Omnisearch';
import { 
  Clock, 
  ClipboardList, 
  Calendar, 
  FileText, 
  User as UserIcon, 
  Monitor, 
  Home, 
  Package, 
  Cpu,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  BookOpen,
  History,
  Bell,
  Sun,
  Moon
} from 'lucide-react';

export default function Layout({ user, profile, activeTab, setActiveTab, enabledModules, onOpenProfile, tickets, equipment, onSelectSearchResult, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('verdeit_theme') || 'dark');
  const bottomNavRef = useRef(null);
  
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('verdeit_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navDate = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  // Compute Notifications
  const notifications = React.useMemo(() => {
    if (!tickets) return [];
    const notifs = [];
    const now = new Date();
    
    tickets.forEach(t => {
      if (t.status === 'resolved') return;
      
      const start = new Date(t.created_at);
      const diffHrs = (now - start) / (1000 * 60 * 60);
      
      // SLA Breach logic
      const slaLimits = { critical: 4, high: 8, medium: 24, low: 48 };
      const limitHrs = slaLimits[t.priority] || 24;
      
      if (diffHrs > limitHrs) {
        notifs.push({
          id: `sla-${t.id}`,
          type: 'danger',
          title: 'SLA Estourado',
          message: `O chamado #${t.id} (${t.cliente}) ultrapassou o limite de tempo.`,
          ticket: t
        });
      } else if (diffHrs > limitHrs * 0.75) {
        notifs.push({
          id: `warn-${t.id}`,
          type: 'warning',
          title: 'SLA em Risco',
          message: `O chamado #${t.id} está próximo do limite de tempo.`,
          ticket: t
        });
      }
      
      // New ticket (last 2 hours)
      if (diffHrs < 2 && t.status === 'open') {
        notifs.push({
          id: `new-${t.id}`,
          type: 'info',
          title: 'Novo Chamado',
          message: `Chamado #${t.id} aberto recentemente por ${t.requester || t.cliente}.`,
          ticket: t
        });
      }
    });
    
    return notifs.sort((a, b) => {
      const weight = { danger: 3, warning: 2, info: 1 };
      return weight[b.type] - weight[a.type];
    });
  }, [tickets]);

  // Scroll active item into view on bottom nav
  useEffect(() => {
    if (activeTab && bottomNavRef.current) {
      const activeElement = bottomNavRef.current.querySelector(`[data-id="${activeTab}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const allNavItems = [
    { id: 'home', icon: <Home size={18} />, label: 'Início' },
    { id: 'ponto', icon: <Clock size={18} />, label: 'Ponto' },
    { id: 'inventario', icon: <Monitor size={18} />, label: 'Inventário', roles: ['admin_sistema', 'admin_ti', 'tecnico_ti'] },
    { id: 'logistica', icon: <Package size={18} />, label: 'Logística', roles: ['admin_sistema', 'admin_ti', 'tecnico_ti'] },
    { id: 'chamados', icon: <ClipboardList size={18} />, label: 'Chamados' },
    { id: 'historico', icon: <History size={18} />, label: 'Histórico' },
    { id: 'relatorio', icon: <FileText size={18} />, label: 'Relatório', roles: ['admin_sistema', 'admin_ti'] },
    { id: 'wiki', icon: <BookOpen size={18} />, label: 'Wiki' },
    { id: 'admin', icon: <Settings size={18} />, label: 'Administrativo', roles: ['admin_sistema', 'admin_ti'] },
    { id: 'tutorial', icon: <BookOpen size={18} />, label: 'Tutorial' },
  ];

  const navItems = allNavItems.filter(item => {
    if (enabledModules[item.id] === false) return false;
    if (item.roles && !item.roles.includes(profile?.role)) return false;
    return true;
  });

  const NavContent = ({ mobile = false }) => (
    <>
      <div className={`p-4 border-b border-border flex items-center ${isCollapsed && !mobile ? 'justify-center' : 'justify-between'}`}>
        <div className={`font-display font-bold text-[1.2rem] tracking-tight flex items-center gap-2 ${isCollapsed && !mobile ? 'hidden' : 'flex'}`}>
          <div className="w-8 h-8 bg-gradient-to-br from-green to-[#00ffa3] rounded-lg flex items-center justify-center shadow-lg shadow-green/20 shrink-0">
            <Cpu className="text-bg" size={16} strokeWidth={2.5} />
          </div>
          Verde<span className="text-green">IT</span>
        </div>
        
        {isCollapsed && !mobile && (
          <div className="w-8 h-8 bg-gradient-to-br from-green to-[#00ffa3] rounded-lg flex items-center justify-center shadow-lg shadow-green/20">
            <Cpu className="text-bg" size={16} strokeWidth={2.5} />
          </div>
        )}

        {!mobile && (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-surface2 text-text-muted transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}
        
        {mobile && (
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-surface2 text-text-muted"
          >
            <X size={20} />
          </button>
        )}
      </div>
      
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              if (mobile) setIsMobileMenuOpen(false);
            }}
            title={isCollapsed && !mobile ? item.label : ''}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group ${
              activeTab === item.id 
                ? 'bg-green/10 text-green border border-green/20 shadow-[0_0_15px_rgba(0,200,150,0.1)]' 
                : 'text-text-muted hover:text-text hover:bg-surface2'
            } ${isCollapsed && !mobile ? 'justify-center px-0' : ''}`}
          >
            <div className={`${activeTab === item.id ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : 'group-hover:scale-110 transition-transform'}`}>
              {item.icon}
            </div>
            <span className={`${isCollapsed && !mobile ? 'hidden' : 'block'} truncate`}>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button 
          onClick={() => {
            onOpenProfile();
            if (mobile) setIsMobileMenuOpen(false);
          }}
          className={`w-full flex items-center gap-3 p-2.5 rounded-xl border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all group ${isCollapsed && !mobile ? 'justify-center px-0 border-none' : ''}`}
        >
          <div className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center border border-border group-hover:border-green/50 transition-all shrink-0">
            <UserIcon size={18} />
          </div>
          <div className={`text-left overflow-hidden ${isCollapsed && !mobile ? 'hidden' : 'block'}`}>
            <div className="text-xs font-bold truncate">{profile?.name || user?.email?.split('@')[0]}</div>
            <div className="text-[0.6rem] text-text-muted truncate">Meu Perfil</div>
          </div>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text overflow-hidden">
      {/* Sidebar - Desktop/Tablet Landscape */}
      <aside 
        className={`hidden md:flex flex-col bg-surface border-r border-border sticky top-0 h-screen z-[100] transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <NavContent />
      </aside>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 z-[150] md:hidden backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-surface z-[200] md:hidden flex flex-col border-r border-border shadow-2xl"
            >
              <NavContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Header - Mobile/Tablet Portrait Only */}
      <nav className="md:hidden sticky top-0 z-[100] bg-bg border-b border-border p-3 px-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-surface2 text-text transition-colors"
            >
              <Menu size={22} />
            </button>
            <div className="font-display font-bold text-[1.1rem] tracking-tight flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-green to-[#00ffa3] rounded-lg flex items-center justify-center shadow-lg shadow-green/20">
                <Cpu className="text-bg" size={14} strokeWidth={2.5} />
              </div>
              Verde<span className="text-green">IT</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[0.7rem] text-text-muted font-mono uppercase">{navDate}</span>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all relative"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-[0.55rem] font-bold flex items-center justify-center rounded-full border-2 border-bg">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-[200]"
                  >
                    <div className="p-3 border-b border-border bg-surface2/50 flex items-center justify-between">
                      <h4 className="font-bold text-sm">Notificações</h4>
                      <span className="text-[0.65rem] bg-surface2 px-2 py-0.5 rounded text-text-muted">{notifications.length}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-text-muted text-sm">Nenhuma notificação no momento.</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setShowNotifications(false);
                              onSelectSearchResult({ type: 'ticket', data: n.ticket });
                            }}
                            className="p-3 border-b border-border/50 hover:bg-surface2 cursor-pointer transition-colors"
                          >
                            <div className={`text-[0.7rem] font-bold uppercase tracking-wider mb-1 ${
                              n.type === 'danger' ? 'text-red' : 
                              n.type === 'warning' ? 'text-amber' : 'text-blue'
                            }`}>
                              {n.title}
                            </div>
                            <div className="text-xs text-text-dim leading-relaxed">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              onClick={onOpenProfile}
              className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
            >
              <UserIcon size={18} />
            </button>
          </div>
        </div>
        <div className="w-full">
          <Omnisearch tickets={tickets} equipment={equipment} onSelectResult={onSelectSearchResult} />
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border bg-surface shrink-0 gap-8">
          <div className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center gap-2 shrink-0">
            <span className="text-green/50">#</span> {activeTab.replace('_', ' ')} <span className="opacity-30 mx-2">|</span> {navDate}
          </div>
          
          <div className="flex-1 flex justify-center max-w-2xl">
            <Omnisearch tickets={tickets} equipment={equipment} onSelectResult={onSelectSearchResult} />
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all relative"
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red text-white text-[0.55rem] font-bold flex items-center justify-center rounded-full border-2 border-bg">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              
              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-80 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-[200]"
                  >
                    <div className="p-3 border-b border-border bg-surface2/50 flex items-center justify-between">
                      <h4 className="font-bold text-sm">Notificações</h4>
                      <span className="text-[0.65rem] bg-surface2 px-2 py-0.5 rounded text-text-muted">{notifications.length}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-text-muted text-sm">Nenhuma notificação no momento.</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => {
                              setShowNotifications(false);
                              onSelectSearchResult({ type: 'ticket', data: n.ticket });
                            }}
                            className="p-3 border-b border-border/50 hover:bg-surface2 cursor-pointer transition-colors"
                          >
                            <div className={`text-[0.7rem] font-bold uppercase tracking-wider mb-1 ${
                              n.type === 'danger' ? 'text-red' : 
                              n.type === 'warning' ? 'text-amber' : 'text-blue'
                            }`}>
                              {n.title}
                            </div>
                            <div className="text-xs text-text-dim leading-relaxed">{n.message}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="text-[0.7rem] bg-surface2 px-3 py-1.5 rounded-full border border-border text-text-muted font-medium">
              Sessão Ativa: {profile?.name || user?.email}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[rgba(17,25,22,0.95)] backdrop-blur-3xl border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="relative">
          {/* Left Fade */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[rgba(17,25,22,0.95)] to-transparent z-10 pointer-events-none" />
          
          <div 
            ref={bottomNavRef}
            className="flex overflow-x-auto hide-scrollbar scroll-smooth px-4"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                data-id={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-shrink-0 flex flex-col items-center justify-center p-2.5 min-w-[72px] gap-1 text-[0.6rem] font-sans transition-all relative active:scale-95 ${activeTab === item.id ? 'text-green' : 'text-text-muted'}`}
              >
                {activeTab === item.id && (
                  <motion.div 
                    layoutId="bottomNavIndicator"
                    className="absolute inset-x-2 top-1 bottom-1 bg-green/10 rounded-xl -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className={`transition-all duration-300 ${activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(0,200,150,0.6)] scale-110' : 'scale-100'}`}>
                  {item.icon}
                </div>
                <span className={`truncate w-full text-center transition-all ${activeTab === item.id ? 'font-bold' : 'font-normal opacity-80'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Right Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[rgba(17,25,22,0.95)] to-transparent z-10 pointer-events-none" />
        </div>
      </nav>
    </div>
  );
}
