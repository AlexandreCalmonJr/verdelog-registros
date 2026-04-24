import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseService } from '../lib/supabaseService';
import { Plus, Monitor, MapPin, Trash2, Edit2, History, ChevronRight, Layers, X, User as UserIcon, Download, CheckCircle2, AlertCircle, Archive, QrCode, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { ShieldAlert } from 'lucide-react';

export default function Inventory({ user, profile, onNewTicket, showToast }) {
  const [sectors, setSectors] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('sectors'); // sectors, equipment
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showEquipModal, setShowEquipModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelItem, setLabelItem] = useState(null);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [equipmentTickets, setEquipmentTickets] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedSector, setSelectedSector] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.role === 'admin_sistema' || profile?.role === 'admin_ti' || profile?.role === 'tecnico_ti') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [profile]);

  if (profile?.role !== 'admin_sistema' && profile?.role !== 'admin_ti' && profile?.role !== 'tecnico_ti') {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-3xl">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-text-muted">Você não tem permissão para acessar o inventário.</p>
      </div>
    );
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([
        supabaseService.getSectors(),
        supabaseService.getEquipment()
      ]);
      setSectors(s || []);
      setEquipment(e || []);
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
      patrimony_number: formData.get('patrimony_number') || null,
      sector_id: formData.get('sector_id') || null,
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
      
      // Automatic Movement Logging
      if (editingItem) {
        let movementDescription = [];
        if (editingItem.sector_id !== equip.sector_id) {
          const oldSector = sectors.find(s => s.id === editingItem.sector_id)?.name || 'Nenhum';
          const newSector = sectors.find(s => s.id === equip.sector_id)?.name || 'Nenhum';
          movementDescription.push(`Setor alterado de "${oldSector}" para "${newSector}"`);
        }
        if (editingItem.assigned_user_name !== equip.assigned_user_name) {
          const oldUser = editingItem.assigned_user_name || 'Nenhum';
          const newUser = equip.assigned_user_name || 'Nenhum';
          movementDescription.push(`Usuário alterado de "${oldUser}" para "${newUser}"`);
        }
        if (editingItem.status !== equip.status) {
          const statusMap = { active: 'Ativo', maintenance: 'Manutenção', retired: 'Retirado' };
          movementDescription.push(`Status alterado de "${statusMap[editingItem.status]}" para "${statusMap[equip.status]}"`);
        }

        if (movementDescription.length > 0) {
          await supabaseService.createMaintenanceLog({
            equipment_id: equip.id,
            user_id: user.id,
            description: `Movimentação Automática: ${movementDescription.join(' | ')}`,
            cost: 0,
            date: new Date().toISOString().split('T')[0]
          });
        }
      }

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
    const newStatus = nextStatus[equip.status] || 'active';
    try {
      await supabaseService.upsertEquipment({
        ...equip,
        status: newStatus
      });

      // Log the status change
      const statusMap = { active: 'Ativo', maintenance: 'Manutenção', retired: 'Retirado' };
      await supabaseService.createMaintenanceLog({
        equipment_id: equip.id,
        user_id: user.id,
        description: `Movimentação Automática: Status alterado de "${statusMap[equip.status]}" para "${statusMap[newStatus]}"`,
        cost: 0,
        date: new Date().toISOString().split('T')[0]
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

    autoTable(doc, {
      startY: 35,
      head: [['Nome', 'Tipo', 'Marca/Modelo', 'Série', 'Setor/Andar', 'Status', 'Specs']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [34, 197, 94] }, // Green-500
    });

    doc.save(`inventario-verdeit-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const fileInputRef = React.useRef(null);

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setSaving(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      let importedCount = 0;
      let currentSectors = [...sectors];

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }); // read all including blanks

        let floor = 0;
        const lowerSheet = sheetName.toLowerCase();
        if (lowerSheet.includes('1')) floor = 1;
        else if (lowerSheet.includes('2')) floor = 2;

        for (const row of rows) {
          const patrimonyStr = String(row['Patrimônio'] || '').trim();
          if (!patrimonyStr) continue;
          
          let sectorName = String(row['Setor'] || '').trim().toUpperCase();
          if (!sectorName) sectorName = 'GERAL';

          let sectorOpt = currentSectors.find(s => s.name.toUpperCase() === sectorName && s.floor === floor);
          let sectorId = null;
          if (sectorOpt) {
            sectorId = sectorOpt.id;
          } else {
            const newSectorData = await supabaseService.upsertSector({
              name: sectorName,
              floor: floor,
              description: `Importado da aba ${sheetName}`
            });
            sectorId = newSectorData[0]?.id || newSectorData.id;
            if(sectorId) {
               currentSectors.push({ id: sectorId, name: sectorName, floor: floor });
            }
          }

          const equipStatus = String(row['Funcionamento'] || '').toLowerCase().includes('sim') || String(row['Funcionamento'] || '').toLowerCase() === '' ? 'active' : 'maintenance';
          const equipType = String(row['Modelo'] || 'OUTRO');

          // Serial number shouldn't be exactly the patrimony to avoid clash with real SNs, let's prefix it if missing
          const sn = `IMP-${patrimonyStr}-${Math.floor(Math.random() * 10000)}`;

          const equipToSave = {
            patrimony_number: patrimonyStr,
            name: `${equipType} - ${patrimonyStr}`,
            type: equipType,
            sector_id: sectorId,
            assigned_user_name: String(row['User'] || '').trim() || null,
            status: equipStatus,
            serial_number: sn
          };
          
          await supabaseService.upsertEquipment(equipToSave);
          importedCount++;
        }
      }
      showToast(`${importedCount} equipamentos importados!`);
      fetchData(); 
    } catch (error) {
      console.error('Erro na importação:', error);
      showToast('Erro ao importar planilha', 'error');
    } finally {
      setLoading(false);
      setSaving(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePrintLabel = () => {
    const content = document.getElementById('printable-label-content').innerHTML;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir a etiqueta.');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Etiqueta - ${labelItem.name}</title>
          <style>
            @page { margin: 0; size: auto; }
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #fff; color: #000; }
            .label-container { text-align: center; padding: 20px; width: 100%; max-width: 300px; }
            .title { font-weight: bold; font-size: 20px; margin-bottom: 4px; }
            .subtitle { font-size: 12px; color: #444; margin-bottom: 16px; }
            .qr-wrapper { margin-bottom: 16px; display: flex; justify-content: center; }
            .barcode-wrapper { display: flex; justify-content: center; margin-bottom: 8px; }
            .footer { font-size: 10px; color: #666; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="label-container">
            ${content}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredEquip = equipment.filter(e => {
    const matchesSector = selectedSector === 'all' || e.sector_id === selectedSector;
    const matchesStatus = selectedStatus === 'all' || e.status === selectedStatus;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || 
      (e.name && e.name.toLowerCase().includes(searchLower)) ||
      (e.type && e.type.toLowerCase().includes(searchLower)) ||
      (e.serial_number && e.serial_number.toLowerCase().includes(searchLower)) ||
      (e.brand && e.brand.toLowerCase().includes(searchLower)) ||
      (e.model && e.model.toLowerCase().includes(searchLower));
    return matchesSector && matchesStatus && matchesSearch;
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
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-surface2 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-green w-full md:w-40"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="maintenance">Manutenção</option>
                <option value="retired">Retirado</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                onChange={handleImportExcel} 
                ref={fileInputRef} 
                className="hidden" 
                id="import-excel"
              />
              <button
                onClick={async () => {
                  if (!window.confirm("Essa ação apagará todos os equipamentos e setores criados através da importação de planilhas. Deseja continuar?")) return;
                  setLoading(true);
                  try {
                    const { error: e1 } = await supabaseService.supabase.from('equipment').delete().like('serial_number', 'IMP-%');
                    if (e1) throw e1;
                    const { error: e2 } = await supabaseService.supabase.from('sectors').delete().like('description', 'Importado da aba%');
                    if (e2) throw e2;
                    showToast("Dados da planilha removidos com sucesso!");
                    fetchData();
                  } catch(err) {
                    console.error(err);
                    showToast("Erro ao tentar reverter importação: " + err.message, "error");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-red/10 text-red px-4 py-2 border border-red/20 rounded-lg hover:bg-red/20 transition-all flex items-center gap-2 text-sm font-bold"
              >
                <Trash2 size={18} /> Reverter Planilha
              </button>
              <label 
                htmlFor="import-excel"
                className="bg-surface2 border border-border text-text px-4 py-2 rounded-lg hover:border-green/50 hover:text-green cursor-pointer transition-all flex items-center gap-2 text-sm font-bold"
              >
                <Download className="rotate-180" size={18} /> Importar Excel
              </label>
              <button 
                onClick={() => { setEditingItem(null); setShowEquipModal(true); }}
                className="bg-green text-bg px-4 py-2 rounded-lg hover:bg-green-dim transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-green/20"
              >
                <Plus size={18} /> Novo Equipamento
              </button>
            </div>
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
                  <p className="text-[0.7rem] text-text-muted mb-2">
                    {equip.brand} {equip.model} · SN: {equip.serial_number}
                    {equip.patrimony_number && (
                      <span className="block mt-0.5 text-green font-semibold">
                        Patrimônio: {equip.patrimony_number}
                      </span>
                    )}
                  </p>
                  
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
                      onClick={() => { setLabelItem(equip); setShowLabelModal(true); }}
                      className="text-[0.7rem] font-bold text-text-dim flex items-center gap-1 hover:text-text transition-all"
                      title="Gerar Etiqueta"
                    >
                      <QrCode size={14} /> Etiqueta
                    </button>
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Nº de Série</label>
                  <input name="serial_number" defaultValue={editingItem?.serial_number} required className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" placeholder="TAG / Serial" />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Nº Patrimônio (Plaqueta)</label>
                  <input name="patrimony_number" defaultValue={editingItem?.patrimony_number} className="w-full bg-surface2 border border-border rounded-xl p-2.5 text-sm outline-none focus:border-green" placeholder="Ex: 123456" />
                </div>
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

      {/* Label Modal */}
      {showLabelModal && labelItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80">
          <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Etiqueta de Patrimônio</h3>
              <button onClick={() => setShowLabelModal(false)} className="p-2 hover:bg-surface2 rounded-full transition-all"><X size={20} /></button>
            </div>
            
            {/* Printable Area Preview */}
            <div className="bg-white p-6 rounded-2xl flex flex-col items-center text-black border-2 border-dashed border-border mb-6">
              <div id="printable-label-content" className="w-full flex flex-col items-center">
                <div className="title" style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px' }}>{labelItem.name}</div>
                <div className="subtitle" style={{ fontSize: '12px', color: '#444', marginBottom: '8px' }}>{labelItem.brand} {labelItem.model}</div>
                
                {labelItem.patrimony_number && (
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', backgroundColor: '#eee', padding: '4px 12px', borderRadius: '4px' }}>
                    PATRIMÔNIO: {labelItem.patrimony_number}
                  </div>
                )}
                
                <div className="qr-wrapper" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                  <QRCodeSVG value={labelItem.patrimony_number || labelItem.id} size={120} level="M" />
                </div>
                
                <div className="barcode-wrapper" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                  <Barcode value={labelItem.patrimony_number || labelItem.serial_number || labelItem.name} width={1.5} height={40} fontSize={12} displayValue={true} background="#ffffff" lineColor="#000000" margin={0} />
                </div>
                
                <div className="footer" style={{ fontSize: '10px', color: '#666', marginTop: '8px' }}>VerdeIT - Gestão de Ativos</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowLabelModal(false)} className="flex-1 bg-surface2 text-text-dim p-3 rounded-xl font-bold text-sm hover:bg-border transition-all">Fechar</button>
              <button 
                onClick={handlePrintLabel}
                className="flex-1 bg-green text-bg p-3 rounded-xl font-bold text-sm shadow-lg shadow-green/20 flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
