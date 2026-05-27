'use client';

import { useState } from 'react';

// Exemplo de estrutura de dados para o quiz da Aula 1
const quizData = [
  {
    id: 1,
    pergunta: "Qual dispositivo é essencial para mover o cursor na tela?",
    opcoes: ["Teclado", "Mouse", "Impressora", "Monitor"],
    respostaCorreta: "Mouse"
  },
  // Adicione as outras perguntas aqui
];

export default function SequenciaPage() {
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [finalizado, setFinalizado] = useState(false);

  const handleResposta = (opcao: string) => {
    if (opcao === quizData[perguntaAtual].respostaCorreta) {
      setPontos(pontos + 10);
    }

    if (perguntaAtual + 1 < quizData.length) {
      setPerguntaAtual(perguntaAtual + 1);
    } else {
      setFinalizado(true);
    }
  };

  return (
    <div className="min-h-screen p-8 flex flex-col items-center justify-center bg-slate-900 text-white">
      {!finalizado ? (
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <h2 className="text-xl font-bold mb-6">Aula 1: A Era da Informação</h2>
          <p className="mb-6">{quizData[perguntaAtual].pergunta}</p>
          <div className="space-y-3">
            {quizData[perguntaAtual].opcoes.map((opcao) => (
              <button
                key={opcao}
                onClick={() => handleResposta(opcao)}
                className="w-full bg-[#4a148c] text-white py-3 rounded-xl font-semibold hover:bg-[#311b92] transition-colors"
              >
                {opcao}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <h1 className="text-3xl font-bold">Parabéns!</h1>
          <p className="mt-4">Você completou esta aula com {pontos} pontos.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-[#4a148c] text-white px-8 py-3 rounded-xl"
          >
            Refazer Quiz
          </button>
        </div>
      )}
    </div>
  );
}