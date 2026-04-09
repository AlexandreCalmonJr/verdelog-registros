import React from 'react';
import { motion } from 'motion/react';
import { maskCPF, formatHours } from '../lib/utils';
import { X, Camera, Loader2 } from 'lucide-react';
import { supabaseService } from '../lib/supabaseService';

const Modal = ({ isOpen, onClose, title, children }) => (
  <>
    {isOpen && (
      <div className="fixed inset-0 z-[500] flex items-end justify-center">
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/80"
        />
        <div
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
        </div>
      </div>
    )}
  </>
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
  ticket,
  equipment = []
}) {
  const [formData, setFormData] = React.useState({
    ref: '', cliente: '', description: '', status: 'open', equipment_id: '', solution: '', category: 'desktop', priority: 'medium', requester: '', photo_url: '', date: '', hora: '', notes: []
  });
  const [newNote, setNewNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  React.useEffect(() => {
    if (ticket) setFormData({ 
      ...ticket, 
      equipment_id: ticket.equipment_id || '',
      solution: ticket.solution || '',
      category: ticket.category || 'desktop',
      priority: ticket.priority || 'medium',
      requester: ticket.requester || '',
      photo_url: ticket.photo_url || '',
      date: ticket.date || '',
      hora: ticket.hora || '',
      notes: ticket.notes || []
    });
    else setFormData({ 
      ref: '', cliente: '', description: '', status: 'open', equipment_id: '', solution: '', category: 'desktop', priority: 'medium', requester: '', photo_url: '', 
      date: new Date().toISOString().split('T')[0], 
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), 
      notes: [] 
    });
    setSaving(false);
    setUploading(false);
    setNewNote('');
  }, [ticket, isOpen]);

  const handleAddNote = (e) => {
    if (e) e.preventDefault();
    if (!newNote.trim()) return;
    const note = {
      id: Date.now().toString(),
      text: newNote.trim(),
      created_at: new Date().toISOString()
    };
    setFormData({
      ...formData,
      notes: [...(formData.notes || []), note]
    });
    setNewNote('');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const url = await supabaseService.uploadTicketPhoto(file);
      setFormData({ ...formData, photo_url: url });
    } catch (error) {
      alert('Erro ao subir foto: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (formData.status === 'resolved' && !formData.solution.trim()) {
      alert('Por favor, descreva a solução para finalizar o chamado.');
      return;
    }
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={ticket ? 'Editar Chamado' : 'Novo Chamado'}>
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
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
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            >
              <option value="open">Aberto (A Fazer)</option>
              <option value="in_progress">Em Andamento</option>
              <option value="pending">Pendente (Aguardando)</option>
              <option value="escalated">Escalado</option>
              <option value="resolved">Resolvido (Concluído)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Data Início</label>
            <input 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Hora Início</label>
            <input 
              type="time"
              value={formData.hora}
              onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Data Fim</label>
            <input 
              type="date"
              value={formData.data_fim || ''}
              onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            />
          </div>
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Hora Fim</label>
            <input 
              type="time"
              value={formData.hora_fim || ''}
              onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Setor / Órgão</label>
            <input 
              value={formData.cliente}
              onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
              placeholder="Ex: RH, Secretaria..."
            />
          </div>
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Solicitante</label>
            <input 
              value={formData.requester}
              onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
              placeholder="Nome do servidor"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Categoria</label>
            <select 
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            >
              <option value="desktop">Desktop / Workstation</option>
              <option value="notebook">Notebook / Laptop</option>
              <option value="mobile">Mobile (Tablet/Celular)</option>
              <option value="peripherals">Periféricos (Mouse/Teclado)</option>
              <option value="printer">Impressora / Scanner</option>
              <option value="network">Rede / Conectividade</option>
              <option value="software">Software / Sistema</option>
              <option value="other">Outros</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Prioridade</label>
            <select 
              value={formData.priority || 'medium'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Equipamento (Opcional)</label>
            <select 
              value={formData.equipment_id || ''}
              onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all"
            >
              <option value="">Nenhum vinculado</option>
              {equipment.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.name} {eq.patrimony_number ? `(${eq.patrimony_number})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Foto do Equipamento / Problema</label>
          <div className="flex items-center gap-4">
            <label className={`flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all ${formData.photo_url ? 'border-green/50 bg-green/5 text-green' : 'border-border hover:border-green/50 hover:bg-surface2 text-text-muted'}`}>
              {uploading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Camera size={20} />
              )}
              <span className="text-[0.85rem] font-medium">{formData.photo_url ? 'Trocar Foto' : 'Subir Foto'}</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
            {formData.photo_url && (
              <div className="relative group">
                <img src={formData.photo_url} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-border" referrerPolicy="no-referrer" />
                <button 
                  onClick={() => setFormData({ ...formData, photo_url: '' })}
                  className="absolute -top-2 -right-2 bg-red text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Descrição</label>
          <textarea 
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all h-24 resize-none"
            placeholder="Descreva o problema ou solicitação..."
          />
        </div>

        {formData.status === 'resolved' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green/5 border border-green/20 rounded-xl p-4"
          >
            <label className="block text-[0.75rem] font-bold text-green uppercase tracking-[0.06em] mb-1.5">Solução Aplicada *</label>
            <textarea 
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green transition-all h-24 resize-none"
              placeholder="O que foi feito para resolver este chamado?"
              required
            />
          </motion.div>
        )}

        {/* Histórico de Anotações */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-3">Histórico de Anotações</label>
          
          <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto no-scrollbar">
            {formData.notes && formData.notes.length > 0 ? (
              formData.notes.map(note => (
                <div key={note.id} className="bg-surface2 border border-border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[0.65rem] text-text-muted font-mono">
                      {new Date(note.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-[0.85rem] text-text-dim">{note.text}</p>
                </div>
              ))
            ) : (
              <p className="text-[0.8rem] text-text-muted italic text-center py-2">Nenhuma anotação registrada.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input 
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNote(e)}
              className="flex-1 bg-surface2 border border-border rounded-lg p-2.5 text-text font-sans text-[0.85rem] outline-none focus:border-green transition-all"
              placeholder="Adicionar nova anotação..."
            />
            <button 
              onClick={handleAddNote}
              disabled={!newNote.trim()}
              className="bg-surface border border-border text-green font-semibold px-4 rounded-lg hover:bg-green/10 hover:border-green/30 transition-all disabled:opacity-50 disabled:hover:bg-surface disabled:hover:border-border"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={onClose} className="bg-surface border border-border text-text-dim font-semibold p-3 rounded-lg hover:bg-surface2 transition-all">Cancelar</button>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-green text-bg font-semibold p-3 rounded-lg hover:bg-green-dim transition-all disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
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
