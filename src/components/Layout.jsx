import React, { useState } from 'react';
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
  History
} from 'lucide-react';

export default function Layout({ user, profile, activeTab, setActiveTab, enabledModules, onOpenProfile, children }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const navDate = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const allNavItems = [
    { id: 'home', icon: <Home size={18} />, label: 'Início' },
    { id: 'ponto', icon: <Clock size={18} />, label: 'Ponto' },
    { id: 'inventario', icon: <Monitor size={18} />, label: 'Inventário' },
    { id: 'logistica', icon: <Package size={18} />, label: 'Logística' },
    { id: 'chamados', icon: <ClipboardList size={18} />, label: 'Chamados' },
    { id: 'historico', icon: <History size={18} />, label: 'Histórico' },
    { id: 'relatorio', icon: <FileText size={18} />, label: 'Relatório' },
    { id: 'admin', icon: <Settings size={18} />, label: 'Administrativo' },
    { id: 'tutorial', icon: <BookOpen size={18} />, label: 'Tutorial' },
  ];

  const navItems = allNavItems.filter(item => enabledModules[item.id] !== false);

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
      {isMobileMenuOpen && (
        <>
          <div 
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/80 z-[150] md:hidden"
          />
          <aside
            className="fixed top-0 left-0 bottom-0 w-[280px] bg-surface z-[200] md:hidden flex flex-col border-r border-border shadow-2xl"
          >
            <NavContent mobile />
          </aside>
        </>
      )}

      {/* Header - Mobile/Tablet Portrait Only */}
      <nav className="md:hidden sticky top-0 z-[100] bg-bg border-b border-border p-3 px-4 flex items-center justify-between">
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
            onClick={onOpenProfile}
            className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
          >
            <UserIcon size={18} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Top Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border bg-surface shrink-0">
          <div className="text-xs font-mono text-text-muted uppercase tracking-widest flex items-center gap-2">
            <span className="text-green/50">#</span> {activeTab.replace('_', ' ')} <span className="opacity-30 mx-2">|</span> {navDate}
          </div>
          <div className="flex items-center gap-4">
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
        <div className="flex overflow-x-auto hide-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-shrink-0 flex flex-col items-center justify-center p-2.5 min-w-[72px] gap-1 text-[0.6rem] font-sans transition-colors ${activeTab === item.id ? 'text-green' : 'text-text-muted'}`}
            >
              <div className={activeTab === item.id ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''}>
                {item.icon}
              </div>
              <span className="truncate w-full text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
