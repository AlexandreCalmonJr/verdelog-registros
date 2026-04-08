import React, { useState, useEffect } from 'react';
import { supabaseService } from '../lib/supabaseService';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowRightLeft, 
  Search, 
  AlertTriangle,
  ChevronRight,
  X,
  History,
  ShieldAlert
} from 'lucide-react';

export default function Logistics({ user, profile }) {
  const [supplies, setSupplies] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // stock, movements
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
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
        <p className="text-text-muted">Você não tem permissão para acessar a logística.</p>
      </div>
    );
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        supabaseService.getSupplies(),
        supabaseService.getMovements()
      ]);
      setSupplies(s || []);
      setMovements(m || []);
    } catch (error) {
      console.error('Erro ao carregar logística:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSupply = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const supply = {
      name: formData.get('name'),
      category: formData.get('category'),
      quantity: parseInt(formData.get('quantity')),
      min_quantity: parseInt(formData.get('min_quantity')),
      unit: formData.get('unit'),
      location: formData.get('location'),
    };
    if (editingItem) supply.id = editingItem.id;

    try {
      await supabaseService.upsertSupply(supply);
      setShowSupplyModal(false);
      setEditingItem(null);
      fetchData();
    } catch (error) {
      alert('Erro ao salvar insumo');
    }
  };

  const handleDeleteSupply = async (id) => {
    if (!confirm('Excluir este insumo do estoque?')) return;
    try {
      await supabaseService.deleteSupply(id);
      fetchData();
    } catch (error) {
      alert('Erro ao excluir insumo');
    }
  };

  const filteredSupplies = supplies.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center text-text-muted">Carregando logística...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Logística e Estoque</h2>
        <div className="flex bg-surface2 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all ${activeTab === 'stock' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            Estoque
          </button>
          <button 
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all ${activeTab === 'movements' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            Movimentações
          </button>
        </div>
      </div>

      {activeTab === 'stock' ? (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:w-64">
              <input 
                type="text"
                placeholder="Pesquisar insumo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface2 border border-border rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-green"
              />
              <Search className="absolute left-3 top-2.5 text-text-muted" size={16} />
            </div>
            <button 
              onClick={() => { setEditingItem(null); setShowSupplyModal(true); }}
              className="bg-green text-bg px-4 py-2 rounded-lg hover:bg-green-dim transition-all flex items-center gap-2 text-sm font-bold shadow-lg shadow-green/20"
            >
              <Plus size={18} /> Novo Insumo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSupplies.map(supply => (
              <div key={supply.id} className="bg-surface border border-border rounded-2xl p-4 hover:border-green/40 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                    <Package size={20} />
                  </div>
                  {supply.quantity <= supply.min_quantity && (
                    <div className="flex items-center gap-1 text-[0.6rem] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full uppercase">
                      <AlertTriangle size={10} /> Estoque Baixo
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-1">{supply.name}</h4>
                  <p className="text-[0.7rem] text-text-muted mb-3 uppercase tracking-wider">{supply.category} · {supply.location || 'Sem local'}</p>
                  
                  <div className="flex items-end justify-between">
                    <div className="space-y-1">
                      <div className="text-[0.6rem] text-text-muted uppercase font-bold">Quantidade</div>
                      <div className={`text-xl font-bold ${supply.quantity <= supply.min_quantity ? 'text-red-500' : 'text-text'}`}>
                        {supply.quantity} <span className="text-xs font-normal text-text-muted">{supply.unit}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingItem(supply); setShowSupplyModal(true); }} className="p-2 text-text-muted hover:text-green hover:bg-surface2 rounded-lg transition-all"><Edit2 size={14} /></button>
                      <button onClick={() => handleDeleteSupply(supply.id)} className="p-2 text-text-muted hover:text-red-500 hover:bg-surface2 rounded-lg transition-all"><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filteredSupplies.length === 0 && (
              <div className="col-span-full py-12 text-center text-text-muted flex flex-col items-center gap-3 opacity-50">
                <Package size={48} />
                <p>Nenhum insumo encontrado no estoque.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-surface border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border bg-surface2/50 flex items-center gap-2">
              <History size={18} className="text-text-muted" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Histórico de Movimentações</h3>
            </div>
            <div className="divide-y divide-border">
              {movements.map(move => (
                <div key={move.id} className="p-4 hover:bg-surface2 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                        <ArrowRightLeft size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{move.equipment?.name}</div>
                        <div className="text-[0.7rem] text-text-muted">SN: {move.equipment?.serial_number}</div>
                      </div>
                    </div>
                    <div className="text-[0.7rem] text-text-muted font-mono">
                      {new Date(move.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[0.75rem] bg-surface2/50 p-2 rounded-xl border border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[0.6rem] uppercase font-bold text-text-dim">Origem</span>
                      <span>{move.from_sector?.name || 'Externo'}</span>
                    </div>
                    <ChevronRight size={14} className="text-text-muted" />
                    <div className="flex flex-col">
                      <span className="text-[0.6rem] uppercase font-bold text-text-dim">Destino</span>
                      <span>{move.to_sector?.name}</span>
                    </div>
                  </div>
                  {move.reason && (
                    <p className="mt-2 text-[0.7rem] text-text-muted italic">" {move.reason} "</p>
                  )}
                  <div className="mt-2 text-[0.65rem] text-text-dim flex items-center gap-1">
                    <div className="w-4 h-4 bg-surface rounded-full border border-border flex items-center justify-center text-[0.5rem] font-bold">
                      {move.user?.name?.[0]}
                    </div>
                    Movido por {move.user?.name}
                  </div>
                </div>
              ))}
              {movements.length === 0 && (
                <div className="p-12 text-center text-text-muted italic text-sm">Nenhuma movimentação registrada.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Supply Modal */}
      {showSupplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/80">
          <div 
            className="bg-surface border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            <h3 className="text-lg font-bold mb-4">{editingItem ? 'Editar Insumo' : 'Novo Insumo'}</h3>
            <form onSubmit={handleSaveSupply} className="space-y-4">
              <div>
                <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Nome do Item</label>
                <input name="name" defaultValue={editingItem?.name} required className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green" placeholder="Ex: Mouse USB, Cabo HDMI" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Categoria</label>
                  <select name="category" defaultValue={editingItem?.category || 'Periféricos'} className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green">
                    <option value="Periféricos">Periféricos</option>
                    <option value="Cabos">Cabos</option>
                    <option value="Componentes">Componentes</option>
                    <option value="Suprimentos">Suprimentos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Unidade</label>
                  <input name="unit" defaultValue={editingItem?.unit || 'un'} className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green" placeholder="un, m, kg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Quantidade Atual</label>
                  <input type="number" name="quantity" defaultValue={editingItem?.quantity || 0} required className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green" />
                </div>
                <div>
                  <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Qtd. Mínima</label>
                  <input type="number" name="min_quantity" defaultValue={editingItem?.min_quantity || 5} required className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green" />
                </div>
              </div>
              <div>
                <label className="block text-[0.7rem] font-bold text-text-muted uppercase mb-1">Localização</label>
                <input name="location" defaultValue={editingItem?.location} className="w-full bg-surface2 border border-border rounded-xl p-3 text-sm outline-none focus:border-green" placeholder="Ex: Armário A, Gaveta 2" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowSupplyModal(false)} className="flex-1 bg-surface2 text-text-dim p-3 rounded-xl font-bold text-sm hover:bg-border transition-all">Cancelar</button>
                <button type="submit" className="flex-1 bg-green text-bg p-3 rounded-xl font-bold text-sm shadow-lg shadow-green/20">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
