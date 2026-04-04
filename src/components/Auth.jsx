import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { supabaseService } from '../lib/supabaseService';
import { Cpu, Terminal, Download } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cargo, setCargo] = useState('Técnico de TI');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    try {
      if (isSignUp) {
        if (!name) throw new Error('Nome é obrigatório');
        await supabaseService.signUp(email, password, { name, cargo });
        // Tenta logar imediatamente após o cadastro
        const user = await supabaseService.signIn(email, password);
        onLogin(user);
      } else {
        const user = await supabaseService.signIn(email, password);
        onLogin(user);
      }
    } catch (error) {
      alert('Erro na autenticação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(0,200,150,0.08)_0%,transparent_70%)]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[380px] bg-surface border border-border2 rounded-[20px] p-10 shadow-[0_0_60px_rgba(0,200,150,0.06),0_2px_4px_rgba(0,0,0,0.4)]"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-green to-[#00ffa3] rounded-[14px] flex items-center justify-center mb-6 shadow-[0_0_24px_rgba(0,200,150,0.35)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.2)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
          <Cpu className="text-bg" size={24} strokeWidth={2.5} />
          <Terminal className="text-bg absolute -bottom-1 -right-1 opacity-40" size={14} />
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight mb-6">Verde<span className="text-green">IT</span></h1>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(0,200,150,0.12)] transition-all"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Cargo / Função</label>
                <input
                  type="text"
                  required
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(0,200,150,0.12)] transition-all"
                  placeholder="Ex: Analista de TI"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(0,200,150,0.12)] transition-all"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-[0.75rem] font-semibold text-text-muted uppercase tracking-[0.06em] mb-1.5">Senha</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface2 border border-border rounded-lg p-3 text-text font-sans text-[0.9rem] outline-none focus:border-green focus:shadow-[0_0_0_3px_rgba(0,200,150,0.12)] transition-all"
              placeholder="Sua senha"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green text-bg font-semibold text-[0.9rem] p-3 rounded-lg shadow-[0_4px_20px_rgba(0,200,150,0.3)] hover:bg-green-dim hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : isSignUp ? 'Criar Conta' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[0.8rem] text-text-dim hover:text-green transition-colors"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Crie agora'}
          </button>

          {deferredPrompt && (
            <div className="pt-4 border-t border-border">
              <button 
                onClick={handleInstall}
                className="w-full flex items-center justify-center gap-2 text-[0.8rem] text-green font-bold bg-green/10 p-2.5 rounded-lg hover:bg-green/20 transition-all"
              >
                <Download size={16} /> Instalar Aplicativo
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
