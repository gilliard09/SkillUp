'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Trophy, Users, Zap, ChevronDown, MapPin } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const UNIDADES = [
  { value: 'joinville_aventureiro', label: 'Joinville — Aventureiro' },
  { value: 'joinville_jardim_paraiso', label: 'Joinville — Jardim Paraíso' },
  { value: 'joinville_iririu', label: 'Joinville — Iririú' },
  { value: 'joinville_jardim_iririu', label: 'Joinville — Jardim Iririú' },
  { value: 'garuva', label: 'Garuva' },
  { value: 'outra', label: 'Outra cidade' },
];

export default function BolaoPage() {
  const [etapa, setEtapa] = useState(1);
  const [loading, setLoading] = useState(false);

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [unidade, setUnidade] = useState('');
  const [placarBrasil, setPlacarBrasil] = useState('');
  const [placarMarrocos, setPlacarMarrocos] = useState('');
  const [amigos, setAmigos] = useState(
    Array.from({ length: 5 }, () => ({ nome: '', whatsapp: '' }))
  );
  const [formularioValido, setFormularioValido] = useState(false);
  const [etapa1Valida, setEtapa1Valida] = useState(false);

  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleWhatsAppChange = (value: string, setter: (v: string) => void) => {
    setter(formatWhatsApp(value));
  };

  const handleAmigoWhatsAppChange = (index: number, value: string) => {
    const newAmigos = [...amigos];
    newAmigos[index] = { ...newAmigos[index], whatsapp: formatWhatsApp(value) };
    setAmigos(newAmigos);
  };

  const handleAmigoNomeChange = (index: number, value: string) => {
    const newAmigos = [...amigos];
    newAmigos[index] = { ...newAmigos[index], nome: value };
    setAmigos(newAmigos);
  };

  useEffect(() => {
    const nums = whatsapp.replace(/\D/g, '');
    const wValid = nums.length === 11 && nums.startsWith('47');
    const e1 =
      nome.trim() !== '' &&
      wValid &&
      unidade !== '' &&
      placarBrasil !== '' &&
      placarMarrocos !== '';
    setEtapa1Valida(e1);
  }, [nome, whatsapp, unidade, placarBrasil, placarMarrocos]);

  useEffect(() => {
    const todosAmigos = amigos.every((a) => {
      const n = a.whatsapp.replace(/\D/g, '');
      return a.nome.trim() !== '' && n.length === 11 && n.startsWith('47');
    });
    setFormularioValido(etapa1Valida && todosAmigos);
  }, [etapa1Valida, amigos]);

  const handleProximoPasso = () => {
    const nums = whatsapp.replace(/\D/g, '');
    if (!nums.startsWith('47')) { alert('O WhatsApp deve ser do DDD (47)'); return; }
    if (nums.length !== 11) { alert('WhatsApp deve ter 11 dígitos'); return; }
    if (!etapa1Valida) { alert('Preencha todos os campos'); return; }
    setEtapa(2);
  };

  const handleSubmit = async () => {
    if (!formularioValido) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('bolao_palpites').insert([{
        nome,
        whatsapp: whatsapp.replace(/\D/g, ''),
        unidade,
        placar_brasil: parseInt(placarBrasil),
        placar_marrocos: parseInt(placarMarrocos),
        amigo_1_nome: amigos[0].nome,
        amigo_1_whatsapp: amigos[0].whatsapp.replace(/\D/g, ''),
        amigo_2_nome: amigos[1].nome,
        amigo_2_whatsapp: amigos[1].whatsapp.replace(/\D/g, ''),
        amigo_3_nome: amigos[2].nome,
        amigo_3_whatsapp: amigos[2].whatsapp.replace(/\D/g, ''),
        amigo_4_nome: amigos[3].nome,
        amigo_4_whatsapp: amigos[3].whatsapp.replace(/\D/g, ''),
        amigo_5_nome: amigos[4].nome,
        amigo_5_whatsapp: amigos[4].whatsapp.replace(/\D/g, ''),
      }]);
      if (error) throw error;
      setEtapa(3);
    } catch (error) {
      console.error('Erro ao salvar palpite:', error);
      alert('Erro ao salvar palpite. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white relative overflow-x-hidden">

      {/* ── FUNDO ── */}
      <div className="absolute inset-0 pointer-events-none">
        <Image
          src="/estadio-brasil.jpg"
          alt="Estádio"
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/60 to-black/95" />
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-transparent to-yellow-950/20" />
        {/* Grade sutil */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,215,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255,215,0,0.3); }
          50% { box-shadow: 0 0 40px rgba(255,215,0,0.6); }
        }
        @keyframes fadein-up {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .form-card { animation: fadein-up 0.35s ease both; }

        /* Inputs escuros */
        .dark-input {
          background: rgba(0,0,0,0.55) !important;
          border: 1.5px solid rgba(255,215,0,0.2) !important;
          color: #fff !important;
          border-radius: 12px !important;
          height: 48px !important;
          font-weight: 500 !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .dark-input::placeholder { color: #555 !important; }
        .dark-input:focus {
          border-color: rgba(255,215,0,0.7) !important;
          box-shadow: 0 0 0 3px rgba(255,215,0,0.08) !important;
          outline: none !important;
        }
        .dark-input:hover { border-color: rgba(255,215,0,0.4) !important; }

        .dark-select {
          background: rgba(0,0,0,0.55);
          border: 1.5px solid rgba(255,215,0,0.2);
          color: #fff;
          border-radius: 12px;
          height: 48px;
          padding: 0 40px 0 14px;
          width: 100%;
          font-size: 14px;
          font-weight: 500;
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
          transition: border-color 0.2s;
          outline: none;
        }
        .dark-select:focus { border-color: rgba(255,215,0,0.7); box-shadow: 0 0 0 3px rgba(255,215,0,0.08); }
        .dark-select option { background: #1a1a1a; color: #fff; }
        .dark-select-wrap { position: relative; }
        .dark-select-icon {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          color: rgba(255,215,0,0.6);
        }

        /* Placar inputs */
        .score-input {
          background: rgba(0,0,0,0.6) !important;
          color: #fff !important;
          border-radius: 12px !important;
          height: 72px !important;
          font-size: 2.5rem !important;
          font-weight: 900 !important;
          text-align: center !important;
          border: 2px solid !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
        }
        .score-input:focus { outline: none !important; box-shadow: 0 0 0 3px rgba(255,215,0,0.1) !important; }
        .score-input::-webkit-inner-spin-button,
        .score-input::-webkit-outer-spin-button { -webkit-appearance: none; }
      `}</style>

      <div className="max-w-6xl mx-auto relative z-10 px-4 py-6 md:px-8 md:py-10">

        {/* ── HEADER ── */}
        <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 md:mb-12">
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-3.5 py-1.5 rounded-lg text-xs font-black mb-4 shadow-lg shadow-yellow-500/30">
              <Zap size={13} fill="currentColor" />
              1º JOGO DA SELEÇÃO
            </div>
            <h1 className="font-black tracking-tight leading-none mb-3">
              <span className="block text-5xl sm:text-6xl md:text-8xl text-white">BOLÃO</span>
              <span
                className="block text-5xl sm:text-6xl md:text-8xl"
                style={{ color: '#FFD700', textShadow: '0 0 40px rgba(255,215,0,0.35)' }}
              >
                DA COPA
              </span>
            </h1>
            <p className="text-zinc-300 max-w-sm text-sm md:text-base leading-relaxed font-light">
              Acerte o placar do jogo do Brasil e leve um{' '}
              <span className="text-yellow-400 font-bold">Pix de R$100</span> pra casa.
              Vamos juntos torcer e ganhar! ⚽💚
            </p>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="inline-block bg-black/60 backdrop-blur-sm border border-yellow-500/30 px-4 py-3 rounded-xl">
              <div className="text-yellow-400 text-xs font-black mb-1">⚽ FIFA WORLD CUP</div>
              <div className="text-white text-3xl font-black">2026</div>
            </div>
          </div>
        </header>

        {/* ── GRID PRINCIPAL ── */}
        <div className="grid lg:grid-cols-[1fr,420px] gap-6 lg:gap-8 items-start">

          {/* ── COLUNA ESQUERDA ── */}
          <div className="space-y-5">

            {/* Card do Jogo */}
            <div
              className="relative rounded-2xl p-5 md:p-7 overflow-hidden border-2"
              style={{
                background: 'linear-gradient(135deg, rgba(18,18,18,0.95), rgba(0,0,0,0.9))',
                borderColor: '#FFD700',
                boxShadow: '0 0 40px rgba(255,215,0,0.12)',
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                <span className="text-yellow-400 text-xs font-black uppercase tracking-widest">Primeiro Jogo</span>
              </div>

              <div className="flex items-center justify-between">
                {/* Brasil */}
                <div className="text-center flex-1">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3">
                    <div className="absolute inset-0 bg-green-500/30 rounded-xl blur-xl" />
                    <div className="relative w-full h-full bg-gradient-to-br from-green-600 to-green-800 rounded-xl border-2 border-yellow-400 flex items-center justify-center shadow-xl">
                      <Image src="/brasil.png" alt="Brasil" width={64} height={64} className="object-contain" />
                    </div>
                  </div>
                  <p className="font-black text-base text-white uppercase tracking-wide">Brasil</p>
                  <p className="text-xs text-zinc-500 font-mono">BRA</p>
                </div>

                <div className="px-4 text-center">
                  <div
                    className="text-4xl sm:text-5xl font-black"
                    style={{ color: '#FFD700', textShadow: '0 0 20px rgba(255,215,0,0.5)' }}
                  >
                    VS
                  </div>
                  <div className="w-12 h-px bg-yellow-400/40 mx-auto mt-2" />
                </div>

                {/* Marrocos */}
                <div className="text-center flex-1">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3">
                    <div className="absolute inset-0 bg-red-500/30 rounded-xl blur-xl" />
                    <div className="relative w-full h-full bg-gradient-to-br from-red-600 to-red-800 rounded-xl border-2 border-yellow-400 flex items-center justify-center shadow-xl">
                      <Image src="/marrocos.png" alt="Marrocos" width={64} height={64} className="object-contain" />
                    </div>
                  </div>
                  <p className="font-black text-base text-white uppercase tracking-wide">Marrocos</p>
                  <p className="text-xs text-zinc-500 font-mono">MAR</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="flex items-center gap-2.5 bg-black/40 border border-yellow-500/20 rounded-xl p-3">
                  <span className="text-xl">📅</span>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Data</p>
                    <p className="text-white font-bold text-sm">13 de Junho</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-black/40 border border-yellow-500/20 rounded-xl p-3">
                  <span className="text-xl">🕐</span>
                  <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">Horário</p>
                    <p className="text-white font-bold text-sm">19h (Brasília)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Prêmio */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition duration-500" />
              <div
                className="relative rounded-2xl p-6 sm:p-8 text-center overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #FFD700, #FDB931, #D4AF37)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Trophy className="w-5 h-5 text-black/70" />
                  <span className="text-xs font-black uppercase tracking-widest text-black/60">Prêmio em Pix</span>
                  <Trophy className="w-5 h-5 text-black/70" />
                </div>

                <div className="flex items-center justify-center gap-4">
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 text-2xl"
                    style={{ animation: 'float 3s ease-in-out infinite' }}
                  >
                    💰
                  </div>
                  <p
                    className="text-6xl sm:text-7xl font-black"
                    style={{ color: '#0d5e2a' }}
                  >
                    R$100
                  </p>
                  <div
                    className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 text-2xl"
                    style={{ animation: 'float 3.5s ease-in-out infinite' }}
                  >
                    ⚡
                  </div>
                </div>
              </div>
            </div>

            {/* Regulamento */}
            <div
              className="rounded-2xl p-5 md:p-6 border border-yellow-500/20"
              style={{ background: 'rgba(0,0,0,0.7)' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-6 bg-yellow-400 rounded-full" />
                <h3 className="text-yellow-400 font-black text-base uppercase tracking-wide">Regulamento</h3>
              </div>
              <ul className="grid sm:grid-cols-2 gap-2 text-sm text-zinc-300">
                {[
                  'Apenas 1 palpite por pessoa',
                  'Palpites encerram às 18h50 (10 min antes)',
                  'Caso haja mais de um acertador, sorteio entre eles',
                  'Apenas cadastros pelo formulário oficial',
                  'Casos omissos decididos pela direção da escola',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-400 mt-0.5 shrink-0">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── FORMULÁRIO ── */}
          <div
            className="rounded-2xl p-5 md:p-7 border-2 relative overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, rgba(20,20,20,0.97), rgba(0,0,0,0.95))',
              borderColor: '#FFD700',
              boxShadow: '0 0 60px rgba(255,215,0,0.1)',
            }}
          >
            {/* Grade interna */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,215,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,1) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {/* ── INDICADOR DE ETAPAS ── */}
            {etapa < 3 && (
              <div className="relative flex items-center justify-center gap-0 mb-6">
                {['Palpite', 'Amigos', ''].slice(0, 2).map((label, i) => {
                  const step = i + 1;
                  const active = etapa === step;
                  const done = etapa > step;
                  return (
                    <div key={step} className="flex items-center">
                      <div className="flex flex-col items-center">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300"
                          style={{
                            background: done ? '#FFD700' : active ? '#FFD700' : 'rgba(255,215,0,0.1)',
                            color: done || active ? '#000' : '#555',
                            border: done || active ? 'none' : '2px solid rgba(255,215,0,0.2)',
                          }}
                        >
                          {done ? <Check size={14} strokeWidth={3} /> : step}
                        </div>
                        <span
                          className="text-[10px] font-bold mt-1 uppercase tracking-wide"
                          style={{ color: active ? '#FFD700' : '#555' }}
                        >
                          {label}
                        </span>
                      </div>
                      {step < 2 && (
                        <div
                          className="w-16 sm:w-20 h-px mx-2 mb-4 transition-all duration-500"
                          style={{ background: done ? '#FFD700' : 'rgba(255,215,0,0.15)' }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── ETAPA 1 ── */}
            {etapa === 1 && (
              <div className="form-card space-y-4">
                <div className="mb-2">
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-1">
                    Faça seu Cadastro
                  </h2>
                  <p className="text-sm text-zinc-400 font-light">
                    Preencha e concorra ao{' '}
                    <span className="text-yellow-400 font-bold">Pix de R$100</span>
                  </p>
                </div>

                {/* Nome */}
                <div className="space-y-1.5">
                  <Label>Nome Completo</Label>
                  <Input
                    placeholder="Digite seu nome completo"
                    className="dark-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <Label>WhatsApp (DDD 47)</Label>
                  <Input
                    placeholder="(47) 00000-0000"
                    className="dark-input"
                    value={whatsapp}
                    onChange={(e) => handleWhatsAppChange(e.target.value, setWhatsapp)}
                    maxLength={15}
                  />
                </div>

                {/* Unidade / Cidade */}
                <div className="space-y-1.5">
                  <Label icon={<MapPin size={11} />}>Cidade</Label>
                  <div className="dark-select-wrap">
                    <select
                      className="dark-select"
                      value={unidade}
                      onChange={(e) => setUnidade(e.target.value)}
                    >
                      <option value="" disabled>Selecione sua cidade</option>
                      {UNIDADES.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="dark-select-icon" />
                  </div>
                </div>

                {/* Palpite */}
                <div className="space-y-2">
                  <Label>Seu Palpite — Placar do Jogo</Label>
                  <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-end">
                    <div>
                      <p className="text-xs text-center text-zinc-400 font-bold uppercase mb-2">Brasil</p>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        className="score-input"
                        style={{ borderColor: 'rgba(34,197,94,0.5)' }}
                        value={placarBrasil}
                        onChange={(e) => setPlacarBrasil(e.target.value)}
                        onFocus={(e) =>
                          (e.target.style.borderColor = 'rgba(34,197,94,0.9)')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = 'rgba(34,197,94,0.5)')
                        }
                      />
                    </div>
                    <p className="text-2xl font-black text-yellow-400 mb-4 select-none">×</p>
                    <div>
                      <p className="text-xs text-center text-zinc-400 font-bold uppercase mb-2">Marrocos</p>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        className="score-input"
                        style={{ borderColor: 'rgba(239,68,68,0.5)' }}
                        value={placarMarrocos}
                        onChange={(e) => setPlacarMarrocos(e.target.value)}
                        onFocus={(e) =>
                          (e.target.style.borderColor = 'rgba(239,68,68,0.9)')
                        }
                        onBlur={(e) =>
                          (e.target.style.borderColor = 'rgba(239,68,68,0.5)')
                        }
                      />
                    </div>
                  </div>
                </div>

                <button
                  className="w-full font-black text-base rounded-xl mt-2 h-14 flex items-center justify-center gap-2 uppercase tracking-wide transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: etapa1Valida
                      ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                      : 'rgba(255,255,255,0.06)',
                    color: etapa1Valida ? '#fff' : '#555',
                    boxShadow: etapa1Valida ? '0 8px 24px rgba(34,197,94,0.35)' : 'none',
                    cursor: etapa1Valida ? 'pointer' : 'not-allowed',
                    border: 'none',
                  }}
                  onClick={handleProximoPasso}
                  disabled={!etapa1Valida}
                >
                  <Zap size={18} fill={etapa1Valida ? 'currentColor' : 'none'} />
                  Quero Participar!
                </button>

                <p className="text-xs text-center text-zinc-600 font-light">
                  Ao participar, você concorda com o regulamento.
                </p>
              </div>
            )}

            {/* ── ETAPA 2 ── */}
            {etapa === 2 && (
              <div className="form-card space-y-4">
                <div className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                      Indique 5 Amigos
                    </h2>
                  </div>
                  <p className="text-sm text-zinc-400 font-light">
                    Para validar o palpite, indique 5 amigos do{' '}
                    <span className="text-yellow-400 font-bold">DDD (47)</span>
                  </p>
                </div>

                {amigos.map((amigo, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-yellow-500/15 space-y-2"
                    style={{ background: 'rgba(0,0,0,0.35)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-black shrink-0"
                        style={{ background: '#FFD700' }}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-xs text-yellow-400 font-black uppercase tracking-wide">
                        Amigo {idx + 1}
                      </span>
                    </div>
                    <Input
                      placeholder="Nome completo"
                      className="dark-input"
                      style={{ height: '42px !important' }}
                      value={amigo.nome}
                      onChange={(e) => handleAmigoNomeChange(idx, e.target.value)}
                    />
                    <Input
                      placeholder="(47) 00000-0000"
                      className="dark-input"
                      style={{ height: '42px !important' }}
                      value={amigo.whatsapp}
                      onChange={(e) => handleAmigoWhatsAppChange(idx, e.target.value)}
                      maxLength={15}
                    />
                  </div>
                ))}

                <button
                  className="w-full font-black text-base rounded-xl h-14 flex items-center justify-center gap-2 uppercase tracking-wide transition-all duration-200 active:scale-[0.98]"
                  style={{
                    background: formularioValido
                      ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                      : 'rgba(255,255,255,0.06)',
                    color: formularioValido ? '#fff' : '#555',
                    boxShadow: formularioValido ? '0 8px 24px rgba(34,197,94,0.35)' : 'none',
                    cursor: formularioValido && !loading ? 'pointer' : 'not-allowed',
                    border: 'none',
                  }}
                  onClick={handleSubmit}
                  disabled={!formularioValido || loading}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Check size={18} />
                      Concluir Palpite
                    </>
                  )}
                </button>

                {!formularioValido && (
                  <div className="bg-yellow-500/8 border border-yellow-500/20 rounded-xl p-3 text-center">
                    <p className="text-xs text-yellow-400 font-bold">
                      ⚠️ Preencha todos os campos com DDD (47)
                    </p>
                  </div>
                )}

                <button
                  className="w-full text-zinc-500 hover:text-white text-sm font-medium py-2 transition-colors rounded-xl hover:bg-white/5"
                  onClick={() => setEtapa(1)}
                >
                  ← Voltar
                </button>
              </div>
            )}

            {/* ── ETAPA 3: SUCESSO ── */}
            {etapa === 3 && (
              <div className="form-card text-center py-8 space-y-5">
                <div className="relative inline-block">
                  <div
                    className="absolute inset-0 bg-green-500 rounded-full blur-2xl opacity-40 animate-pulse"
                  />
                  <div
                    className="relative w-24 h-24 rounded-full flex items-center justify-center mx-auto border-4 border-green-400 shadow-2xl"
                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  >
                    <Check size={52} strokeWidth={3} />
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                    Palpite Registrado!
                  </h2>
                  <p className="text-zinc-300 text-base font-light">
                    Agora é só torcer. Boa sorte! 🍀⚽
                  </p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-400/40 rounded-xl p-4">
                  <p className="text-sm text-yellow-400 font-bold">
                    ✨ Seus amigos receberão uma mensagem em breve!
                  </p>
                </div>

                <button
                  className="w-full border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black h-12 rounded-xl font-black uppercase tracking-wide transition-all duration-200"
                  onClick={() => window.location.reload()}
                >
                  Fazer Outro Palpite
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="mt-10 text-center">
          <div className="inline-flex items-center gap-3 bg-black/50 border border-yellow-500/20 px-5 py-2.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <p className="text-zinc-500 text-xs font-mono">
              © 2026{' '}
              <span className="text-yellow-400 font-bold">Tecnologge Cursos</span>
              {' '}• Aprendeu, jogou, ganhou.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ── Helper ──
function Label({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] text-yellow-400 font-black uppercase tracking-wider">
      <div className="w-1 h-1 bg-yellow-400 rounded-full" />
      {icon}
      {children}
    </label>
  );
}