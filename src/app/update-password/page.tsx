'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Validações de senha
  const passwordChecks = {
    minLength: password.length >= 8,
    hasMatch: password === confirmPassword && password.length > 0,
  };

  const isValidPassword = passwordChecks.minLength && passwordChecks.hasMatch;

  useEffect(() => {
  const checkSession = async () => {
    // 1. Tenta pegar a sessão atual
    const { data } = await supabase.auth.getSession();

    // 2. Se não houver sessão, aguarda o listener de autenticação
    // Isso é mais robusto que um timeout fixo
    if (!data.session) {
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setIsReady(true);
        }
      });
      
      // Limpeza do listener caso o componente desmonte
      return () => authListener.subscription.unsubscribe();
    } else {
      setIsReady(true);
    }
  };

  checkSession();
}, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidPassword) {
      setError('Verifique os requisitos da senha');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      // Sucesso - redireciona após mostrar mensagem
      alert('✅ Senha atualizada com sucesso!');
      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  // Tela de loading
  if (!isReady && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-white">Validando link...</p>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (error && !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl mb-2">Link Inválido</h2>
          <p className="text-purple-200 mb-4">{error}</p>
          <p className="text-sm text-purple-300">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-300" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Criar Nova Senha
            </h1>
            <p className="text-purple-200 text-sm">
              Digite sua nova senha abaixo
            </p>
          </div>

          <form onSubmit={handleUpdate} className="space-y-4">
            {/* Campo Nova Senha */}
            <div>
              <label className="text-white text-sm mb-2 block">Nova senha</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"}
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Mínimo 8 caracteres"
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label className="text-white text-sm mb-2 block">Confirmar senha</label>
              <div className="relative">
                <Input 
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Digite a senha novamente"
                  className="bg-white/10 border-white/20 text-white placeholder:text-purple-300 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Checklist de requisitos */}
            <div className="space-y-2 bg-white/5 rounded-lg p-4">
              <p className="text-xs text-purple-300 mb-2">Requisitos da senha:</p>
              <div className="space-y-1">
                <div className={`flex items-center gap-2 text-sm ${passwordChecks.minLength ? 'text-green-400' : 'text-purple-300'}`}>
                  <CheckCircle className="w-4 h-4" />
                  Mínimo 8 caracteres
                </div>
                <div className={`flex items-center gap-2 text-sm ${passwordChecks.hasMatch ? 'text-green-400' : 'text-purple-300'}`}>
                  <CheckCircle className="w-4 h-4" />
                  Senhas coincidem
                </div>
              </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Botão submit */}
            <Button 
              type="submit" 
              disabled={loading || !isValidPassword}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Atualizando...' : 'Confirmar Nova Senha'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}