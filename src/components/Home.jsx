import React from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  Monitor, 
  Ticket, 
  History, 
  BarChart3, 
  Package, 
  ArrowRightLeft, 
  Settings,
  LayoutDashboard
} from 'lucide-react';

export default function Home({ user, onNavigate, stats }) {
  const menuItems = [
    {
      id: 'ponto',
      title: 'Ponto Eletrônico',
      description: 'Registrar entrada, saída e intervalos.',
      icon: <Clock className="text-blue-500" size={24} />,
      color: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'inventario',
      title: 'Inventário de TI',
      description: 'Gestão de computadores e equipamentos.',
      icon: <Monitor className="text-green-500" size={24} />,
      color: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      badge: stats?.equipmentCount || 0
    },
    {
      id: 'chamados',
      title: 'Chamados / Tickets',
      description: 'Suporte técnico e solicitações.',
      icon: <Ticket className="text-purple-500" size={24} />,
      color: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      badge: stats?.activeTickets || 0
    },
    {
      id: 'logistica',
      title: 'Logística e Estoque',
      description: 'Insumos, periféricos e movimentações.',
      icon: <Package className="text-orange-500" size={24} />,
      color: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      id: 'historico',
      title: 'Histórico Geral',
      description: 'Logs de ponto e manutenções.',
      icon: <History className="text-cyan-500" size={24} />,
      color: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      id: 'relatorio',
      title: 'Relatórios e BI',
      description: 'Análise de dados e exportação PDF.',
      icon: <BarChart3 className="text-pink-500" size={24} />,
      color: 'bg-pink-500/10',
      borderColor: 'border-pink-500/20'
    }
  ];

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-2">
        <h1 className="text-4xl font-display font-bold tracking-tight">
          Olá, <span className="text-green">{user?.user_metadata?.name?.split(' ')[0] || 'Técnico'}</span>
        </h1>
        <p className="text-text-dim text-sm font-medium">
          Bem-vindo ao <span className="text-green font-bold">VerdeIT</span>. O que vamos gerenciar hoje?
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-start p-6 rounded-3xl border ${item.borderColor} ${item.color} hover:scale-[1.02] transition-all text-left relative group overflow-hidden`}
          >
            <div className="p-3 bg-surface rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <h3 className="text-lg font-bold mb-1">{item.title}</h3>
            <p className="text-xs text-text-muted leading-relaxed">
              {item.description}
            </p>
            
            {item.badge !== undefined && item.badge > 0 && (
              <div className="absolute top-4 right-4 bg-surface border border-border px-2 py-0.5 rounded-full text-[0.65rem] font-bold">
                {item.badge}
              </div>
            )}

            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              {React.cloneElement(item.icon, { size: 120 })}
            </div>
          </motion.button>
        ))}
      </div>

      {/* Quick Stats Section */}
      <section className="bg-surface border border-border rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-6 text-text-dim">
          <LayoutDashboard size={18} />
          <h2 className="text-sm font-bold uppercase tracking-widest">Status do Sistema</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="text-[0.65rem] font-bold text-text-muted uppercase">Equipamentos</div>
            <div className="text-2xl font-bold">{stats?.equipmentCount || 0}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[0.65rem] font-bold text-text-muted uppercase">Chamados Abertos</div>
            <div className="text-2xl font-bold text-purple-500">{stats?.activeTickets || 0}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[0.65rem] font-bold text-text-muted uppercase">Setores Ativos</div>
            <div className="text-2xl font-bold">{stats?.sectorCount || 0}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[0.65rem] font-bold text-text-muted uppercase">Pessoas em Turno</div>
            <div className="text-2xl font-bold text-green">{stats?.activeShifts || 0}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
