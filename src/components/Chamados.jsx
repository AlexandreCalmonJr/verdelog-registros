import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Pencil, Trash2, ClipboardList } from 'lucide-react';

export default function Chamados({ tickets, onNewTicket, onEditTicket, onDeleteTicket }) {
  const [filter, setFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [prioFilter, setPrioFilter] = useState('all');

  const filteredTickets = tickets.filter(t => {
    const statusMatch = filter === 'all' ? true : (filter === 'open' ? t.status !== 'resolved' : t.status === 'resolved');
    const catMatch = catFilter === 'all' ? true : t.category === catFilter;
    const prioMatch = prioFilter === 'all' ? true : t.priority === prioFilter;
    return statusMatch && catMatch && prioMatch;
  });

  const getSLA = (t) => {
    if (!t.created_at || !t.resolved_at) return null;
    const start = new Date(t.created_at);
    const end = new Date(t.resolved_at);
    const diffMs = end - start;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHrs}h ${diffMins}m`;
  };

  const statusMap = {
    open: { cls: 'bg-[rgba(255,179,71,0.12)] text-amber border-[rgba(255,179,71,0.2)]', label: 'Aberto' },
    resolved: { cls: 'bg-[rgba(0,200,150,0.12)] text-green border-[rgba(0,200,150,0.2)]', label: 'Resolvido' },
    pending: { cls: 'bg-[rgba(255,77,109,0.12)] text-red border-[rgba(255,77,109,0.2)]', label: 'Pendente' },
    escalated: { cls: 'bg-[rgba(91,196,255,0.12)] text-blue border-[rgba(91,196,255,0.2)]', label: 'Escalado' },
  };

  const priorityMap = {
    low: { cls: 'bg-surface border-border text-text-muted', label: 'Baixa' },
    medium: { cls: 'bg-blue/10 border-blue/20 text-blue', label: 'Média' },
    high: { cls: 'bg-amber/10 border-amber/20 text-amber', label: 'Alta' },
    critical: { cls: 'bg-red/10 border-red/20 text-red', label: 'Crítica' },
  };

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-[1.05rem]">Chamados</h2>
        <button 
          onClick={onNewTicket}
          className="bg-green text-bg font-semibold text-[0.85rem] px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:bg-green-dim transition-all flex items-center gap-2"
        >
          <Plus size={16} /> Novo
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-1.5 rounded-full text-[0.78rem] font-medium border transition-all whitespace-nowrap ${filter === 'all' ? 'bg-[rgba(0,200,150,0.12)] border-[rgba(0,200,150,0.3)] text-green' : 'bg-surface border-border text-text-dim'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('open')}
          className={`px-4 py-1.5 rounded-full text-[0.78rem] font-medium border transition-all whitespace-nowrap ${filter === 'open' ? 'bg-[rgba(0,200,150,0.12)] border-[rgba(0,200,150,0.3)] text-green' : 'bg-surface border-border text-text-dim'}`}
        >
          Abertos
        </button>
        <button 
          onClick={() => setFilter('resolved')}
          className={`px-4 py-1.5 rounded-full text-[0.78rem] font-medium border transition-all whitespace-nowrap ${filter === 'resolved' ? 'bg-[rgba(0,200,150,0.12)] border-[rgba(0,200,150,0.3)] text-green' : 'bg-surface border-border text-text-dim'}`}
        >
          Resolvidos
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <select 
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-surface border border-border text-text-dim text-[0.7rem] px-3 py-1 rounded-lg outline-none focus:border-green"
        >
          <option value="all">Todas Categorias</option>
          {Object.entries(categoryMap).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <select 
          value={prioFilter}
          onChange={(e) => setPrioFilter(e.target.value)}
          className="bg-surface border border-border text-text-dim text-[0.7rem] px-3 py-1 rounded-lg outline-none focus:border-green"
        >
          <option value="all">Todas Prioridades</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {filteredTickets.length > 0 ? (
            filteredTickets.map((t) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key={t.id} 
                className="bg-surface border border-border rounded-2xl p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[0.75rem] text-green">#{t.ref}</span>
                      {t.cliente && <span className="text-[0.72rem] text-text-muted">· {t.cliente}</span>}
                      {t.requester && <span className="text-[0.72rem] text-text-muted">({t.requester})</span>}
                      {t.category && (
                        <span className="text-[0.6rem] bg-surface2 border border-border px-1.5 py-0.5 rounded text-text-muted uppercase font-bold">
                          {categoryMap[t.category] || t.category}
                        </span>
                      )}
                    </div>
                    <div className="text-[0.85rem] text-text-dim font-medium">{t.description}</div>
                    {t.photo_url && (
                      <div className="mt-2">
                        <img 
                          src={t.photo_url} 
                          alt="Evidência" 
                          className="w-20 h-20 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity" 
                          onClick={() => window.open(t.photo_url, '_blank')}
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    {t.status === 'resolved' && t.solution && (
                      <div className="mt-2 p-2 bg-green/5 border-l-2 border-green rounded-r-lg text-[0.8rem] text-text-dim italic">
                        <span className="font-bold text-green not-italic">Solução:</span> {t.solution}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full border ${statusMap[t.status].cls}`}>
                      {statusMap[t.status].label}
                    </span>
                    {t.priority && (
                      <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityMap[t.priority]?.cls || priorityMap.medium.cls}`}>
                        {priorityMap[t.priority]?.label || 'Média'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
                  <div className="flex flex-col">
                    <span className="font-mono text-[0.7rem] text-text-muted">Aberto: {t.dateDisplay} {t.hora}</span>
                    {t.data_fim && (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[0.7rem] text-green">Resolvido: {t.data_fim} {t.hora_fim}</span>
                        {getSLA(t) && (
                          <span className="text-[0.65rem] bg-green/10 text-green px-1.5 py-0.5 rounded font-bold">
                            SLA: {getSLA(t)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onEditTicket(t)}
                      className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => onDeleteTicket(t.id)}
                      className="p-2 rounded-lg border border-border text-red/60 hover:text-red hover:bg-red/10 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 text-text-muted flex flex-col items-center gap-3 opacity-50"
            >
              <ClipboardList size={40} />
              <p className="text-[0.85rem]">Sem chamados encontrados</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
