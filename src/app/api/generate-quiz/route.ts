import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Agora buscamos a variável SEM o NEXT_PUBLIC (mais seguro e padrão de servidor)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { lessonTitle, lessonContent, questionCount } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ error: "Chave GEMINI_API_KEY não encontrada no ambiente da Vercel." }, { status: 500 });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const prompt = `Gere um quiz educacional em JSON sobre ${lessonTitle}. Conteúdo: ${lessonContent}. ${questionCount} questões.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json|```/g, "").trim();
    
    return NextResponse.json({ questions: JSON.parse(text) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}