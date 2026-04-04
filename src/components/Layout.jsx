import React from 'react';
import { motion } from 'motion/react';
import { Clock, ClipboardList, Calendar, FileText, User as UserIcon, Monitor, Home, Package, Cpu } from 'lucide-react';

export default function Layout({ user, profile, activeTab, setActiveTab, onOpenProfile, children }) {
  const navDate = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  const navItems = [
    { id: 'home', icon: <Home size={18} />, label: 'Início' },
    { id: 'ponto', icon: <Clock size={18} />, label: 'Ponto' },
    { id: 'inventario', icon: <Monitor size={18} />, label: 'Inventário' },
    { id: 'logistica', icon: <Package size={18} />, label: 'Logística' },
    { id: 'chamados', icon: <ClipboardList size={18} />, label: 'Chamados' },
    { id: 'relatorio', icon: <FileText size={18} />, label: 'Relatório' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg text-text">
      {/* Sidebar - Desktop/Tablet */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border sticky top-0 h-screen z-[100]">
        <div className="p-6 border-b border-border">
          <div className="font-display font-bold text-[1.2rem] tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green to-[#00ffa3] rounded-lg flex items-center justify-center shadow-lg shadow-green/20">
              <Cpu className="text-bg" size={16} strokeWidth={2.5} />
            </div>
            Verde<span className="text-green">IT</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-green/10 text-green border border-green/20 shadow-[0_0_15px_rgba(0,200,150,0.1)]' 
                  : 'text-text-muted hover:text-text hover:bg-surface2'
              }`}
            >
              <div className={activeTab === item.id ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button 
            onClick={onOpenProfile}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center border border-border group-hover:border-green/50 transition-all">
              <UserIcon size={16} />
            </div>
            <div className="text-left overflow-hidden">
              <div className="text-xs font-bold truncate">{profile?.name || user?.email?.split('@')[0]}</div>
              <div className="text-[0.6rem] text-text-muted truncate">Ver Perfil</div>
            </div>
          </button>
        </div>
      </aside>

      {/* Header - Mobile Only */}
      <nav className="md:hidden sticky top-0 z-[100] bg-[rgba(10,15,13,0.85)] backdrop-blur-2xl border-b border-border p-3 px-4 flex items-center justify-between">
        <div className="font-display font-bold text-[1.1rem] tracking-tight flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-green to-[#00ffa3] rounded-lg flex items-center justify-center shadow-lg shadow-green/20">
            <Cpu className="text-bg" size={14} strokeWidth={2.5} />
          </div>
          Verde<span className="text-green">IT</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.7rem] text-text-muted font-mono uppercase">{navDate}</span>
          <button 
            onClick={onOpenProfile}
            className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
          >
            <UserIcon size={16} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Bar (Optional, for date/extra info) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border bg-surface/30 backdrop-blur-sm">
          <div className="text-xs font-mono text-text-muted uppercase tracking-widest">
            {activeTab.replace('_', ' ')} / {navDate}
          </div>
          <div className="flex items-center gap-4">
            {/* Add any global actions here */}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-[rgba(17,25,22,0.95)] backdrop-blur-3xl border-t border-border grid grid-cols-6 pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center p-2.5 gap-1 text-[0.55rem] font-sans transition-colors ${activeTab === item.id ? 'text-green' : 'text-text-muted'}`}
          >
            <div className={activeTab === item.id ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''}>
              {item.icon}
            </div>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
