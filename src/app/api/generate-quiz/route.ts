import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = "AIzaSyBGIBZC4JxZcE-BSLVnw9Bo9F3zOXp5jbM"; 
const genAI = new GoogleGenerativeAI(API_KEY);

export async function POST(req: Request) {
  try {
    const { lessonTitle, lessonContent, questionCount } = await req.json();

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    // MUDANÇA NO PROMPT: Pedimos para analisar como um "revisor de texto acadêmico"
    const prompt = `
      Analise o texto informativo abaixo e extraia dados para um questionário de compreensão de leitura.
      O tema é tecnológico. Não emita juízo de valor, apenas extraia os fatos.

      TÍTULO DO DOCUMENTO: ${lessonTitle}
      CONTEÚDO PARA ANÁLISE: ${lessonContent}

      Gere ${questionCount} questões de múltipla escolha sobre os pontos principais.
      Retorne APENAS o JSON:
      [{"question_text": "...", "type": "multiple_choice", "options": ["A","B","C","D"], "correct_option_index": 0, "points": 10}]
    `;

    const result = await model.generateContent(prompt);
    
    // Verificação extra se a resposta veio vazia por causa do bloqueio
    if (!result.response || !result.response.candidates || result.response.candidates[0].finishReason === 'SAFETY') {
        return NextResponse.json({ 
            error: "O filtro de segurança do Google ainda está bloqueando este conteúdo específico.",
            details: "Tente resumir um pouco o conteúdo da aula ou remover palavras muito fortes antes de gerar." 
          }, { status: 400 });
    }

    const text = result.response.text().replace(/```json|```/g, "").trim();
    return NextResponse.json({ questions: JSON.parse(text) });

  } catch (error: any) {
    console.error("ERRO:", error);
    return NextResponse.json({ error: "Falha na geração", details: error.message }, { status: 500 });
  }
}