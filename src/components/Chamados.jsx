import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Pencil, Trash2, ClipboardList } from 'lucide-react';

export default function Chamados({ tickets, onNewTicket, onEditTicket, onDeleteTicket }) {
  const [filter, setFilter] = useState('all');

  const filteredTickets = tickets.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'open') return t.status !== 'resolved';
    if (filter === 'resolved') return t.status === 'resolved';
    return true;
  });

  const statusMap = {
    open: { cls: 'bg-[rgba(255,179,71,0.12)] text-amber border-[rgba(255,179,71,0.2)]', label: 'Aberto' },
    resolved: { cls: 'bg-[rgba(0,200,150,0.12)] text-green border-[rgba(0,200,150,0.2)]', label: 'Resolvido' },
    pending: { cls: 'bg-[rgba(255,77,109,0.12)] text-red border-[rgba(255,77,109,0.2)]', label: 'Pendente' },
    escalated: { cls: 'bg-[rgba(91,196,255,0.12)] text-blue border-[rgba(91,196,255,0.2)]', label: 'Escalado' },
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

      <div className="space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(t => (
            <div key={t.id} className="bg-surface border border-border rounded-2xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[0.75rem] text-green">#{t.ref}</span>
                    {t.cliente && <span className="text-[0.72rem] text-text-muted">· {t.cliente}</span>}
                  </div>
                  <div className="text-[0.85rem] text-text-dim font-medium">{t.description}</div>
                </div>
                <span className={`text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full border ${statusMap[t.status].cls}`}>
                  {statusMap[t.status].label}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
                <span className="font-mono text-[0.7rem] text-text-muted">{t.dateDisplay} {t.hora}</span>
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
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-text-muted flex flex-col items-center gap-3 opacity-50">
            <ClipboardList size={40} />
            <p className="text-[0.85rem]">Sem chamados encontrados</p>
          </div>
        )}
      </div>
    </div>
  );
}
