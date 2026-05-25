'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar e-mail de recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Botão voltar */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para login
        </Link>

        {/* Card principal */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
          {success ? (
            // Estado de sucesso
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">E-mail enviado!</h1>
              <p className="text-purple-200">
                Enviamos um link de recuperação para <strong>{email}</strong>
              </p>
              <p className="text-sm text-purple-300">
                Verifique sua caixa de entrada e spam. O link expira em 1 hora.
              </p>
              <Button 
                onClick={() => setSuccess(false)}
                variant="outline"
                className="w-full mt-4 border-white/20 text-white hover:bg-white/10"
              >
                Enviar novamente
              </Button>
            </div>
          ) : (
            // Formulário
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-purple-300" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Esqueceu a senha?
                </h1>
                <p className="text-purple-200 text-sm">
                  Digite seu e-mail e enviaremos um link para redefinir sua senha
                </p>
              </div>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <Input 
                    type="email" 
                    placeholder="seu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                    <p className="text-red-200 text-sm">{error}</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {loading ? 'Enviando...' : 'Enviar link de recuperação'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}