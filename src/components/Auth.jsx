import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabaseService } from '../lib/supabaseService';

export default function Auth({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cargo, setCargo] = useState('Servidor Público');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

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
        <div className="w-12 h-12 bg-gradient-to-br from-green to-[#00ffa3] rounded-[14px] flex items-center justify-center font-display font-extrabold text-[1.3rem] text-bg mb-6 shadow-[0_0_24px_rgba(0,200,150,0.35)]">
          VL
        </div>
        <h1 className="font-display text-2xl font-extrabold mb-6">VerdeLog</h1>

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
                  placeholder="Ex: Analista"
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
              placeholder="seu@email.ba.gov.br"
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

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[0.8rem] text-text-dim hover:text-green transition-colors"
          >
            {isSignUp ? 'Já tem uma conta? Entre aqui' : 'Não tem uma conta? Crie agora'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
