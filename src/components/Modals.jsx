import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { maskCPF, formatHours } from '../lib/utils';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[500] flex items-end justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-[600px] bg-surface border border-border2 rounded-t-[24px] p-6 pb-10 max-h-[92vh] overflow-y-auto no-scrollbar"
        >
          <div className="w-9 h-1 bg-border2 rounded-full mx-auto mb-5" />
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-xl">{title}</h3>
            <button onClick={onClose} className="p-1 text-text-muted hover:text-text transition-colors">
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export function StopShiftModal({ 
  isOpen, 
  onClose, 
  onConfirm 
}) {
  const [summary, setSummary] = React.useState('');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Encerrar Turno">
      <p className="text-[0.82rem] text-text-muted mb-5">Adicione um resumo das atividades do dia.</p>
      <div className="mb-6">
        <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Resumo *</label>
        <textarea 
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all min-h-[120px] resize-none"
          placeholder="Descreva as atividades realizadas hoje..."
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onClose} className="bg-surface border border-border text-text-dim font-semibold p-3 rounded-lg hover:bg-surface2 transition-all">Cancelar</button>
        <button 
          onClick={() => { onConfirm(summary); setSummary(''); }}
          className="bg-red/10 border border-red/25 text-red font-semibold p-3 rounded-lg hover:bg-red/20 transition-all"
        >
          Encerrar
        </button>
      </div>
    </Modal>
  );
}

export function TicketModal({
  isOpen,
  onClose,
  onSave,
  ticket
}) {
  const [formData, setFormData] = React.useState({
    ref: '', cliente: '', description: '', status: 'open'
  });

  React.useEffect(() => {
    if (ticket) setFormData(ticket);
    else setFormData({ ref: '', cliente: '', description: '', status: 'open' });
  }, [ticket, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ticket ? 'Editar Chamado' : 'Novo Chamado'}>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Nº / Ref.</label>
          <input 
            value={formData.ref}
            onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            placeholder="INC-2025-001"
          />
        </div>
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Setor / Órgão</label>
          <input 
            value={formData.cliente}
            onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            placeholder="Secretaria X"
          />
        </div>
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Descrição</label>
          <input 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            placeholder="Problema de rede..."
          />
        </div>
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Status</label>
          <select 
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
          >
            <option value="open">Aberto</option>
            <option value="resolved">Resolvido</option>
            <option value="pending">Pendente</option>
            <option value="escalated">Escalado</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onClose} className="bg-surface border border-border text-text-dim font-semibold p-3 rounded-lg hover:bg-surface2 transition-all">Cancelar</button>
        <button onClick={() => onSave(formData)} className="bg-green text-bg font-semibold p-3 rounded-lg hover:bg-green-dim transition-all">Salvar</button>
      </div>
    </Modal>
  );
}

export function ProfileModal({
  isOpen,
  onClose,
  onSave,
  onLogout,
  profile,
  userEmail
}) {
  const [formData, setFormData] = React.useState(profile);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile, isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Perfil do Servidor">
      <div className="bg-surface2 border border-border rounded-lg p-3 px-4 mb-5 text-[0.8rem] text-text-muted">
        Conta: <strong className="text-green">{userEmail}</strong>
      </div>
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Nome Completo</label>
          <input 
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
          />
        </div>
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">CPF</label>
          <input 
            value={maskCPF(formData.cpf)}
            onChange={(e) => setFormData({ ...formData, cpf: e.target.value.replace(/\D/g, '') })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            placeholder="000.000.000-00"
          />
        </div>
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Cargo / Função</label>
          <input 
            value={formData.cargo}
            onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
          />
        </div>
        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">E-mail institucional</label>
          <input 
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <button onClick={onClose} className="bg-surface border border-border text-text-dim font-semibold p-3 rounded-lg hover:bg-surface2 transition-all">Cancelar</button>
        <button onClick={() => onSave(formData)} className="bg-green text-bg font-semibold p-3 rounded-lg hover:bg-green-dim transition-all">Salvar</button>
      </div>
      <button onClick={onLogout} className="w-full bg-red/10 border border-red/25 text-red font-semibold p-3 rounded-lg hover:bg-red/20 transition-all">Sair da Conta</button>
    </Modal>
  );
}

export function LogDetailModal({
  isOpen,
  onClose,
  log
}) {
  if (!log) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={log.date}>
      <div className="flex gap-4 mb-5">
        <span className="px-2.5 py-1 rounded-full bg-[rgba(0,200,150,0.12)] text-green border border-[rgba(0,200,150,0.2)] font-mono text-[0.8rem] font-bold">
          {formatHours(log.total_horas)}
        </span>
        <span className="text-[0.78rem] text-text-muted self-center">{log.hora_inicio} – {log.hora_fim}</span>
      </div>
      <p className="text-[0.72rem] text-text-muted uppercase tracking-[0.06em] mb-1.5">Resumo</p>
      <p className="text-[0.9rem] text-text-dim leading-relaxed mb-6">{log.resumo}</p>
      
      {log.tickets.length > 0 && (
        <>
          <p className="text-[0.72rem] text-text-muted uppercase tracking-[0.06em] mb-2">Chamados ({log.tickets.length})</p>
          <div className="space-y-2">
            {log.tickets.map(t => (
              <div key={t.id} className="bg-surface2 border border-border rounded-lg p-3">
                <span className="font-mono text-[0.75rem] text-green">#{t.ref}</span> · <span className="text-[0.82rem]">{t.description}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <button onClick={onClose} className="w-full bg-surface border border-border text-text-dim font-semibold p-3 rounded-lg hover:bg-surface2 transition-all mt-6">Fechar</button>
    </Modal>
  );
}
