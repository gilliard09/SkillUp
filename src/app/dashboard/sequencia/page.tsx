"use client";

import { useState, useMemo } from "react";
import { Copy, Check, Search, Sparkles, BookOpen, Languages, Brain, FileText, Code2, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type AITag = "ChatGPT" | "Claude" | "Gemini" | "Meta IA" | "Todos";

interface Prompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  tags: AITag[];
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "todos", label: "Todos", icon: Sparkles },
  { id: "idiomas", label: "Idiomas", icon: Languages },
  { id: "escola", label: "Escola", icon: FileText },
  { id: "revisao", label: "Revisão", icon: BookOpen },
  { id: "tecnologia", label: "Tecnologia", icon: Code2 },
  { id: "raciocinio", label: "Raciocínio", icon: Brain },
  { id: "produtividade", label: "Produtividade", icon: Zap },
];

const PROMPTS: Prompt[] = [
  // ── Idiomas ──
  {
    id: "1",
    title: "Aula de vocabulário personalizada",
    description: "Aprenda palavras novas com contexto e exemplos reais.",
    prompt:
      "Quero aprender vocabulário em [idioma]. Me dê 10 palavras do nível [iniciante/intermediário/avançado] com: (1) a palavra e pronúncia, (2) tradução, (3) exemplo de frase natural, (4) dica para memorizar. Tema: [ex: trabalho, viagens, cotidiano].",
    category: "idiomas",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "2",
    title: "Correção de texto com explicação",
    description: "Aprenda outro idioma pelo WhatsApp.",
    prompt:
      "Atue como meu professor particular de [Inserir o Idioma, ex: Inglês/Espanhol] nativo, paciente e focado em conversação do dia a dia. Minha idade atual é [Inserir Idade] anos. Quero criar o hábito de praticar todos os dias aqui no WhatsApp. Por favor, inicie nosso treino seguindo estas regras: DESAFIO DIÁRIO: Envie-me uma pergunta simples no idioma para começarmos a conversar. Quero responder mandando um ÁUDIO para você avaliar minha pronúncia. CORREÇÃO AMIGÁVEL: Quando eu responder (por texto ou áudio), corrija meus erros de gramática e pronúncia de forma leve, e me ensine 2 palavras novas (vocabulário) relacionadas ao assunto. RECOMENDAÇÃO CULTURAL: Recomende 1 música e 1 filme/série adequados para a minha faixa etária que me ajudem a treinar a escuta desse idioma. FOCO PRÁTICO: Evite explicações gramaticais longas. Foque em me fazer falar e entender o idioma usado na vida real. Comece agora se apresentando no idioma e me fazendo a primeira pergunta.",
    category: "idiomas",
    tags: ["Meta IA", "ChatGPT", "Claude"],
  },
  {
    id: "3",
    title: "Simulação de conversa nativa",
    description: "Pratique diálogos reais com um falante nativo simulado.",
    prompt:
      "Vamos simular uma conversa em [idioma]. Você é um falante nativo e eu sou um estudante de nível [iniciante/intermediário]. Contexto: [ex: numa cafeteria em Paris / numa entrevista de emprego]. Corrija meus erros ao final de cada resposta, mas sem interromper o fluxo da conversa. Comece você.",
    category: "idiomas",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "4",
    title: "Flashcards inteligentes",
    description: "Gere flashcards prontos para importar no Anki ou Quizlet.",
    prompt:
      "Crie 15 flashcards para estudar [tema] em [idioma]. Formato: Frente | Verso. A frente deve ter a palavra/expressão em [idioma] e o verso a tradução + uma frase de exemplo. Separe cada flashcard em uma linha.",
    category: "idiomas",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },

  // ── Escola ──
  {
    id: "5",
    title: "Assistente de dever de casa",
    description: "Modifique após colar o assunto, tema do que você deseja aprender.",
    prompt:
      "Atue como um professor paciente e especialista em tecnologia. Estou fazendo meu dever de casa sobre o tema: [Inserir o Tema da Tarefa]. Preciso que você me ajude a estudar seguindo estas regras: Não me dê as respostas prontas do meu dever. Se eu te mandar uma dúvida ou um exercício, explique a lógica por trás dele passo a passo. Me dê uma dica ou um exemplo parecido para que eu consiga resolver o meu exercício sozinho.",
    category: "escola",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "6",
    title: "Guia da redação perfeita",
    description: "Aprenda a estruturar redações para tirar nota máxima em exames e concursos.",
    prompt:
      "Atue como um corretor especialista em redação de exames e concursos. Eu preciso criar uma redação sobre o tema: [Inserir o Tema da Redação aqui]. Antes de eu começar a escrever, me dê um guia de planejamento seguindo estas diretrizes: ESTRUTURA OBRIGATÓRIA: Explique brevemente o que NÃO PODE FALTAR na Introdução, nos parágrafos de Desenvolvimento e na Conclusão. ELEMENTOS ESSENCIAIS: Liste o que é estritamente necessário ter para tirar nota máxima (como tese clara, conectivos entre os parágrafos e proposta de intervenção). ERROS PROIBIDOS: Me diga o que eu JAMAIS devo fazer ou escrever para não zerar ou perder muitos pontos. ROTEIRO DE INSIGHTS: Me dê 3 ideias de argumentos ou caminhos que eu posso seguir para defender o tema proposto. Não escreva a redação por mim. Apenas monte esse guia de estrutura e planejamento para que eu possa escrever o meu próprio texto.",
    category: "escola",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "7",
    title: "Estudo inteligente para provas",
    description: "Ideal para estudos rápidos antes de provas.",
    prompt:
      "Atue como um mentor de aprendizagem e especialista em técnicas de estudo ativo. Eu preciso estudar para uma prova sobre o seguinte assunto: [Inserir o Assunto ou Matéria aqui]. Monte um plano de estudo focado em APRENDER e compreender o conteúdo, e não apenas em decorar. Siga estas diretrizes: OS PILARES DO TEMA: Liste os 3 conceitos fundamentais desse assunto que eu sou obrigado a entender para ir bem na prova. EXPLICAÇÃO SIMPLES (MÉTODO FEYNMAN): Explique o conceito mais complexo desse assunto usando uma analogia simples do dia a dia, como se estivesse ensinando para uma criança. CONEXÃO PRÁTICA: Explique por que esse assunto é importante no mundo real ou como ele se aplica na prática, para que eu entenda a lógica por trás dele. DESAFIO DE FIXAÇÃO: Crie 1 estudo de caso ou um problema prático baseado nesse tema para eu resolver e testar meu raciocínio lógico. Não me dê respostas automáticas para eu decorar. Foque em me fazer entender o 'porquê' das coisas.",
    category: "escola",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },

  // ── Revisão ──
  {
    id: "8",
    title: "Quiz de revisão adaptativo",
    description: "Teste seu conhecimento com questões de múltipla escolha.",
    prompt:
      "Crie um quiz de revisão com 10 questões de múltipla escolha (4 alternativas cada) sobre [tema/matéria]. Nível de dificuldade: [fácil/médio/difícil]. Após as questões, coloque o gabarito comentado explicando por que cada resposta está correta.",
    category: "revisao",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "9",
    title: "Técnica Feynman — explique como se eu tivesse 12 anos",
    description: "Entenda qualquer conceito de forma simples e profunda.",
    prompt:
      "Explique o conceito de [tema] como se eu tivesse 12 anos, sem usar jargões técnicos. Depois, explique a versão aprofundada para quem já entende o básico. Por fim, me dê 3 analogias diferentes para fixar a ideia.",
    category: "revisao",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "10",
    title: "Método de repetição espaçada",
    description: "Planeje sua revisão para máxima retenção.",
    prompt:
      "Preciso memorizar [tema/lista de conteúdos] para [data da prova]. Crie um plano de revisão usando repetição espaçada para os próximos [X dias]. Divida o conteúdo em blocos diários e indique quando revisar o que já estudei.",
    category: "revisao",
    tags: ["ChatGPT", "Claude"],
  },

  // ── Tecnologia ──
  {
    id: "11",
    title: "Consolidando o aprendizado",
    description: "Revise o que aprendeu em aulas de tecnologia com explicações e perguntas.",
    prompt:
      "Atue como um tutor de tecnologia e me ajude a revisar o que aprendi hoje no curso da Evolua/Tecnologee. O tema da aula foi: [Inserir o tema da aula aqui].Faça o seguinte: Explique os 3 conceitos mais importantes desse tema de forma simples. Me dê 1 exemplo prático de como isso é usado no mercado de trabalho. Crie 2 perguntas rápidas de múltipla escolha para testar se eu realmente entendi o assunto. Não dê a resposta antes de eu responder!",
    category: "tecnologia",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "12",
    title: "Simulador Prático de Informática",
    description: " Pratique habilidades de informática com cenários realistas e feedback imediato.",
    prompt:
      "Atue como um técnico de TI e instrutor de Informática Básica. Estou aprendendo sobre o seguinte software ou recurso no curso da Evolua: [Inserir o que está estudando, ex: Excel - Fórmulas, Word - Formatação, Sistema Operacional - Pastas].Ajude-me a fixar o conteúdo aplicando este roteiro: VALOR NO MERCADO: Explique onde e como exatamente um profissional usa esse recurso específico no dia a dia de uma empresa. EXERCÍCIO DESAFIO: Crie um passo a passo prático para eu fazer agora no meu computador para treinar essa ferramenta (ex: monte uma tabela com tais colunas ou organize pastas de tal forma). DESVENDANDO ERROS: Me diga quais são os 2 erros mais comuns que as pessoas cometem ao usar essa ferramenta e como evitá-los.",
    category: "tecnologia",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "13",
    title: "Simulador de Rotinas de Escritório",
    description: "Pratique tarefas comuns de escritório com cenários realistas e feedback imediato.",
    prompt:
      "Atue como o Gerente Administrativo de uma grande empresa. Estou fazendo o curso de Assistente Administrativo na Evolua e o tema de hoje foi: [Inserir o tema, ex: Fluxo de Caixa, Atendimento ao Cliente, Organização de Arquivos, Rotinas de RH].Simule o ambiente de trabalho respondendo ao seguinte: CENÁRIO REAL DE ESCRITÓRIO: Crie um problema fictício que acontece rotineiramente em uma empresa sobre esse tema e peça para eu resolver como se eu fosse seu assistente. O QUE NÃO FAZER: Liste as 3 falhas mais graves que um assistente pode cometer nessa tarefa específica e quais são as consequências para a empresa. DICA DE PROVIMENTO: Me ensine um termo técnico, planilha essencial ou ferramenta digital que os melhores profissionais usam para se destacar nessa função.",
    category: "tecnologia",
    tags: ["ChatGPT", "Claude"],
  },

  // ── Raciocínio ──
  {
    id: "14",
    title: "Análise crítica de argumentos",
    description: "Desenvolva pensamento crítico sobre qualquer texto ou ideia.",
    prompt:
      "Analise criticamente o argumento abaixo. Identifique: (1) a tese principal, (2) as premissas usadas, (3) possíveis falácias ou pontos fracos, (4) contraargumentos válidos, (5) o que precisaria ser verdade para o argumento ser sólido.\n\nArgumento: [descreva ou cole o texto]",
    category: "raciocinio",
    tags: ["ChatGPT", "Claude"],
  },
  {
    id: "15",
    title: "Resolução de problemas passo a passo",
    description: "Decomponha qualquer problema complexo em passos claros.",
    prompt:
      "Preciso resolver o seguinte problema: [descreva o problema]. Me ajude a pensar nisso de forma estruturada: (1) defina o problema com clareza, (2) identifique as variáveis envolvidas, (3) liste possíveis abordagens, (4) recomende a melhor solução com justificativa.",
    category: "raciocinio",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "16",
    title: "Mestre da pesquisa científica",
    description: "Aprenda a pesquisar qualquer tema de forma confiável e eficiente.",
    prompt:
      "Atue como um orientador científico e especialista em pesquisa acadêmica. Eu preciso fazer um trabalho escolar ou pesquisar a fundo sobre o seguinte tema: [Inserir o Tema do Trabalho ou Curiosidade aqui]. Ajude-me a realizar uma pesquisa confiável e de alta qualidade seguindo estas diretrizes: TERMOS DE BUSCA AVANÇADOS: Liste as 3 melhores combinações de palavras-chave e operadores de busca (como o uso de aspas ou termos em inglês) para eu digitar no GOOGLE ACADÊMICO para encontrar os melhores artigos científicos e teses sobre o tema. COMO LER UM ARTIGO RÁPIDO: Explique-me em 3 passos simples como eu devo ler um artigo científico longo para extrair a informação que preciso sem perder tempo (ex: ler o resumo, introdução e conclusão). PONTOS CENTRALIZADOS: Me dê um resumo em tópicos das 3 principais descobertas ou fatos históricos inquestionáveis que a ciência já comprovou sobre esse tema. CHECAGEM DE FATOS: Me dê 2 perguntas-chave que eu devo fazer a mim mesmo ao ler qualquer site comum na internet para ter certeza de que aquela informação é confiável e tem base científica.",
    category: "raciocinio",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },

  // ── Produtividade ──
  {
    id: "17",
    title: "Indicação de livros.  resumo",
    description: "Receba recomendações de livros e resumos sobre qualquer tema.",
    prompt:
      "Atue como um bibliotecário digital e guia literário para estudantes. Eu quero começar a ler mais, mas preciso de ajuda para escolher e encontrar livros. Meu tema de interesse ou o assunto que quero ler é: [Inserir o Tema ou Gênero aqui, ex: Inteligência Artificial, Aventura, História do Brasil, Suspense].Ajude-me a organizar minhas leituras fazendo o seguinte: INDICAÇÕES DE LIVROS: Recomende 3 livros incríveis sobre esse tema. Diga o título, o autor e um resumo de 2 frases sobre o que a história aborda para me dar curiosidade. COMO ENCONTRAR GRÁTIS: Para cada livro indicado, me diga se ele já está em Domínio Público e onde posso pesquisar para baixar o PDF legalmente e de graça na internet (como o portal Domínio Público ou bibliotecas digitais abertas). RESUMO POR CAPÍTULO: Se eu escolher um livro específico e te pedir, você consegue criar um resumo dos pontos centrais de cada capítulo para me ajudar a acompanhar a leitura? DESAFIO DE LEITURA: Crie uma meta simples de leitura diária (ex: quantas páginas ler por dia) para que eu consiga terminar um livro em 15 dias sem ficar cansado.Não me dê links diretos de download que possam violar direitos autorais. Foque em me ensinar a buscar fontes oficiais e gratuitas.",
    category: "produtividade",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "18",
    title: "Preparação para prova",
    description: "Estratégia completa para os dias que antecedem uma avaliação.",
    prompt:
      "Tenho uma prova de [matéria] em [X dias]. Os tópicos são: [liste aqui]. Me dê: (1) um plano de revisão dia a dia, (2) os pontos que geralmente mais caem, (3) técnicas de memorização rápida para esses tópicos, (4) dicas para a noite anterior e no dia da prova.",
    category: "produtividade",
    tags: ["ChatGPT", "Claude", "Gemini"],
  },
  {
    id: "19",
    title: "Transformar anotações em material de estudo",
    description: "treine o algorítimo das redes sociais, para que mesmo consumindo vídeos curtos ou youtube vocês possam estar aprendendo algo relevante, e não apenas se distraindo. ",
    prompt:
      "Atue como um mentor de produtividade e curador de conteúdo digital. Eu passo muito tempo em redes sociais (como YouTube, Instagram ou TikTok) e quero usar esse tempo a meu favor para aprender novas habilidades úteis para a vida real.O assunto relevante que escolhi para aprender hoje é: [Escolha um: Finanças para Jovens / Empreendedorismo / Técnicas de Memória / Foco e Concentração / Oratória / Outro de sua escolha].Me ajude a dominar esse assunto usando minhas redes sociais através deste plano: PALAVRAS-CHAVE MÁGICAS: Liste as 4 melhores palavras-chave ou termos de busca para eu digitar no campo de pesquisa do YouTube ou TikTok para encontrar os melhores canais e criadores sérios sobre esse assunto. FILTRO DE CONTEÚDO: Me dê 3 dicas rápidas de como diferenciar um vídeo realmente educativo e embasado de um vídeo superficial, 'falso especialista' ou clickbait (chamada enganosa). O DESAFIO DOS 15 MINUTOS: Crie um método para eu aplicar hoje: após assistir a apenas um vídeo curto sobre o assunto, o que eu devo anotar ou fazer na prática para fixar o aprendizado em vez de só esquecer no próximo scroll? TREINANDO O ALGORITMO: Me dê um comando de 2 linhas para eu usar no meu dia a dia para fazer o algoritmo da rede social entender que eu quero ver mais conteúdos educativos como esse na minha linha do tempo.",
    category: "produtividade",
    tags: ["ChatGPT", "Claude"],
  },
];

