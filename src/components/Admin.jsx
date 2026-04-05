import React from 'react';
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
  Info
} from 'lucide-react';

export default function Admin({ enabledModules, onToggleModule }) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-green/10 text-green rounded-lg">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold">Painel Administrativo</h2>
          <p className="text-sm text-text-muted">Personalize quais módulos aparecem no seu menu lateral.</p>
        </div>
      </div>

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
    </div>
  );
}
