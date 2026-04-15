import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';

export default function ClientPortal({ user, profile, tickets, onNewTicket, onEditTicket }) {
  const [filter, setFilter] = useState('all');

  const myTickets = tickets.filter(t => t.user_id === user.id || t.requester === profile?.name);

  const filteredTickets = myTickets.filter(t => {
    if (filter === 'open') return t.status !== 'resolved';
    if (filter === 'resolved') return t.status === 'resolved';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open': return <span className="px-2 py-1 bg-amber/10 text-amber border border-amber/20 rounded text-xs font-bold uppercase">Aberto</span>;
      case 'in_progress': return <span className="px-2 py-1 bg-blue/10 text-blue border border-blue/20 rounded text-xs font-bold uppercase">Em Andamento</span>;
      case 'pending': return <span className="px-2 py-1 bg-red/10 text-red border border-red/20 rounded text-xs font-bold uppercase">Pendente</span>;
      case 'resolved': return <span className="px-2 py-1 bg-green/10 text-green border border-green/20 rounded text-xs font-bold uppercase">Resolvido</span>;
      default: return <span className="px-2 py-1 bg-surface2 text-text-muted border border-border rounded text-xs font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            Olá, <span className="text-green">{profile?.name?.split(' ')[0] || 'Usuário'}</span>
          </h1>
          <p className="text-text-dim text-sm mt-1">
            Como podemos ajudar você hoje?
          </p>
        </div>
        <button
          onClick={onNewTicket}
          className="bg-gradient-to-r from-green to-[#00ffa3] text-bg font-bold px-6 py-3 rounded-xl shadow-lg hover:shadow-green/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Abrir Chamado
        </button>
      </header>

      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-display font-bold">Meus Chamados</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-surface2 text-text' : 'text-text-muted hover:text-text'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'open' ? 'bg-amber/10 text-amber' : 'text-text-muted hover:text-text'}`}
            >
              Em Aberto
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === 'resolved' ? 'bg-green/10 text-green' : 'text-text-muted hover:text-text'}`}
            >
              Resolvidos
            </button>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <CheckCircle2 size={48} className="text-green/50 mb-4" />
            <h3 className="text-lg font-bold text-text mb-2">Tudo tranquilo por aqui!</h3>
            <p className="text-text-dim text-sm max-w-md">
              Você não tem nenhum chamado {filter === 'open' ? 'em aberto' : filter === 'resolved' ? 'resolvido' : 'registrado'}. Se precisar de ajuda, basta abrir um novo chamado.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredTickets.map(t => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={t.id}
                onClick={() => onEditTicket(t)}
                className="bg-surface border border-border hover:border-green/50 rounded-2xl p-5 cursor-pointer transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-sm text-green">#{t.ref}</span>
                      {getStatusBadge(t.status)}
                      <span className="text-xs text-text-muted flex items-center gap-1">
                        <Clock size={12} /> {t.date_display}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-text group-hover:text-green transition-colors line-clamp-1">{t.description}</h3>
                    {t.category && (
                      <span className="inline-block mt-2 text-[0.65rem] bg-surface2 px-2 py-1 rounded text-text-muted uppercase font-bold">
                        {t.category}
                      </span>
                    )}
                  </div>

                  {t.status === 'resolved' && t.solution && (
                    <div className="md:w-1/3 bg-green/5 border-l-2 border-green p-3 rounded-r-lg">
                      <div className="text-xs font-bold text-green mb-1">Solução:</div>
                      <div className="text-sm text-text-dim line-clamp-2">{t.solution}</div>
                    </div>
                  )}

                  {t.status !== 'resolved' && t.notes && t.notes.length > 0 && (
                    <div className="md:w-1/3 bg-surface2 p-3 rounded-lg flex items-start gap-2">
                      <MessageSquare size={14} className="text-text-muted shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-text-muted mb-1">Última atualização:</div>
                        <div className="text-sm text-text-dim line-clamp-2">{t.notes[t.notes.length - 1].text}</div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