// ─── AI Tag colors ────────────────────────────────────────────────────────────

const AI_TAG_STYLES: Record<AITag, string> = {
  ChatGPT:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
  Claude:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800",
  Gemini:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
  "Meta IA":
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800",
  Todos:
    "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
};

// ─── PromptCard ───────────────────────────────────────────────────────────────

function PromptCard({ prompt }: { prompt: Prompt }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/30 hover:shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground leading-snug">{prompt.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{prompt.description}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className={cn(
            "shrink-0 h-8 w-8 p-0 rounded-lg transition-all duration-200",
            copied
              ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
              : "opacity-0 group-hover:opacity-100"
          )}
          aria-label="Copiar prompt"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* Prompt preview */}
      <div className="rounded-xl bg-muted/50 border border-border/50 px-3 py-2.5">
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-mono whitespace-pre-wrap">
          {prompt.prompt}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {prompt.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                AI_TAG_STYLES[tag]
              )}
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className={cn(
            "text-xs font-medium transition-colors",
            copied ? "text-emerald-600 dark:text-emerald-400" : "text-primary hover:text-primary/80"
          )}
        >
          {copied ? "Copiado!" : "Copiar prompt"}
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromptsPage() {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return PROMPTS.filter((p) => {
      const matchesCategory = activeCategory === "todos" || p.category === activeCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.prompt.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              SkillUp × IA
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            Prompts para seus estudos
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
            Copie, cole na sua IA favorita e acelere seu aprendizado. Todos os prompts têm variáveis{" "}
            <span className="font-medium text-foreground">[entre colchetes]</span> para você personalizar.
          </p>
        </div>

        {/* Search + Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveCategory(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
                  activeCategory === id
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Count */}
        <p className="mb-4 text-xs text-muted-foreground">
          {filtered.length} prompt{filtered.length !== 1 ? "s" : ""}{" "}
          {activeCategory !== "todos"
            ? `em ${CATEGORIES.find((c) => c.id === activeCategory)?.label}`
            : "no total"}
        </p>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">Nenhum prompt encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tente outra busca ou explore uma categoria diferente.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setActiveCategory("todos");
              }}
              className="mt-4 text-xs text-primary hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </div>
  );
}