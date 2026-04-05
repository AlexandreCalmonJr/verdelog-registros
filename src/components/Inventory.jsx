import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '../lib/supabaseService';
import { Plus, Monitor, MapPin, Trash2, Edit2, History, ChevronRight, Layers, X, User as UserIcon, Download, CheckCircle2, AlertCircle, Archive } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Inventory({ user, onNewTicket, showToast }) {
  const [sectors, setSectors] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('sectors'); // sectors, equipment
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [equipmentTickets, setEquipmentTickets] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedSector, setSelectedSector] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, e, p] = await Promise.all([
        supabaseService.getSectors(),
        supabaseService.getEquipment(),
        supabaseService.getAllProfiles()
      ]);
      setSectors(s || []);
      setEquipment(e || []);
      setProfiles(p || []);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenance = async (equipId) => {
    try {
      const [logs, tks] = await Promise.all([
        supabaseService.getMaintenanceLogs(equipId),
        supabaseService.getTicketsByEquipment(equipId)
      ]);
      setMaintenanceLogs(logs || []);
      setEquipmentTickets(tks || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const log = {
      equipment_id: editingItem.id,
      user_id: user.id,
      description: formData.get('description'),
      cost: parseFloat(formData.get('cost') || 0),
      date: formData.get('date'),
    };

    try {
      await supabaseService.createMaintenanceLog(log);
      fetchMaintenance(editingItem.id);
      e.target.reset();
      showToast('Manutenção registrada!');
    } catch (error) {
      showToast('Erro ao salvar manutenção', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSector = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const sector = {
      name: formData.get('name'),
      floor: parseInt(formData.get('floor')),
      description: formData.get('description'),
    };
    if (editingItem) sector.id = editingItem.id;

    try {
      await supabaseService.upsertSector(sector);
      setShowSectorModal(false);
      setEditingItem(null);
      fetchData();
      showToast('Setor salvo!');
    } catch (error) {
      showToast('Erro ao salvar setor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEquip = async (e) => {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const equip = {
      name: formData.get('name'),
      type: formData.get('type'),
      brand: formData.get('brand'),
      model: formData.get('model'),
      serial_number: formData.get('serial_number'),
      sector_id: formData.get('sector_id'),
      assigned_user_name: formData.get('assigned_user_name') || null,
      status: formData.get('status'),
      cpu: formData.get('cpu'),
      ram: formData.get('ram'),
      storage: formData.get('storage'),
      os: formData.get('os'),
    };
    if (editingItem) equip.id = editingItem.id;

    try {
      await supabaseService.upsertEquipment(equip);
      setShowEquipModal(false);
      setEditingItem(null);
      fetchData();
      showToast('Equipamento salvo!');
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      showToast(`Erro ao salvar equipamento: ${error.message || 'Verifique se o número de série é único.'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSector = async (id) => {
    if (!confirm('Excluir este setor excluirá todos os equipamentos vinculados. Continuar?')) return;
    setSaving(true);
    try {
      await supabaseService.deleteSector(id);
      fetchData();
      showToast('Setor excluído!');
    } catch (error) {
      showToast('Erro ao excluir setor', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEquip = async (id) => {
    if (!confirm('Excluir este equipamento?')) return;
    setSaving(true);
    try {
      await supabaseService.deleteEquipment(id);
      fetchData();
      showToast('Equipamento excluído!');
    } catch (error) {
      showToast('Erro ao excluir equipamento', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (equip) => {
    const nextStatus = {
      'active': 'maintenance',
      'maintenance': 'retired',
      'retired': 'active'
    };
    try {
      await supabaseService.upsertEquipment({
        ...equip,
        status: nextStatus[equip.status] || 'active'
      });
      fetchData();
    } catch (error) {
      alert('Erro ao alterar status');
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Inventário de TI - VerdeIT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    const tableData = equipment.map(e => [
      e.name,
      e.type,
      `${e.brand || ''} ${e.model || ''}`,
      e.serial_number,
      `${e.sectors?.name} (${e.sectors?.floor === 0 ? 'Térreo' : `${e.sectors?.floor}º`})`,
      e.status === 'active' ? 'Ativo' : e.status === 'maintenance' ? 'Manutenção' : 'Retirado',
      `${e.cpu || ''} / ${e.ram || ''} / ${e.storage || ''}`
    ]);

    doc.autoTable({
      startY: 35,
      head: [['Nome', 'Tipo', 'Marca/Modelo', 'Série', 'Setor/Andar', 'Status', 'Specs']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }, // Green-500
    });

    doc.save(`inventario-verdeit-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredEquip = equipment.filter(e => {
    const matchesSector = selectedSector === 'all' || e.sector_id === selectedSector;
    const matchesSearch = searchTerm === '' || 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.brand && e.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.model && e.model.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSector && matchesSearch;
  });

  const stats = {
    total: equipment.length,
    active: equipment.filter(e => e.status === 'active').length,
    maintenance: equipment.filter(e => e.status === 'maintenance').length,
    retired: equipment.filter(e => e.status === 'retired').length,
  };

  if (loading) return <div className="p-8 text-center text-text-muted">Carregando inventário...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Gestão de TI</h2>
        <div className="flex bg-surface2 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('sectors')}
            className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all ${activeTab === 'sectors' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            Setores
          </button>
          <button 
            onClick={() => setActiveTab('equipment')}
            className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all ${activeTab === 'equipment' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            Equipamentos
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-border p-3 rounded-2xl relative group">
          <div className="text-[0.65rem] font-bold text-text-muted uppercase mb-1">Total</div>
          <div className="text-xl font-bold">{stats.total}</div>
          <button 
            onClick={handleExport}
            className="absolute top-2 right-2 p-1.5 bg-surface2 text-text-muted rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:text-green"
            title="Exportar Inventário"
          >
            <Download size={14} />
          </button>
        </div>
        <div className="bg-surface border border-border p-3 rounded-2xl">
          <div className="text-[0.65rem] font-bold text-green uppercase mb-1">Ativos</div>
          <div className="text-xl font-bold text-green">{stats.active}</div>
        </div>
        <div className="bg-surface border border-border p-3 rounded-2xl">
          <div className="text-[0.65rem] font-bold text-yellow-500 uppercase mb-1">Manutenção</div>
          <div className="text-xl font-bold text-yellow-500">{stats.maintenance}</div>
        </div>
        <div className="bg-surface border border-border p-3 rounded-2xl">
          <div className="text-[0.65rem] font-bold text-red-500 uppercase mb-1">Retirados</div>
          <div className="text-xl font-bold text-red-500">{stats.retired}</div>
        </div>
      </div>

      {activeTab === 'sectors' ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-text-muted">Gerencie os setores dos 3 andares (Térreo, 1º e 2º).</p>
            <button 
              onClick={() => { setEditingItem(null); setShowSectorModal(true); }}
              className="bg-green/10 text-green p-2 rounded-lg hover:bg-green/20 transition-all flex items-center gap-2 text-sm font-semibold"
            >
              <Plus size={18} /> Novo Setor
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map(floor => (
              <div key={floor} className="bg-surface border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4 text-green">
                  <Layers size={18} />
                  <h3 className="font-bold text-sm uppercase tracking-wider">{floor === 0 ? 'Térreo' : `${floor}º Andar`}</h3>
                </div>
                <div className="space-y-3">
                  {sectors.filter(s => s.floor === floor).map(sector => (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      key={sector.id} 
                      className="flex items-center justify-between p-3 bg-surface2 rounded-xl border border-border hover:border-green/30 transition-all group"
                    >
                      <div>
                        <div className="font-semibold text-sm">{sector.name}</div>
                        <div className="text-[0.7rem] text-text-muted">{sector.description || 'Sem descrição'}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => { setEditingItem(sector); setShowSectorModal(true); }} className="p-1.5 text-text-muted hover:text-green"><Edit2 size={14} /></button>
                        <button onClick={() => handleDeleteSector(sector.id)} className="p-1.5 text-text-muted hover:text-red-500"><Trash2 size={14} /></button>
                      </div>
                    </motion.div>
                  ))}
                  {sectors.filter(s => s.floor === floor).length === 0 && (
                    <div className="text-center py-4 text-[0.75rem] text-text-muted italic">Nenhum setor cadastrado</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <input 
                  type="text"
                  placeholder="Pesquisar equipamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-green"
                />
                <Plus className="absolute left-3 top-2.5 text-text-muted rotate-45" size={16} />
              </div>
              <select 
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-green w-full md:w-48"
              >
                <option value="all">Todos os Setores</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.floor === 0 ? 'Térreo' : `${s.floor}º`})</option>
                ))}
              </select>
            </div>
            <button 
              onClick={() => { setEditingItem(null); setShowEquipModal(true); }}
              className="bg-green text-bg px-4 py-2 rounded-lg hover:bg-green-dim transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-green/20"
            >
              <Plus size={18} /> Novo Equipamento
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquip.map((equip) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={equip.id} 
                className="bg-surface border border-border rounded-2xl p-4 hover:border-green/40 transition-all group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-green/10 text-green rounded-lg">
                    <Monitor size={20} />
                  </div>
                  <button 
                    onClick={() => handleStatusToggle(equip)}
                    className={`text-[0.65rem] font-bold px-2 py-0.5 rounded-full uppercase transition-all hover:scale-105 flex items-center gap-1 ${
                      equip.status === 'active' ? 'bg-green/20 text-green' : 
                      equip.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'
                    }`}
                    title="Clique para alterar status"
                  >
                    {equip.status === 'active' && <CheckCircle2 size={10} />}
                    {equip.status === 'maintenance' && <AlertCircle size={10} />}
                    {equip.status === 'retired' && <Archive size={10} />}
                    {equip.status === 'active' ? 'Ativo' : equip.status === 'maintenance' ? 'Manutenção' : 'Retirado'}
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">{equip.name}</h4>
                  <p className="text-[0.7rem] text-text-muted mb-2">{equip.brand} {equip.model} · SN: {equip.serial_number}</p>
                  
                  {/* Assigned User */}
                  {equip.assigned_user_name && (
                    <div className="flex items-center gap-1.5 text-[0.65rem] text-green bg-green/10 p-1.5 rounded-lg mb-2 inline-flex">
                      <UserIcon size={12} />
                      Usuário: {equip.assigned_user_name}
                    </div>
                  )}

                  {/* Technical Specs */}
                  {(equip.cpu || equip.ram || equip.storage) && (
                    <div className="grid grid-cols-2 gap-2 mb-3 bg-surface2/50 p-2 rounded-xl border border-border/50">
                      {equip.cpu && <div className="text-[0.65rem] text-text-dim"><span className="font-bold">CPU:</span> {equip.cpu}</div>}
                      {equip.ram && <div className="text-[0.65rem] text-text-dim"><span className="font-bold">RAM:</span> {equip.ram}</div>}
                      {equip.storage && <div className="text-[0.65rem] text-text-dim"><span className="font-bold">Disco:</span> {equip.storage}</div>}
                      {equip.os && <div className="text-[0.65rem] text-text-dim"><span className="font-bold">OS:</span> {equip.os}</div>}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-[0.65rem] text-text-dim bg-surface2 p-1.5 rounded-lg inline-flex">
                    <MapPin size={12} />
                    {equip.sectors?.name} ({equip.sectors?.floor === 0 ? 'Térreo' : `${equip.sectors?.floor}º Andar`})
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { setEditingItem(equip); setShowMaintenanceModal(true); fetchMaintenance(equip.id); }}
                      className="text-[0.7rem] font-bold text-green flex items-center gap-1 hover:underline"
                    >
                      <History size={14} /> Histórico
                    </button>
                    <button 
                      onClick={() => onNewTicket(equip.id)}
                      className="text-[0.7rem] font-bold text-blue-500 flex items-center gap-1 hover:underline"
                    >
                      <Plus size={14} /> Chamado
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingItem(equip); setShowEquipModal(true); }} className="p-1.5 text-text-muted hover:text-green"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteEquip(equip.id)} className="p-1.5 text-text-muted hover:text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
              </motion.div>
                  ))}
            {filteredEquip.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-muted flex flex-col items-center gap-3 opacity-50">
                <Monitor size={48} />
                <p>Nenhum equipamento encontrado.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80">
          <div 
            className="bg-surface border border-border rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold">Histórico do Equipamento</h3>
                <p className="text-xs text-text-muted">{editingItem?.name} · {editingItem?.brand} {editingItem?.model}</p>
              </div>
              <button onClick={() => setShowMaintenanceModal(false)} className="p-2 hover:bg-surface2 rounded-full transition-all"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-text-dim">Nova Manutenção</h4>
                <form onSubmit={handleSaveMaintenance} className="space-y-3">
                  <div>
                    <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Data</label>
                    <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} required className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Custo (R$)</label>
                    <input type="number" step="0.01" name="cost" defaultValue="0" className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" />
                  </div>
                  <div>
                    <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Descrição do Serviço</label>
                    <textarea name="description" required className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green h-24 resize-none" placeholder="O que foi feito?" />
                  </div>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="w-full bg-green text-bg p-3 rounded-xl font-bold text-sm shadow-lg shadow-green/20 disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Registrar Manutenção'}
                  </button>
                </form>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-text-dim">Registros de Manutenção</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {maintenanceLogs.map(log => (
                      <div key={log.id} className="bg-surface2 border border-border rounded-xl p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[0.7rem] font-bold text-green">{new Date(log.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[0.7rem] font-mono text-text-muted">R$ {log.cost.toFixed(2)}</span>
                        </div>
                        <p className="text-[0.8rem] text-text leading-relaxed">{log.description}</p>
                        <div className="mt-2 text-[0.6rem] text-text-muted flex items-center gap-1">
                          <UserIcon size={10} /> {log.profiles?.name || 'Técnico'}
                        </div>
                      </div>
                    ))}
                    {maintenanceLogs.length === 0 && (
                      <div className="text-center py-4 text-text-muted italic text-xs">Nenhum registro de manutenção.</div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold mb-3 uppercase tracking-wider text-text-dim">Chamados Vinculados</h4>
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                    {equipmentTickets.map(tk => (
                      <div key={tk.id} className="bg-surface2 border border-border rounded-xl p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[0.7rem] font-bold text-green">#{tk.ref}</span>
                          <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full border ${
                            tk.status === 'resolved' ? 'bg-green/10 text-green border-green/20' : 'bg-amber/10 text-amber border-amber/20'
                          }`}>
                            {tk.status === 'resolved' ? 'Resolvido' : 'Em Aberto'}
                          </span>
                        </div>
                        <p className="text-[0.8rem] text-text leading-relaxed">{tk.description}</p>
                        <div className="mt-2 text-[0.6rem] text-text-muted flex justify-between">
                          <span>{new Date(tk.created_at).toLocaleDateString('pt-BR')}</span>
                          <span>Técnico: {tk.profiles?.name}</span>
                        </div>
                      </div>
                    ))}
                    {equipmentTickets.length === 0 && (
                      <div className="text-center py-4 text-text-muted italic text-xs">Nenhum chamado vinculado.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sector Modal */}
      {showSectorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80">
          <div 
            className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-lg font-bold mb-4">{editingItem ? 'Editar Setor' : 'Novo Setor'}</h3>
            <form onSubmit={handleSaveSector} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Nome do Setor</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green" placeholder="Ex: Financeiro, TI, RH" />
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Andar</label>
                <select name="floor" defaultValue={editingItem?.floor || 0} className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green">
                  <option value={0}>Térreo</option>
                  <option value={1}>1º Andar</option>
                  <option value={2}>2º Andar</option>
                </select>
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Descrição (Opcional)</label>
                <textarea name="description" defaultValue={editingItem?.description} className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green h-24 resize-none" placeholder="Breve descrição do setor..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSectorModal(false)} className="flex-1 bg-surface2 text-text-dim p-3 rounded-xl font-bold text-sm hover:bg-border transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-green text-bg p-3 rounded-xl font-bold text-sm shadow-lg shadow-green/20 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {showEquipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80">
          <div 
            className="bg-surface border border-border rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold mb-4">{editingItem ? 'Editar Equipamento' : 'Novo Equipamento'}</h3>
            <form onSubmit={handleSaveEquip} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Nome/ID</label>
                  <input name="name" defaultValue={editingItem?.name} required className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" placeholder="PC-FIN-01" />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Tipo</label>
                  <select name="type" defaultValue={editingItem?.type || 'PC'} className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green">
                    <option value="PC">Desktop</option>
                    <option value="Laptop">Notebook</option>
                    <option value="Printer">Impressora</option>
                    <option value="Server">Servidor</option>
                    <option value="Network">Rede (Switch/Router)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Marca</label>
                  <input name="brand" defaultValue={editingItem?.brand} className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" placeholder="Dell, HP, etc" />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Modelo</label>
                  <input name="model" defaultValue={editingItem?.model} className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" placeholder="Optiplex 3080" />
                </div>
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Nº de Série</label>
                <input name="serial_number" defaultValue={editingItem?.serial_number} required className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" placeholder="TAG / Serial" />
              </div>

              {/* Technical Specs Section */}
              <div className="bg-surface2/50 p-4 rounded-2xl border border-border space-y-3">
                <h4 className="text-[0.65rem] font-bold text-text-muted uppercase tracking-wider">Especificações Técnicas</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.65rem] text-text-dim mb-1">Processador (CPU)</label>
                    <input name="cpu" defaultValue={editingItem?.cpu} className="w-full bg-surface2 border border-border rounded-xl p-2 text-[0.8rem] outline-none focus:border-green" placeholder="i5-10400, Ryzen 5" />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] text-text-dim mb-1">Memória (RAM)</label>
                    <input name="ram" defaultValue={editingItem?.ram} className="w-full bg-surface2 border border-border rounded-xl p-2 text-[0.8rem] outline-none focus:border-green" placeholder="8GB, 16GB DDR4" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.65rem] text-text-dim mb-1">Armazenamento</label>
                    <input name="storage" defaultValue={editingItem?.storage} className="w-full bg-surface2 border border-border rounded-xl p-2 text-[0.8rem] outline-none focus:border-green" placeholder="256GB SSD, 1TB HDD" />
                  </div>
                  <div>
                    <label className="block text-[0.65rem] text-text-dim mb-1">Sist. Operacional</label>
                    <input name="os" defaultValue={editingItem?.os} className="w-full bg-surface2 border border-border rounded-xl p-2 text-[0.8rem] outline-none focus:border-green" placeholder="Windows 11, Ubuntu 22.04" />
                  </div>
                </div>
              </div>

                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Setor</label>
                  <select name="sector_id" defaultValue={editingItem?.sector_id} required className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green">
                    <option value="">Selecione um setor...</option>
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.floor === 0 ? 'Térreo' : `${s.floor}º Andar`})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Usuário Responsável</label>
                  <input 
                    name="assigned_user_name" 
                    defaultValue={editingItem?.assigned_user_name} 
                    className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" 
                    placeholder="Nome do servidor responsável" 
                  />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Status</label>
                <select name="status" defaultValue={editingItem?.status || 'active'} className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green">
                  <option value="active">Ativo</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="retired">Retirado / Sucata</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEquipModal(false)} className="flex-1 bg-surface2 text-text-dim p-3 rounded-xl font-bold text-sm hover:bg-border transition-all">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 bg-green text-bg p-3 rounded-xl font-bold text-sm shadow-lg shadow-green/20 disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
