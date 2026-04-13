import React, { useMemo } from 'react';
import { 
  Clock, 
  Monitor, 
  Ticket, 
  History, 
  BarChart3, 
  Package, 
  ArrowRightLeft, 
  Settings,
  LayoutDashboard,
  TrendingUp
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Home({ user, onNavigate, stats, assignedEquipment, enabledModules, profile, tickets = [] }) {
  const allMenuItems = [
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
      badge: stats?.equipmentCount || 0,
      roles: ['admin_sistema', 'admin_ti', 'tecnico_ti']
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
      borderColor: 'border-orange-500/20',
      roles: ['admin_sistema', 'admin_ti', 'tecnico_ti']
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
      borderColor: 'border-pink-500/20',
      roles: ['admin_sistema', 'admin_ti']
    }
  ];

  const menuItems = allMenuItems.filter(item => {
    if (enabledModules && enabledModules[item.id] === false) return false;
    if (item.roles && !item.roles.includes(profile?.role)) return false;
    return true;
  });

  // Chart Data Preparation
  const { pieData, barData } = useMemo(() => {
    const categoryMap = {
      desktop: 'Desktop',
      notebook: 'Notebook',
      mobile: 'Mobile',
      peripherals: 'Periféricos',
      printer: 'Impressora',
      network: 'Rede',
      software: 'Software',
      other: 'Outros'
    };

    const ticketsByCategory = tickets.reduce((acc, ticket) => {
      const cat = categoryMap[ticket.category] || 'Outros';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const pie = Object.entries(ticketsByCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const bar = last7Days.map(date => {
      const opened = tickets.filter(t => t.date === date).length;
      let resolved = 0;
      tickets.forEach(t => {
        if (t.status === 'resolved' && t.data_fim) {
          // data_fim might be DD/MM/YYYY or YYYY-MM-DD
          let tDate = t.data_fim;
          if (tDate.includes('/')) {
            const [d, m, y] = tDate.split('/');
            tDate = `${y}-${m}-${d}`;
          }
          if (tDate === date) resolved++;
        }
      });
      
      const [year, month, day] = date.split('-');
      return {
        name: `${day}/${month}`,
        Abertos: opened,
        Resolvidos: resolved
      };
    });

    return { pieData: pie, barData: bar };
  }, [tickets]);

  const COLORS = ['#00C896', '#5BC4FF', '#FFB347', '#FF4D6D', '#A855F7', '#EAB308', '#64748B', '#F43F5E'];

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

      {/* Assigned Equipment Section */}
      {assignedEquipment && assignedEquipment.length > 0 && (
        <section className="bg-green/5 border border-green/20 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4 text-green">
            <Monitor size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Meu Equipamento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {assignedEquipment.map(equip => (
              <div key={equip.id} className="bg-surface border border-border p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm">{equip.name}</div>
                  <div className="text-[0.7rem] text-text-muted">{equip.brand} {equip.model} · SN: {equip.serial_number}</div>
                </div>
                <div className="text-[0.6rem] font-mono bg-green/20 text-green px-2 py-1 rounded-lg uppercase">
                  {equip.status === 'active' ? 'Em Uso' : 'Manutenção'}
                </div>
              </div>
            ))}
          </div>
          <Monitor className="absolute -right-8 -bottom-8 text-green/5" size={160} />
        </section>
      )}

      {/* Pending Tickets Section */}
      {tickets && tickets.filter(t => t.status !== 'resolved').length > 0 && (
        <section className="bg-surface border border-border rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-text-dim">
              <Ticket size={18} />
              <h2 className="text-sm font-bold uppercase tracking-widest">Chamados Pendentes</h2>
            </div>
            <button 
              onClick={() => onNavigate('chamados')}
              className="text-xs text-green hover:underline font-semibold"
            >
              Ver Todos
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tickets.filter(t => t.status !== 'resolved').slice(0, 4).map(ticket => (
              <div key={ticket.id} className="bg-surface2 border border-border rounded-2xl p-4 flex flex-col gap-2 hover:border-green/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">#{ticket.id.slice(0,8)}</span>
                  <span className={`text-[0.65rem] font-bold uppercase px-2 py-0.5 rounded-full ${
                    ticket.priority === 'critical' ? 'bg-red/10 text-red' :
                    ticket.priority === 'high' ? 'bg-amber/10 text-amber' :
                    ticket.priority === 'medium' ? 'bg-blue/10 text-blue' :
                    'bg-surface border border-border text-text-muted'
                  }`}>
                    {ticket.priority === 'critical' ? 'Crítica' : ticket.priority === 'high' ? 'Alta' : ticket.priority === 'medium' ? 'Média' : 'Baixa'}
                  </span>
                </div>
                <div className="font-bold text-sm line-clamp-1">{ticket.cliente || 'Sem Setor'}</div>
                <div className="text-xs text-text-dim line-clamp-2">{ticket.description}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
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
          </button>
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

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-surface border border-border rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6 text-text-dim">
            <TrendingUp size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Chamados (Últimos 7 Dias)</h2>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Abertos" fill="#FFB347" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="Resolvidos" fill="#00C896" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-surface border border-border rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6 text-text-dim">
            <BarChart3 size={18} />
            <h2 className="text-sm font-bold uppercase tracking-widest">Chamados por Categoria</h2>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-sm text-text-muted">Nenhum dado disponível.</div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
