import { ArrowRight, Check, MapPin, MessageCircle, Monitor, Sparkles, Star } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TECNOLOGGE_WHATSAPP || "SEU_NUMERO_AQUI";

const whatsappMessage = encodeURIComponent(
  "Olá! Vim pelo anúncio da formação para adolescentes de 12 a 17 anos. Quero descobrir qual formação faz sentido para meu filho."
);

function whatsappUrl() {
  const number = WHATSAPP_NUMBER.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${whatsappMessage}`;
}

const courses = [
  {
    title: "Robótica Completo",
    description: "Aprenda tecnologia na prática, desenvolvendo projetos e colocando ideias para funcionar.",
  },
  {
    title: "Tecnologia Fundamental",
    description: "Informática completa + Inteligência Artificial para construir uma base sólida em tecnologia.",
  },
  {
    title: "Desenvolvedor WEB",
    description: "Comece a entender como sites e experiências digitais são criados.",
  },
  {
    title: "Desenvolvedor de Sistemas",
    description: "Um caminho para quem quer conhecer programação e desenvolvimento de sistemas.",
  },
  {
    title: "Tecnologia com Games",
    description: "Use o interesse por jogos como porta de entrada para aprender tecnologia e criação.",
  },
  {
    title: "Assistente Administrativo",
    description: "Desenvolva conhecimentos digitais e administrativos úteis para o ambiente profissional.",
  },
];

const testimonials = [
  {
    name: "Vinnicius Fabricio Oliveira",
    text: "O ensino é muito bom tanto os exercícios quanto as explicações, o atendimento é incrível igualmente com a qualidade das aulas. A escola possui mais de 90 tipos de cursos, podendo ser tecnologia, programação, robótica, design gráfico e etc. Além dos cursos tem as avaliações que você precisa fazer para passar de aula, servindo como um tipo de exercício de fixação para o armazenamento de informações para o seu cérebro e também tem o material físico e digital, para que você possa ter mais apoio na hora da avaliação e dos exercícios. E é claro que eu não poderia deixar de falar sobre a professora que é extremamente atenciosa conseguindo tirar todas as suas dúvidas em relação às aulas, super educada e prestativa sobre a aula e suas dúvidas.",
    url: "https://www.google.com/maps/contrib/104336792854448737606/reviews?hl=pt-BR",
  },
  {
    name: "Matheus Dos santos",
    text: "A escola é muito boa, o atendimento e muito bom, e aprende bastante coisa, o curso e bem legal eu tô gostando muito, a sala de aula e bem limpa e organizada os Pc são bons, e tem bastante coisa para fazer de interessante (aprender sobre o windows, aprender a digitar rápido etc...)",
    url: "https://www.google.com/maps/contrib/102309487409943505546/reviews?hl=pt-BR",
  },
  {
    name: "Gabriela de Oliveira",
    text: "No início pra mim foi difícil, pois não conseguia acompanhar muito bem as aulas, mas com o tempo eu realmente comecei a aprender e tive boas notas. Sobre atendimento e etc, acho q é bom, sempre tratada com respeito e com atenção. Recomendo bastante a escola.",
    url: "https://www.google.com/maps/contrib/115695578266344360850/reviews?hl=pt-BR",
  },
  {
    name: "Geovanna Kamily",
    text: "Faço curso aqui, e eu simplesmente amo muito!",
    url: "https://www.google.com/maps/contrib/110495165661778808191/reviews?hl=pt-BR",
  },
  {
    name: "Alex Sanctus",
    text: "Segundo curso que faço, gosto muito do local que é bem perto de casa, além de ter vários cursos diferentes...é tudo oq eu preciso para os meus estudos atualmente. Recomendo bastante!",
    url: "https://www.google.com/maps/contrib/109854518934899296500/reviews?hl=pt-BR",
  },
];

export default function LandingPage() {
  return (
    <main className="tec-landing">
      <section className="tec-hero">
        <nav className="tec-nav tec-container">
          <a href="/landingpage" className="tec-brand" aria-label="Tecnologge">
            <div className="tec-logo-placeholder">LOGO</div>
            <span>Tecnologge</span>
          </a>
        </nav>

        <div className="tec-container tec-hero-content">
          <div className="tec-eyebrow">FORMAÇÃO PARA ADOLESCENTES DE 12 A 17 ANOS</div>
          <h1>Seu filho tem entre 12 e 17 anos e ainda não entende de informática?</h1>
          <p className="tec-hero-lead">
            Então ele não precisa esperar 2027 para começar. Uma formação iniciada agora pode dar a ele meses de aprendizado, prática e experiência antes mesmo do próximo ano começar.
          </p>

          <div className="tec-video">
            <div className="tec-video-placeholder">
              <div className="tec-video-icon">▶</div>
              <strong>Vídeo da campanha</strong>
              <span>Espaço reservado para o vídeo real</span>
            </div>
          </div>

          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="tec-primary-cta">
            <MessageCircle size={20} />
            Descubra qual formação faz sentido para seu filho!
            <ArrowRight size={19} />
          </a>
          <p className="tec-microcopy">Atendimento rápido pelo WhatsApp • Sem compromisso</p>
        </div>
      </section>

      <section className="tec-section tec-light">
        <div className="tec-container tec-two-col">
          <div>
            <span className="tec-section-label">PODE COMEÇAR DO ZERO</span>
            <h2>Ele não precisa saber informática para começar.</h2>
          </div>
          <div>
            <p>
              Muitos pais pensam que o filho precisa chegar sabendo usar computador, programas ou ferramentas profissionais. Não precisa.
            </p>
            <p>
              As formações acompanham o aluno desde os primeiros passos, transformando curiosidade em conhecimento prático.
            </p>
            <ul className="tec-check-list">
              <li><Check size={19} /> Pode começar do zero.</li>
              <li><Check size={19} /> Aprende colocando a mão na massa.</li>
              <li><Check size={19} /> Conta com acompanhamento durante a formação.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="tec-section tec-purple">
        <div className="tec-container tec-center">
          <span className="tec-section-label">POR QUE ESPERAR JANEIRO?</span>
          <h2>Enquanto muitos pais deixam para 2027, seu filho pode começar agora.</h2>
          <p>
            Quatro meses de aprendizado não são apenas quatro meses no calendário. São mais tempo praticando, descobrindo, errando, corrigindo e construindo confiança.
          </p>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="tec-secondary-cta">
            Quero entender as formações <ArrowRight size={19} />
          </a>
        </div>
      </section>

      <section className="tec-section tec-light">
        <div className="tec-container">
          <div className="tec-section-heading">
            <span className="tec-section-label">EXPERIÊNCIA</span>
            <h2>Essa história já começou há 9 anos.</h2>
            <p>Hoje, centenas de alunos continuam aprendendo com a Tecnologge.</p>
          </div>
          <div className="tec-stats">
            <div><strong>+1.000</strong><span>alunos formados</span></div>
            <div><strong>+300</strong><span>alunos ativos em 2026</span></div>
            <div><strong>9 anos</strong><span>de experiência</span></div>
          </div>
        </div>
      </section>

      <section className="tec-section tec-light">
        <div className="tec-container">
          <div className="tec-section-heading">
            <span className="tec-section-label">ESCOLHA O CAMINHO</span>
            <h2>O que seu filho pode aprender?</h2>
            <p>
              Para esta campanha, a Tecnologge oferece diferentes caminhos para adolescentes de 12 a 17 anos. A equipe pode ajudar a identificar qual combina melhor com o perfil e os interesses do seu filho.
            </p>
          </div>

          <div className="tec-feature-grid">
            {courses.map((course) => (
              <article className="tec-feature" key={course.title}>
                <Sparkles size={25} />
                <h3>{course.title}</h3>
                <p>{course.description}</p>
              </article>
            ))}
          </div>

          <div className="tec-center" style={{ marginTop: "32px" }}>
            <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="tec-secondary-cta">
              Descobrir a formação ideal <ArrowRight size={19} />
            </a>
          </div>
        </div>
      </section>

      <section className="tec-section tec-dark">
        <div className="tec-container tec-two-col tec-audience">
          <div>
            <span className="tec-section-label">NÃO É SÓ SOBRE INFORMÁTICA</span>
            <h2>É sobre descobrir que ele também pode criar.</h2>
          </div>
          <div>
            <p>
              Seu filho pode aprender a resolver problemas, desenvolver projetos e construir algo com a tecnologia.
            </p>
            <p>
              A tecnologia deixa de ser apenas aquilo que ele consome e passa a ser também uma ferramenta para criar, aprender e se preparar para o futuro.
            </p>
            <ul className="tec-check-list">
              <li><Check size={19} /> Desenvolver autonomia.</li>
              <li><Check size={19} /> Aprender a resolver problemas.</li>
              <li><Check size={19} /> Conhecer possibilidades profissionais.</li>
              <li><Check size={19} /> Construir habilidades desde cedo.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="tec-section tec-light">
        <div className="tec-container tec-two-col">
          <div>
            <span className="tec-section-label">ESSA FORMAÇÃO PODE FAZER SENTIDO</span>
            <h2>Para seu filho que está pronto para dar um próximo passo.</h2>
          </div>
          <div className="tec-audience-list">
            <p><Check size={19} /> Tem entre 12 e 17 anos.</p>
            <p><Check size={19} /> Está começando do zero ou quer avançar.</p>
            <p><Check size={19} /> Gosta de tecnologia ou demonstra curiosidade.</p>
            <p><Check size={19} /> Passa bastante tempo no computador e pode transformar esse tempo em aprendizado.</p>
            <p><Check size={19} /> Você quer que ele comece a desenvolver habilidades profissionais desde cedo.</p>
          </div>
        </div>
      </section>

      <section className="tec-section tec-testimonials">
        <div className="tec-container">
          <div className="tec-section-heading">
            <span className="tec-section-label">AVALIAÇÕES REAIS DO GOOGLE</span>
            <h2>Quem já passou pela Tecnologge tem o que contar.</h2>
            <p>A Tecnologge possui avaliação geral de 4,7 estrelas no Google.</p>
          </div>

          <div className="tec-testimonial-grid">
            {testimonials.map((testimonial) => (
              <article className="tec-testimonial" key={testimonial.name}>
                <div className="tec-stars" aria-label="5 estrelas">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={17} fill="currentColor" />
                  ))}
                </div>
                <p>“{testimonial.text}”</p>
                <strong>{testimonial.name}</strong>
                <a href={testimonial.url} target="_blank" rel="noreferrer">Ver avaliação no Google</a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tec-section tec-light">
        <div className="tec-container">
          <div className="tec-proof">
            <div>
              <span className="tec-section-label">CONHEÇA A TECNOLOGGE</span>
              <h2>Um ambiente para aprender fazendo.</h2>
              <p>
                Aqui entram fotos reais dos alunos, da escola e das atividades. O objetivo é mostrar a experiência como ela realmente acontece.
              </p>
            </div>
            <div className="tec-photo-grid">
              <div>Foto de aluno</div>
              <div>Foto da escola</div>
              <div>Foto de atividade</div>
            </div>
          </div>
        </div>
      </section>

      <section className="tec-section tec-location">
        <div className="tec-container">
          <div className="tec-section-heading">
            <span className="tec-section-label">ONDE ESTAMOS</span>
            <h2>Você pode conhecer a Tecnologge de perto.</h2>
            <p>Escolha a unidade mais conveniente e fale com nossa equipe.</p>
          </div>

          <div className="tec-location-grid">
            <div className="tec-location-card">
              <MapPin size={23} />
              <strong>Garuva</strong>
              <span>Av. Celso Ramos, 1846<br />Centro — Garuva/SC</span>
              <a href="https://www.google.com/maps/search/?api=1&query=Av.%20Celso%20Ramos%2C%201846%2C%20Garuva%2C%20SC" target="_blank" rel="noreferrer" className="tec-secondary-cta">
                Como chegar <ArrowRight size={17} />
              </a>
            </div>
            <div className="tec-location-card">
              <MapPin size={23} />
              <strong>Joinville</strong>
              <span>Rua Emilio Landmann, 668<br />Aventureiro — Joinville/SC</span>
              <a href="https://www.google.com/maps/search/?api=1&query=Rua%20Emilio%20Landmann%2C%20668%2C%20Joinville%2C%20SC" target="_blank" rel="noreferrer" className="tec-secondary-cta">
                Como chegar <ArrowRight size={17} />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="tec-final">
        <div className="tec-container tec-center">
          <span className="tec-section-label">O PRÓXIMO PASSO É SIMPLES</span>
          <h2>Descubra qual formação faz sentido para seu filho.</h2>
          <p>Converse com nossa equipe, conheça as formações disponíveis e descubra qual delas combina melhor com ele.</p>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="tec-primary-cta">
            <MessageCircle size={20} />
            Descubra qual formação faz sentido para seu filho!
            <ArrowRight size={19} />
          </a>
        </div>
      </section>

      <footer className="tec-footer">
        <div className="tec-container"><strong>Tecnologge</strong><span>Voe na direção certa.</span></div>
      </footer>
    </main>
  );
}
