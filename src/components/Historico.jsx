import React, { useState } from 'react';
import { formatHours, formatMonthLabel } from '../lib/utils';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, ChevronRight } from 'lucide-react';

export default function Historico({ logs, onViewLog }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return d.toISOString().substring(0, 7);
  });

  const filteredLogs = logs.filter(l => l.date_iso?.startsWith(selectedMonth));
  const stats = {
    days: filteredLogs.length,
    hours: filteredLogs.reduce((s, l) => s + l.total_horas, 0),
    tickets: filteredLogs.reduce((s, l) => s + (l.tickets?.length || 0), 0),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-[1.05rem]">Histórico</h2>
        <select 
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-surface2 border border-border rounded-lg p-2 px-3 text-text font-sans text-[0.8rem] outline-none focus:border-green transition-all"
        >
          {months.map(m => (
            <option key={m} value={m}>{formatMonthLabel(m)}</option>
          ))}
        </select>
      </div>

      {filteredLogs.length > 0 ? (
        <>
          <div className="bg-surface border border-border rounded-2xl p-4 grid grid-cols-3 text-center gap-2">
            <div>
              <div className="font-mono text-xl font-medium text-green">{stats.days}</div>
              <div className="text-[0.68rem] text-text-muted mt-1 uppercase">Dias</div>
            </div>
            <div>
              <div className="font-mono text-xl font-medium text-green">{formatHours(stats.hours)}</div>
              <div className="text-[0.68rem] text-text-muted mt-1 uppercase">Horas</div>
            </div>
            <div>
              <div className="font-mono text-xl font-medium text-green">{stats.tickets}</div>
              <div className="text-[0.68rem] text-text-muted mt-1 uppercase">Chamados</div>
            </div>
          </div>

          <div className="space-y-3">
            {filteredLogs.map(log => (
              <button 
                key={log.id} 
                onClick={() => onViewLog(log)}
                className="w-full text-left bg-surface border border-border rounded-xl p-4 hover:border-border2 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-mono text-[0.78rem] text-text-muted">{log.date}</span>
                    <div className="font-semibold text-[0.9rem] mt-0.5 group-hover:text-green transition-colors">
                      {log.resumo.length > 60 ? log.resumo.substring(0, 60) + '…' : log.resumo}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[rgba(0,200,150,0.12)] text-green border border-[rgba(0,200,150,0.2)] font-mono text-[0.7rem] font-bold">
                    {formatHours(log.total_horas)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[0.75rem] text-text-muted">
                  <div className="flex items-center gap-3">
                    <span>{log.hora_inicio} – {log.hora_fim}</span>
                    {log.tickets.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[rgba(91,196,255,0.12)] text-blue border border-[rgba(91,196,255,0.2)]">
                        {log.tickets.length} chamado{log.tickets.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <ChevronRight size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-text-muted flex flex-col items-center gap-3 opacity-50">
          <CalendarIcon size={40} />
          <p className="text-[0.85rem]">Sem registros neste mês</p>
        </div>
      )}
    </div>
  );
}
