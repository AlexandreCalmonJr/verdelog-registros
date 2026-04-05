import React, { useState } from 'react';
import { 
  BookOpen, 
  ChevronRight, 
  Clock, 
  Monitor, 
  Package, 
  ClipboardList, 
  FileText, 
  User, 
  Settings,
  HelpCircle,
  Search
} from 'lucide-react';

export default function Tutorial() {
  const [activeSection, setActiveSection] = useState('ponto');

  const tutorials = [
    {
      id: 'ponto',
      icon: <Clock size={20} />,
      title: 'Registro de Ponto',
      content: [
        {
          step: '1. Iniciar Turno',
          description: 'Na aba "Ponto", clique no botão verde "Iniciar Turno" para começar o seu dia de trabalho. O sistema registrará o horário exato de entrada.'
        },
        {
          step: '2. Registrar Atividades',
          description: 'Enquanto estiver em turno, você pode abrir chamados ou registrar ações. Ao final do dia, clique em "Encerrar Turno".'
        },
        {
          step: '3. Resumo Diário',
          description: 'Ao encerrar, o sistema pedirá um resumo das suas atividades. Esse resumo será vinculado ao seu registro de horas para relatórios futuros.'
        }
      ]
    },
    {
      id: 'inventario',
      icon: <Monitor size={20} />,
      title: 'Gestão de Inventário',
      content: [
        {
          step: '1. Cadastrar Setores',
          description: 'Antes de adicionar equipamentos, defina os setores da empresa (ex: TI, RH, Financeiro) e em qual andar eles ficam.'
        },
        {
          step: '2. Adicionar Equipamentos',
          description: 'Cadastre computadores, notebooks e outros itens. Você pode inserir o nome do responsável manualmente e o número de série.'
        },
        {
          step: '3. Histórico de Manutenção',
          description: 'Cada equipamento tem um botão "Histórico". Lá você registra consertos e vê todos os chamados que já foram abertos para aquele item.'
        }
      ]
    },
    {
      id: 'logistica',
      icon: <Package size={20} />,
      title: 'Logística e Estoque',
      content: [
        {
          step: '1. Controle de Insumos',
          description: 'Gerencie o estoque de mouses, teclados, cabos e toners. Defina uma quantidade mínima para receber alertas de estoque baixo.'
        },
        {
          step: '2. Movimentações',
          description: 'Sempre que um equipamento mudar de setor, registre a movimentação para manter o rastreio de onde cada item está.'
        }
      ]
    },
    {
      id: 'chamados',
      icon: <ClipboardList size={20} />,
      title: 'Sistema de Chamados',
      content: [
        {
          step: '1. Abertura de Tickets',
          description: 'Registre problemas relatados pelos usuários. Você pode vincular um chamado a um equipamento específico do inventário.'
        },
        {
          step: '2. Status do Chamado',
          description: 'Mantenha os chamados atualizados como "Aberto", "Pendente" ou "Resolvido". Chamados resolvidos durante o turno são vinculados ao seu ponto.'
        }
      ]
    },
    {
      id: 'admin',
      icon: <Settings size={20} />,
      title: 'Administração',
      content: [
        {
          step: '1. Personalizar Menu',
          description: 'Se você não usa certas funções (como o Ponto), pode desativá-las na aba "Administrativo" para limpar sua interface.'
        },
        {
          step: '2. Perfil do Usuário',
          description: 'Mantenha seus dados (CPF, Cargo, E-mail) atualizados no seu perfil para que os relatórios saiam com as informações corretas.'
        }
      ]
    }
  ];

  const activeTutorial = tutorials.find(t => t.id === activeSection);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-green/10 text-green rounded-lg">
          <BookOpen size={24} />
        </div>
        <div>
          <h2 className="text-xl font-display font-bold">Central de Ajuda</h2>
          <p className="text-sm text-text-muted">Aprenda a usar todas as funções do VerdeIT.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de Tópicos */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          {tutorials.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveSection(t.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${
                activeSection === t.id 
                  ? 'bg-green text-bg shadow-lg shadow-green/20' 
                  : 'bg-surface border border-border text-text-muted hover:text-text hover:border-green/30'
              }`}
            >
              {t.icon}
              <span className="truncate">{t.title}</span>
              <ChevronRight size={14} className={`ml-auto ${activeSection === t.id ? 'opacity-100' : 'opacity-0'}`} />
            </button>
          ))}
        </div>

        {/* Conteúdo do Tutorial */}
        <div className="flex-1 bg-surface border border-border rounded-3xl p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-green/10 text-green rounded-2xl">
              {activeTutorial.icon}
            </div>
            <h3 className="text-2xl font-display font-bold">{activeTutorial.title}</h3>
          </div>

          <div className="space-y-8">
            {activeTutorial.content.map((item, idx) => (
              <div key={idx} className="relative pl-10 group">
                <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-surface2 border border-border flex items-center justify-center text-xs font-bold text-green group-hover:border-green/50 transition-all">
                  {idx + 1}
                </div>
                {idx < activeTutorial.content.length - 1 && (
                  <div className="absolute left-4 top-8 bottom-[-2rem] w-px bg-border" />
                )}
                <div className="space-y-2">
                  <h4 className="font-bold text-lg text-text">{item.step}</h4>
                  <p className="text-text-muted leading-relaxed text-[0.9rem]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 p-6 bg-surface2 border border-border rounded-2xl flex items-center gap-4">
            <HelpCircle className="text-green shrink-0" size={24} />
            <div>
              <p className="text-sm font-bold">Ainda tem dúvidas?</p>
              <p className="text-xs text-text-muted">Entre em contato com o administrador do sistema ou consulte o manual completo.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
