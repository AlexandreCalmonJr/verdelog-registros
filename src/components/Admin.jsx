import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Eye, 
  EyeOff, 
  Home, 
  Clock, 
  Monitor, 
  Package, 
  ClipboardList, 
  FileText,
  History,
  Info,
  BookOpen,
  ShieldAlert,
  Users,
  UserCog,
  Edit2,
  X
} from 'lucide-react';
import { supabaseService } from '../lib/supabaseService';

export default function Admin({ enabledModules, onToggleModule, profile }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (profile?.role === 'admin_sistema' || profile?.role === 'admin_ti') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [profile]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real app, you might need a specific Edge Function to fetch all profiles if RLS restricts it.
      // For this implementation, we assume the admin has RLS bypass or a policy allows reading all profiles.
      const { data, error } = await supabaseService.supabase.from('profiles').select('*').order('name');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabaseService.supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('Nível de acesso atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar nível de acesso: ' + error.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      const { error } = await supabaseService.supabase
        .from('profiles')
        .update({ 
          name: editingUser.name, 
          cargo: editingUser.cargo,
          role: editingUser.role
        })
        .eq('id', editingUser.id);
        
      if (error) throw error;
      
      setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
      setEditingUser(null);
      alert('Usuário atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar usuário: ' + error.message);
    }
  };

  const modules = [
    { id: 'home', icon: <Home size={18} />, label: 'Início', description: 'Painel principal com estatísticas' },
    { id: 'ponto', icon: <Clock size={18} />, label: 'Ponto', description: 'Registro de entrada e saída' },
    { id: 'inventario', icon: <Monitor size={18} />, label: 'Inventário', description: 'Gestão de equipamentos e setores' },
    { id: 'logistica', icon: <Package size={18} />, label: 'Logística', description: 'Estoque de insumos e movimentações' },
    { id: 'chamados', icon: <ClipboardList size={18} />, label: 'Chamados', description: 'Gestão de tickets de suporte' },
    { id: 'historico', icon: <History size={18} />, label: 'Histórico', description: 'Histórico de registros de ponto' },
    { id: 'relatorio', icon: <FileText size={18} />, label: 'Relatórios', description: 'Geração de relatórios em PDF' },
    { id: 'admin', icon: <Settings size={18} />, label: 'Administrativo', description: 'Configurações de visibilidade do sistema' },
    { id: 'tutorial', icon: <BookOpen size={18} />, label: 'Tutorial', description: 'Guia de uso de todas as funções' },
  ];

  const [activeTab, setActiveTab] = useState('modules'); // 'modules', 'users'

  if (profile?.role !== 'admin_sistema' && profile?.role !== 'admin_ti') {
    return (
      <div className="p-8 text-center bg-surface border border-border rounded-3xl">
        <ShieldAlert className="mx-auto text-red-500 mb-4" size={48} />
        <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
        <p className="text-text-muted">Você não tem permissão para acessar o painel administrativo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green/10 text-green rounded-lg">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">Painel Administrativo</h2>
            <p className="text-sm text-text-muted">Gerencie módulos e permissões de usuários.</p>
          </div>
        </div>
        <div className="flex bg-surface2 p-1 rounded-xl border border-border">
          <button 
            onClick={() => setActiveTab('modules')}
            className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all ${activeTab === 'modules' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            Módulos
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-1.5 rounded-lg text-[0.85rem] font-medium transition-all ${activeTab === 'users' ? 'bg-green text-bg shadow-lg' : 'text-text-muted hover:text-text'}`}
          >
            Usuários
          </button>
        </div>
      </div>

      {activeTab === 'modules' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((mod) => (
          <div 
            key={mod.id}
            className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
              enabledModules[mod.id] 
                ? 'bg-surface border-green/30 shadow-lg shadow-green/5' 
                : 'bg-surface/50 border-border opacity-70'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${enabledModules[mod.id] ? 'bg-green/10 text-green' : 'bg-surface2 text-text-muted'}`}>
                {mod.icon}
              </div>
              <div>
                <div className="font-bold text-sm">{mod.label}</div>
                <div className="text-[0.7rem] text-text-muted">{mod.description}</div>
              </div>
            </div>
            
            <button
              onClick={() => {
                if (['home', 'admin', 'tutorial'].includes(mod.id)) return;
                onToggleModule(mod.id);
              }}
              disabled={['home', 'admin', 'tutorial'].includes(mod.id)}
              className={`p-2.5 rounded-xl transition-all ${
                enabledModules[mod.id]
                  ? 'bg-green text-bg shadow-lg shadow-green/20'
                  : 'bg-surface2 text-text-muted hover:text-text'
              } ${['home', 'admin', 'tutorial'].includes(mod.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {enabledModules[mod.id] ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-amber/10 border border-amber/20 p-4 rounded-2xl flex gap-3 items-start">
        <Info className="text-amber shrink-0" size={18} />
        <p className="text-[0.75rem] text-amber/90 leading-relaxed">
          <strong>Nota:</strong> Desativar um módulo apenas o remove do menu de navegação. 
          Os dados salvos no banco de dados não serão afetados e você poderá reativá-los a qualquer momento.
        </p>
      </div>

          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-3 items-start mt-4">
            <ShieldAlert className="text-red-500 shrink-0" size={18} />
            <div className="text-[0.75rem] text-red-500/90 leading-relaxed">
              <strong className="block mb-1 text-red-500">Segurança de Dados (RLS)</strong>
              <p>Para evitar roubo de dados sensíveis (como CPF e e-mails), é fundamental ativar o <strong>Row Level Security (RLS)</strong> no painel do Supabase. O RLS garante que cada usuário só possa ler e editar os dados que lhe pertencem.</p>
              <ul className="list-disc pl-4 mt-2 space-y-1 opacity-80">
                <li>Acesse o painel do Supabase &gt; Authentication &gt; Policies.</li>
                <li>Ative o RLS para todas as tabelas (profiles, logs, tickets, etc).</li>
                <li>Crie políticas permitindo acesso apenas onde <code className="bg-red-500/20 px-1 rounded">auth.uid() = user_id</code>.</li>
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-6 text-green">
            <Users size={20} />
            <h3 className="font-bold text-lg">Gestão de Usuários e Permissões</h3>
          </div>
          
          {loading ? (
            <div className="text-center py-8 text-text-muted">Carregando usuários...</div>
          ) : (
            <div className="overflow-x-auto">
              <div className="bg-amber/10 border border-amber/20 p-4 rounded-2xl flex gap-3 items-start mb-6">
                <Info className="text-amber shrink-0" size={18} />
                <p className="text-[0.75rem] text-amber/90 leading-relaxed">
                  <strong>Nota sobre criação de usuários:</strong> Por motivos de segurança, novos usuários devem ser convidados ou criados diretamente pelo painel do Supabase (Authentication &gt; Add User). Após a criação, eles aparecerão aqui para edição de nome, cargo e permissões.
                </p>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-text-muted">
                    <th className="pb-3 font-semibold">Nome / E-mail</th>
                    <th className="pb-3 font-semibold">Cargo</th>
                    <th className="pb-3 font-semibold">Nível de Acesso</th>
                    <th className="pb-3 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                      <td className="py-4">
                        <div className="font-bold">{u.name || 'Sem nome'}</div>
                        <div className="text-xs text-text-muted">{u.email}</div>
                      </td>
                      <td className="py-4 text-text-dim">{u.cargo || '—'}</td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-surface2 border border-border rounded-md text-xs">
                          {u.role === 'admin_sistema' ? 'Admin do Sistema' : 
                           u.role === 'admin_ti' ? 'Admin de TI' : 
                           u.role === 'tecnico_ti' ? 'Técnico de TI' : 'Colaborador'}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => setEditingUser(u)}
                          className="p-2 text-text-muted hover:text-green hover:bg-green/10 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border2 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-surface2/50">
              <h3 className="font-bold">Editar Usuário</h3>
              <button onClick={() => setEditingUser(null)} className="p-1 hover:bg-surface rounded-lg text-text-muted">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">E-mail (Apenas Leitura)</label>
                <input 
                  type="text" 
                  value={editingUser.email} 
                  disabled
                  className="w-full bg-surface2 border border-border rounded-lg p-2.5 text-sm text-text-muted cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Nome Completo</label>
                <input 
                  type="text" 
                  value={editingUser.name || ''} 
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm outline-none focus:border-green"
                  placeholder="Nome do usuário"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Cargo / Função</label>
                <input 
                  type="text" 
                  value={editingUser.cargo || ''} 
                  onChange={(e) => setEditingUser({...editingUser, cargo: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm outline-none focus:border-green"
                  placeholder="Ex: Analista de TI"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-muted uppercase mb-1.5">Nível de Acesso</label>
                <select 
                  value={editingUser.role || 'colaborador'} 
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                  disabled={profile?.role !== 'admin_sistema' && editingUser.role === 'admin_sistema'}
                  className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm outline-none focus:border-green disabled:opacity-50"
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="tecnico_ti">Técnico de TI</option>
                  <option value="admin_ti">Admin de TI</option>
                  {profile?.role === 'admin_sistema' && (
                    <option value="admin_sistema">Admin do Sistema</option>
                  )}
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-text-muted hover:bg-surface2 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-green text-bg hover:bg-green-dim transition-colors"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
