import React from 'react';
import { motion } from 'motion/react';
import { Clock, ClipboardList, Calendar, FileText, User as UserIcon, Monitor } from 'lucide-react';

export default function Layout({ user, profile, activeTab, setActiveTab, onOpenProfile, children }) {
  const navDate = new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

  return (
    <div className="flex flex-col min-h-screen">
      <nav className="sticky top-0 z-[100] bg-[rgba(10,15,13,0.85)] backdrop-blur-2xl border-b border-border p-3 px-4 flex items-center justify-between">
        <div className="font-display font-extrabold text-[1.1rem] text-green tracking-tight">
          Verde<span className="text-text-dim font-normal">IT</span>
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

      <main className="flex-1 p-4 pb-24 max-w-[800px] mx-auto w-full">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-[rgba(17,25,22,0.95)] backdrop-blur-3xl border-t border-border grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => setActiveTab('ponto')}
          className={`flex flex-col items-center p-2.5 gap-1 text-[0.6rem] font-sans transition-colors ${activeTab === 'ponto' ? 'text-green' : 'text-text-muted'}`}
        >
          <Clock size={20} className={activeTab === 'ponto' ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''} />
          Ponto
        </button>
        <button
          onClick={() => setActiveTab('inventario')}
          className={`flex flex-col items-center p-2.5 gap-1 text-[0.6rem] font-sans transition-colors ${activeTab === 'inventario' ? 'text-green' : 'text-text-muted'}`}
        >
          <Monitor size={20} className={activeTab === 'inventario' ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''} />
          Inventário
        </button>
        <button
          onClick={() => setActiveTab('chamados')}
          className={`flex flex-col items-center p-2.5 gap-1 text-[0.6rem] font-sans transition-colors ${activeTab === 'chamados' ? 'text-green' : 'text-text-muted'}`}
        >
          <ClipboardList size={20} className={activeTab === 'chamados' ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''} />
          Chamados
        </button>
        <button
          onClick={() => setActiveTab('historico')}
          className={`flex flex-col items-center p-2.5 gap-1 text-[0.6rem] font-sans transition-colors ${activeTab === 'historico' ? 'text-green' : 'text-text-muted'}`}
        >
          <Calendar size={20} className={activeTab === 'historico' ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''} />
          Histórico
        </button>
        <button
          onClick={() => setActiveTab('relatorio')}
          className={`flex flex-col items-center p-2.5 gap-1 text-[0.6rem] font-sans transition-colors ${activeTab === 'relatorio' ? 'text-green' : 'text-text-muted'}`}
        >
          <FileText size={20} className={activeTab === 'relatorio' ? 'drop-shadow-[0_0_6px_rgba(0,200,150,0.5)]' : ''} />
          Relatório
        </button>
      </nav>
    </div>
  );
}
