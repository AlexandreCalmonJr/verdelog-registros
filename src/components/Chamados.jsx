import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Pencil, Trash2, ClipboardList, LayoutList, KanbanSquare, MessageSquare, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Chamados({ tickets, onNewTicket, onEditTicket, onDeleteTicket, onUpdateTicketStatus }) {
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [filter, setFilter] = useState('not_resolved');
  const [catFilter, setCatFilter] = useState('all');
  const [prioFilter, setPrioFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [dragOverCol, setDragOverCol] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, catFilter, prioFilter, dateFilter, sectorFilter]);

  const filteredTickets = tickets.filter(t => {
    const statusMatch = filter === 'all' ? true : 
                        filter === 'not_resolved' ? t.status !== 'resolved' : 
                        t.status === filter;
    const catMatch = catFilter === 'all' ? true : t.category === catFilter;
    const prioMatch = prioFilter === 'all' ? true : t.priority === prioFilter;
    const dateMatch = dateFilter ? t.date === dateFilter : true;
    const sectorMatch = sectorFilter ? (t.cliente || '').toLowerCase().includes(sectorFilter.toLowerCase()) : true;
    return statusMatch && catMatch && prioMatch && dateMatch && sectorMatch;
  });

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
    in_progress: { cls: 'bg-[rgba(91,196,255,0.12)] text-blue border-[rgba(91,196,255,0.2)]', label: 'Em Andamento' },
    pending: { cls: 'bg-[rgba(255,77,109,0.12)] text-red border-[rgba(255,77,109,0.2)]', label: 'Pendente' },
    escalated: { cls: 'bg-purple-500/10 text-purple-500 border-purple-500/20', label: 'Escalado' },
    resolved: { cls: 'bg-[rgba(0,200,150,0.12)] text-green border-[rgba(0,200,150,0.2)]', label: 'Resolvido' },
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

  const kanbanColumns = [
    { id: 'open', title: 'A Fazer', status: 'open' },
    { id: 'in_progress', title: 'Em Andamento', status: 'in_progress' },
    { id: 'pending', title: 'Pendente', status: 'pending' },
    { id: 'resolved', title: 'Concluído', status: 'resolved' }
  ];

  const handleDragStart = (e, ticketId) => {
    e.dataTransfer.setData('ticketId', ticketId);
  };

  const handleDrop = async (e, status) => {
    e.preventDefault();
    setDragOverCol(null);
    const ticketId = e.dataTransfer.getData('ticketId');
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && ticket.status !== status) {
      if (onUpdateTicketStatus) {
        setUpdatingId(ticketId);
        await onUpdateTicketStatus(ticketId, status);
        setUpdatingId(null);
      } else {
        onEditTicket({ ...ticket, status });
      }
    }
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    if (dragOverCol !== status) setDragOverCol(status);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverCol(null);
  };

  const renderTicketCard = (t, isKanban = false) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      key={t.id} 
      draggable={isKanban}
      onDragStart={(e) => isKanban && handleDragStart(e, t.id)}
      className={`relative bg-surface border border-border rounded-2xl p-4 ${isKanban ? 'cursor-grab active:cursor-grabbing mb-3' : 'mb-3'} ${updatingId === t.id ? 'opacity-50 pointer-events-none' : ''}`}
    >
      {updatingId === t.id && (
        <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
          <Loader2 className="animate-spin text-green" size={24} />
        </div>
      )}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded uppercase ${t.ticket_type === 'request' ? 'bg-blue/10 text-blue border border-blue/20' : 'bg-red/10 text-red border border-red/20'}`}>
              {t.ticket_type === 'request' ? 'REQ' : 'INC'}
            </span>
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
                className="w-16 h-16 rounded-lg object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => window.open(t.photo_url, '_blank')}
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          {t.status === 'resolved' && t.solution && !isKanban && (
            <div className="mt-2 p-2 bg-green/5 border-l-2 border-green rounded-r-lg text-[0.8rem] text-text-dim italic">
              <span className="font-bold text-green not-italic">Solução:</span> {t.solution}
            </div>
          )}
          {t.notes && t.notes.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-text-muted">
              <MessageSquare size={12} />
              <span className="text-[0.7rem] font-medium">{t.notes.length} anotaç{t.notes.length > 1 ? 'ões' : 'ão'}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          {!isKanban && (
            <span className={`text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full border ${statusMap[t.status].cls}`}>
              {statusMap[t.status].label}
            </span>
          )}
          {t.priority && (
            <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${priorityMap[t.priority]?.cls || priorityMap.medium.cls}`}>
              {priorityMap[t.priority]?.label || 'Média'}
            </span>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-border/50">
        <div className="flex flex-col">
          <span className="font-mono text-[0.65rem] text-text-muted">{t.dateDisplay} {t.hora}</span>
          {t.data_fim && !isKanban && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[0.65rem] text-green">Fim: {t.data_fim} {t.hora_fim}</span>
              {getSLA(t) && (
                <span className="text-[0.6rem] bg-green/10 text-green px-1.5 py-0.5 rounded font-bold">
                  SLA: {getSLA(t)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onEditTicket(t)}
            className="p-1.5 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
          >
            <Pencil size={14} />
          </button>
          <button 
            onClick={() => onDeleteTicket(t.id)}
            className="p-1.5 rounded-lg border border-border text-red/60 hover:text-red hover:bg-red/10 transition-all"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-[1.05rem]">Chamados</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface border border-border rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-surface2 text-green' : 'text-text-muted hover:text-text'}`}
            >
              <LayoutList size={16} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-surface2 text-green' : 'text-text-muted hover:text-text'}`}
            >
              <KanbanSquare size={16} />
            </button>
          </div>
          <button 
            onClick={onNewTicket}
            className="bg-green text-bg font-semibold text-[0.85rem] px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:bg-green-dim transition-all flex items-center gap-2"
          >
            <Plus size={16} /> Novo
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
          <div className="flex items-center gap-2 text-[0.85rem] font-semibold text-text-dim">
            <Filter size={16} /> Filtros de Busca
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[0.7rem] text-text-muted bg-surface2 px-2 py-1 rounded-md">{filteredTickets.length} resultados</span>
            <span className="text-text-muted text-[0.7rem]">{showFilters ? 'Ocultar' : 'Mostrar'}</span>
          </div>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 mt-2 border-t border-border/50">
                <div>
                  <label className="block text-[0.65rem] font-bold text-text-muted uppercase mb-1">Data</label>
                  <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-full bg-surface2 border border-border rounded-lg p-2 text-[0.8rem] text-text outline-none focus:border-green transition-all" />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold text-text-muted uppercase mb-1">Setor / Órgão</label>
                  <input type="text" placeholder="Buscar setor..." value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className="w-full bg-surface2 border border-border rounded-lg p-2 text-[0.8rem] text-text outline-none focus:border-green transition-all" />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold text-text-muted uppercase mb-1">Categoria</label>
                  <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-full bg-surface2 border border-border rounded-lg p-2 text-[0.8rem] text-text outline-none focus:border-green transition-all">
                    <option value="all">Todas as Categorias</option>
                    {Object.entries(categoryMap).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.65rem] font-bold text-text-muted uppercase mb-1">Status</label>
                  <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-surface2 border border-border rounded-lg p-2 text-[0.8rem] text-text outline-none focus:border-green transition-all">
                    <option value="all">Todos os Status</option>
                    <option value="not_resolved">Abertos / Pendentes</option>
                    <option value="open">A Fazer</option>
                    <option value="in_progress">Em Andamento</option>
                    <option value="pending">Aguardando</option>
                    <option value="resolved">Concluído</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-3">
          <AnimatePresence>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((t) => renderTicketCard(t, false))
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface border border-border rounded-2xl p-4 mt-4">
              <span className="text-[0.75rem] text-text-muted">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filteredTickets.length)} de {filteredTickets.length}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-[0.75rem] font-medium text-text-dim px-2">
                  Página {currentPage} de {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
          {kanbanColumns.map(col => {
            const colTickets = filteredTickets.filter(t => t.status === col.status);
            return (
              <div 
                key={col.id} 
                className={`min-w-[280px] w-[280px] flex-shrink-0 border rounded-2xl p-3 snap-center flex flex-col transition-all duration-200 ${
                  dragOverCol === col.status 
                    ? 'bg-green/5 border-green/50 shadow-[0_0_15px_rgba(0,200,150,0.1)]' 
                    : 'bg-surface2/50 border-border'
                }`}
                onDrop={(e) => handleDrop(e, col.status)}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <h3 className="font-semibold text-[0.85rem] text-text-dim">{col.title}</h3>
                  <span className="bg-surface border border-border text-text-muted text-[0.65rem] font-bold px-2 py-0.5 rounded-full">
                    {colTickets.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar min-h-[150px]">
                  <AnimatePresence>
                    {colTickets.map(t => renderTicketCard(t, true))}
                  </AnimatePresence>
                  {colTickets.length === 0 && (
                    <div className="h-full flex items-center justify-center text-text-muted/50 text-[0.75rem] border-2 border-dashed border-border/50 rounded-xl p-4">
                      Arraste chamados para cá
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
