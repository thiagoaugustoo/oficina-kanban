import React, { useState } from 'react';
import { useStore } from '../store';
import { Button } from './ui/Button';
import { Lock, Mail, Wrench, Eye, EyeOff } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export function Login() {
  const login = useStore(s => s.login);
  const createAccount = useStore(s => s.createAccount);
  const resetPassword = useStore(s => s.resetPassword);
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setStatus('');

    try {
      if (mode === 'login') {
        const ok = await login(email, password);
        if (!ok) {
          setError('E-mail ou senha inválidos.');
        }
      } else if (mode === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setError('Preencha todos os campos obrigatórios.');
        } else if (password !== confirmPassword) {
          setError('As senhas não coincidem.');
        } else {
          const result = await createAccount(name.trim(), email.trim(), password, role);
          if (!result.success) {
            setError(result.message);
          } else {
            setStatus(result.message);
            setMode('login');
            setPassword('');
            setConfirmPassword('');
            setRole('user');
          }
        }
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setError('Informe o e-mail do usuário.');
        } else if (!isSupabaseConfigured && (!password.trim() || password !== confirmPassword)) {
          setError('Informe e confirme a nova senha.');
        } else {
          const result = await resetPassword(email.trim(), isSupabaseConfigured ? undefined : password);
          if (!result.success) {
            setError(result.message);
          } else {
            setStatus(result.message);
            setMode('login');
            setPassword('');
            setConfirmPassword('');
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao processar a solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar acesso';
  const submitLabel = mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar usuário' : isSupabaseConfigured ? 'Enviar link' : 'Redefinir senha';

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/50">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">OficinaPro</h1>
          <p className="text-gray-400 text-sm mt-1">Sistema de Gestão de Produção</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Nome completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="João da Silva"
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1.5 block">Perfil</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'user' | 'admin')}
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  >
                    <option value="user">Usuário comum</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-10 pr-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {(mode === 'login' || mode === 'signup' || !isSupabaseConfigured) && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">
                  {mode === 'forgot' && !isSupabaseConfigured ? 'Nova senha' : 'Senha'}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-10 pr-12 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required={mode !== 'forgot' || !isSupabaseConfigured}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' || (mode === 'forgot' && !isSupabaseConfigured) ? (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Confirme a senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-600 rounded-xl pl-10 pr-12 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ) : null}

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {status && (
              <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3 text-green-300 text-sm">
                {status}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
              {submitLabel}
            </Button>
          </form>

          {mode === 'login' ? (
            <div className="mt-6 pt-4 border-t border-gray-700 space-y-3">
              <Button variant="secondary" className="w-full" onClick={() => { setMode('signup'); setError(''); setStatus(''); }}>
                Criar usuário
              </Button>
              <Button variant="ghost" className="w-full text-gray-300" onClick={() => { setMode('forgot'); setError(''); setStatus(''); }}>
                Esqueci minha senha
              </Button>
            </div>
          ) : (
            <div className="mt-6 pt-4 border-t border-gray-700 text-center">
              <button
                type="button"
                className="text-sm text-indigo-400 hover:text-indigo-300"
                onClick={() => { setMode('login'); setError(''); setStatus(''); setPassword(''); setConfirmPassword(''); }}
              >
                Voltar ao login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
