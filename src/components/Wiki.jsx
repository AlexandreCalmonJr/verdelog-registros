import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, BookOpen, Edit2, Trash2, X, Save, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { supabaseService } from '../lib/supabaseService';

export default function Wiki({ user, showToast }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isEditing, setIsEditing] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [viewingArticle, setViewingArticle] = useState(null);

  const categories = [
    { id: 'geral', label: 'Geral' },
    { id: 'hardware', label: 'Hardware' },
    { id: 'software', label: 'Software' },
    { id: 'rede', label: 'Redes & Infra' },
    { id: 'sistemas', label: 'Sistemas Internos' },
    { id: 'procedimentos', label: 'Procedimentos (SOP)' }
  ];

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      const data = await supabaseService.getWikiArticles();
      setArticles(data || []);
    } catch (error) {
      console.error('Error loading wiki:', error);
      showToast('Erro ao carregar artigos da Wiki', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!currentArticle.title || !currentArticle.content) {
      showToast('Título e conteúdo são obrigatórios', 'error');
      return;
    }

    try {
      const articleToSave = {
        ...currentArticle,
        user_id: user.id
      };
      
      await supabaseService.upsertWikiArticle(articleToSave);
      await loadArticles();
      setIsEditing(false);
      setCurrentArticle(null);
      showToast('Artigo salvo com sucesso!');
    } catch (error) {
      console.error('Error saving article:', error);
      showToast('Erro ao salvar artigo', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este artigo?')) return;
    try {
      await supabaseService.deleteWikiArticle(id);
      await loadArticles();
      if (viewingArticle?.id === id) setViewingArticle(null);
      showToast('Artigo excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting article:', error);
      showToast('Erro ao excluir artigo', 'error');
    }
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-[1.2rem] flex items-center gap-2">
            <BookOpen className="text-green" size={24} />
            Base de Conhecimento
          </h2>
          <p className="text-[0.85rem] text-text-muted mt-1">Documentação, procedimentos e tutoriais da equipe.</p>
        </div>
        
        {!isEditing && !viewingArticle && (
          <button 
            onClick={() => {
              setCurrentArticle({ title: '', content: '', category: 'geral' });
              setIsEditing(true);
            }}
            className="bg-green text-bg font-semibold text-[0.85rem] px-4 py-2 rounded-lg shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:bg-green-dim transition-all flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> Novo Artigo
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            onSubmit={handleSave}
            className="bg-surface border border-border rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[1.1rem]">{currentArticle.id ? 'Editar Artigo' : 'Novo Artigo'}</h3>
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setCurrentArticle(null); }}
                className="p-2 rounded-lg hover:bg-surface2 text-text-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider">Título</label>
                <input 
                  value={currentArticle.title}
                  onChange={e => setCurrentArticle({...currentArticle, title: e.target.value})}
                  className="w-full bg-surface2 border border-border rounded-xl p-3 text-[0.9rem] text-text outline-none focus:border-green transition-all"
                  placeholder="Ex: Como configurar a impressora X"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider">Categoria</label>
                <select 
                  value={currentArticle.category}
                  onChange={e => setCurrentArticle({...currentArticle, category: e.target.value})}
                  className="w-full bg-surface2 border border-border rounded-xl p-3 text-[0.9rem] text-text outline-none focus:border-green transition-all"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[0.75rem] font-semibold text-text-muted uppercase tracking-wider">Conteúdo (Markdown suportado)</label>
              <textarea 
                value={currentArticle.content}
                onChange={e => setCurrentArticle({...currentArticle, content: e.target.value})}
                className="w-full bg-surface2 border border-border rounded-xl p-4 text-[0.9rem] text-text outline-none focus:border-green transition-all min-h-[300px] font-mono resize-y"
                placeholder="Escreva o conteúdo do artigo aqui..."
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
              <button 
                type="button"
                onClick={() => { setIsEditing(false); setCurrentArticle(null); }}
                className="px-6 py-2.5 rounded-xl font-semibold text-[0.85rem] border border-border text-text-dim hover:bg-surface2 transition-all"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-6 py-2.5 rounded-xl font-semibold text-[0.85rem] bg-green text-bg hover:bg-green-dim transition-all flex items-center gap-2"
              >
                <Save size={16} /> Salvar Artigo
              </button>
            </div>
          </motion.form>
        ) : viewingArticle ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-surface border border-border rounded-2xl p-6 md:p-8"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 pb-6 border-b border-border/50">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-muted">
                    {categories.find(c => c.id === viewingArticle.category)?.label || viewingArticle.category}
                  </span>
                  <span className="text-[0.7rem] text-text-muted">
                    Atualizado em {new Date(viewingArticle.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-display font-bold text-text">{viewingArticle.title}</h1>
                {viewingArticle.profiles && (
                  <p className="text-[0.8rem] text-text-muted mt-2 flex items-center gap-1.5">
                    <Edit2 size={12} /> Escrito por {viewingArticle.profiles.name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => {
                    setCurrentArticle(viewingArticle);
                    setViewingArticle(null);
                    setIsEditing(true);
                  }}
                  className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
                  title="Editar"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(viewingArticle.id)}
                  className="p-2 rounded-lg border border-border text-red/60 hover:text-red hover:bg-red/10 transition-all"
                  title="Excluir"
                >
                  <Trash2 size={16} />
                </button>
                <div className="w-px h-6 bg-border mx-1" />
                <button 
                  onClick={() => setViewingArticle(null)}
                  className="p-2 rounded-lg border border-border text-text-dim hover:text-text hover:bg-surface2 transition-all"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none markdown-body">
              <ReactMarkdown>{viewingArticle.content}</ReactMarkdown>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-surface border border-border rounded-xl py-2.5 pl-10 pr-4 text-[0.85rem] text-text outline-none focus:border-green transition-all"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-[0.8rem] font-medium border transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-green/10 border-green/30 text-green' : 'bg-surface border-border text-text-dim hover:bg-surface2'}`}
                >
                  Todos
                </button>
                {categories.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`px-4 py-2 rounded-xl text-[0.8rem] font-medium border transition-all whitespace-nowrap ${selectedCategory === c.id ? 'bg-green/10 border-green/30 text-green' : 'bg-surface border-border text-text-dim hover:bg-surface2'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.length > 0 ? (
                filteredArticles.map(article => (
                  <div 
                    key={article.id}
                    onClick={() => setViewingArticle(article)}
                    className="bg-surface border border-border rounded-2xl p-5 hover:border-green/50 hover:shadow-[0_4px_20px_rgba(0,200,150,0.05)] transition-all cursor-pointer group flex flex-col h-full"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-surface2 text-text-muted group-hover:border-green/30 group-hover:text-green transition-colors">
                        {categories.find(c => c.id === article.category)?.label || article.category}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-[1.05rem] text-text mb-2 group-hover:text-green transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-[0.8rem] text-text-muted line-clamp-3 mb-4 flex-1">
                      {article.content}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                      <span className="text-[0.7rem] text-text-muted flex items-center gap-1.5">
                        <Tag size={12} /> {article.profiles?.name || 'Usuário'}
                      </span>
                      <span className="text-[0.65rem] text-text-muted font-mono">
                        {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-text-muted flex flex-col items-center gap-3 opacity-50">
                  <BookOpen size={40} />
                  <p className="text-[0.85rem]">Nenhum artigo encontrado.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
