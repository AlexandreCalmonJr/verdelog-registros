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
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-[100] bg-[rgba(10,15,13,0.85)] backdrop-blur-2xl border-b border-border p-3 px-4 flex items-center justify-between">
        <div className="font-display font-bold text-[1.2rem] tracking-tight flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green to-[#00ffa3] rounded-lg flex items-center justify-center shadow-lg shadow-green/20">
            <Cpu className="text-bg" size={16} strokeWidth={2.5} />
          </div>
          Verde<span className="text-green">IT</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[0.75rem] text-text-muted font-mono uppercase">{navDate}</span>
          <button 
            onClick={onOpenProfile}
            className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
          >
            <UserIcon size={18} />
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 pb-24 max-w-7xl mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[rgba(17,25,22,0.95)] backdrop-blur-3xl border-t border-border grid grid-cols-6 pb-[env(safe-area-inset-bottom)]">
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
