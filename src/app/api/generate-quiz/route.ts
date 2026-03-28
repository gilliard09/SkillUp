import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { lessonTitle, lessonContent, questionCount = 5 } = await req.json();

    if (!lessonTitle && !lessonContent) {
      return NextResponse.json(
        { error: 'Título ou conteúdo da aula é obrigatório.' },
        { status: 400 }
      );
    }

    const prompt = `Você é um especialista em criar questões de quiz para cursos de tecnologia e administração.

Com base no conteúdo da aula abaixo, crie exatamente ${questionCount} questões de quiz variadas.

AULA: ${lessonTitle}
CONTEÚDO: ${lessonContent || 'Use o título da aula como base para criar questões relevantes.'}

REGRAS OBRIGATÓRIAS:
- Crie uma mistura de tipos: preferencialmente ${Math.ceil(questionCount * 0.6)} de múltipla escolha e ${Math.floor(questionCount * 0.4)} de verdadeiro/falso
- Múltipla escolha: exatamente 4 opções, apenas 1 correta
- Verdadeiro/Falso: opções devem ser exatamente ["Verdadeiro", "Falso"]
- As questões devem testar compreensão real, não apenas memorização
- Linguagem clara e direta em português brasileiro
- Nível adequado para alunos iniciantes/intermediários

Responda APENAS com um JSON válido, sem texto antes ou depois, sem markdown, sem backticks:
{
  "questions": [
    {
      "question_text": "texto da pergunta",
      "type": "multiple_choice",
      "options": ["opção A", "opção B", "opção C", "opção D"],
      "correct_option_index": 0,
      "points": 10
    },
    {
      "question_text": "texto da afirmação",
      "type": "true_false",
      "options": ["Verdadeiro", "Falso"],
      "correct_option_index": 0,
      "points": 10
    }
  ]
}`;

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = message.content
      .filter(block => block.type === 'text')
      .map(block => (block as { type: 'text'; text: string }).text)
      .join('');

    const clean = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(clean);

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error('Formato de resposta inválido.');
    }

    return NextResponse.json({ questions: parsed.questions });
  } catch (err: any) {
    console.error('Erro ao gerar questões:', err);
    return NextResponse.json(
      { error: err.message ?? 'Erro ao gerar questões.' },
      { status: 500 }
    );
  }
}