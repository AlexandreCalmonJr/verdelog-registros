import React, { useState, useEffect } from 'react';
import { formatHours } from '../lib/utils';
import { motion } from 'motion/react';
import { Play, Square, Plus, FileClock } from 'lucide-react';

export default function Ponto({ 
  isWorking, 
  shiftStartTime, 
  logs, 
  tickets, 
  onStartShift, 
  onStopShift, 
  onNewTicket,
  onViewLog
}) {
  const [clock, setClock] = useState('00:00:00');
  const [elapsed, setElapsed] = useState('0h 0m');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setClock(now.toLocaleTimeString('pt-BR', { hour12: false }));
      
      if (isWorking && shiftStartTime) {
        const diff = Date.now() - shiftStartTime.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        setElapsed(`${h}h ${m}m`);
        setProgress(Math.min((diff / (9 * 3600000)) * 100, 100));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isWorking, shiftStartTime]);

  const stats = {
    today: logs.filter(l => l.dateISO === new Date().toISOString().split('T')[0]).reduce((s, l) => s + l.total_horas, 0),
    week: logs.filter(l => {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      const ws = d.toISOString().split('T')[0];
      return l.dateISO >= ws;
    }).reduce((s, l) => s + l.total_horas, 0),
    month: logs.filter(l => l.dateISO.startsWith(new Date().toISOString().substring(0, 7))).reduce((s, l) => s + l.total_horas, 0),
  };

  return (
    <div className="space-y-4">
      <motion.div 
        layout
        className={`bg-surface border border-border rounded-2xl p-5 transition-all ${isWorking ? 'working-glow border-border2' : 'shadow-[0_0_30px_rgba(0,200,150,0.07)]'}`}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[0.72rem] text-text-muted uppercase tracking-[0.06em] mb-1">Relógio de Ponto</p>
            <div className="font-mono text-[3.2rem] font-medium text-green tracking-tight drop-shadow-[0_0_30px_rgba(0,200,150,0.4)]">
              {clock}
            </div>
          </div>
          <div>
            {isWorking ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-semibold bg-[rgba(0,200,150,0.12)] text-green border border-[rgba(0,200,150,0.2)]">
                <div className="w-2 h-2 rounded-full bg-green animate-pulse-ring" />
                Trabalhando
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.7rem] font-semibold bg-[rgba(255,77,109,0.12)] text-red border border-[rgba(255,77,109,0.2)]">
                ● Parado
              </span>
            )}
          </div>
        </div>

        {isWorking && (
          <div className="mb-5">
            <div className="flex justify-between text-[0.75rem] text-text-muted mb-1.5">
              <span>Tempo trabalhado</span>
              <span className="font-mono text-green">{elapsed}</span>
            </div>
            <div className="h-1 bg-surface2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-green to-[#00ffa3] rounded-full"
              />
            </div>
            <div className="mt-4 flex items-center gap-2 text-[0.82rem] text-text-dim">
              <div className="w-2.5 h-2.5 rounded-full bg-green animate-pulse-ring" />
              Início: <span className="font-mono text-green">{shiftStartTime?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        )}

        {!isWorking ? (
          <button 
            onClick={onStartShift}
            className="w-full bg-gradient-to-br from-green to-[#00ffa3] text-bg font-display font-bold text-lg p-4 rounded-xl shadow-[0_8px_32px_rgba(0,200,150,0.35)] hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(0,200,150,0.45)] transition-all flex items-center justify-center gap-2"
          >
            <Play size={20} fill="currentColor" /> Iniciar Turno
          </button>
        ) : (
          <button 
            onClick={onStopShift}
            className="w-full bg-gradient-to-br from-red to-[#ff8fa3] text-white font-display font-bold text-lg p-4 rounded-xl shadow-[0_8px_32px_rgba(255,77,109,0.35)] hover:translate-y-[-2px] hover:shadow-[0_12px_40px_rgba(255,77,109,0.45)] transition-all flex items-center justify-center gap-2"
          >
            <Square size={20} fill="currentColor" /> Encerrar Turno
          </button>
        )}
      </motion.div>

      <div className="bg-surface border border-border rounded-2xl p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="font-mono text-xl font-medium text-green">{formatHours(stats.today)}</div>
            <div className="text-[0.68rem] text-text-muted mt-1 uppercase">Hoje</div>
          </div>
          <div>
            <div className="font-mono text-xl font-medium text-green">{formatHours(stats.week)}</div>
            <div className="text-[0.68rem] text-text-muted mt-1 uppercase">Semana</div>
          </div>
          <div>
            <div className="font-mono text-xl font-medium text-green">{formatHours(stats.month)}</div>
            <div className="text-[0.68rem] text-text-muted mt-1 uppercase">Mês</div>
          </div>
        </div>
      </div>

      {isWorking && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-[1.05rem]">Chamados do Turno</h3>
            <button onClick={onNewTicket} className="px-3 py-1.5 rounded-lg border border-border text-[0.8rem] font-semibold text-text-dim hover:text-text hover:bg-surface2 transition-all flex items-center gap-1.5">
              <Plus size={14} /> Novo
            </button>
          </div>
          <div className="space-y-2">
            {tickets.filter(t => t.is_active).length > 0 ? (
              tickets.filter(t => t.is_active).map(t => (
                <div key={t.id} className="bg-surface2 border border-border rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[0.75rem] text-green">#{t.ref}</span>
                    <span className="text-[0.7rem] font-semibold px-2 py-0.5 rounded-full bg-[rgba(0,200,150,0.12)] text-green border border-[rgba(0,200,150,0.2)]">
                      {t.status}
                    </span>
                  </div>
                  <div className="text-[0.85rem] text-text-dim">{t.description}</div>
                </div>
              ))
            ) : (
              <p className="text-[0.8rem] text-text-muted py-2">Nenhum chamado neste turno.</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-display font-bold text-[1.05rem]">Registros Recentes</h3>
        <div className="space-y-3">
          {logs.length > 0 ? (
            logs.slice(0, 5).map(log => (
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
                <div className="flex items-center gap-3 text-[0.75rem] text-text-muted">
                  <span>{log.hora_inicio} – {log.hora_fim}</span>
                  {log.tickets.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[rgba(91,196,255,0.12)] text-blue border border-[rgba(91,196,255,0.2)]">
                      {log.tickets.length} chamado{log.tickets.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="text-center py-12 text-text-muted flex flex-col items-center gap-3 opacity-50">
              <FileClock size={40} />
              <p className="text-[0.85rem]">Sem registros ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
