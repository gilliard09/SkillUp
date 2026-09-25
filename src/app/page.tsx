import { ArrowRight, Check, MapPin, MessageCircle, Monitor, ShieldCheck, Sparkles } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_TECNOLOGGE_WHATSAPP || "SEU_NUMERO_AQUI";

const whatsappMessage = encodeURIComponent(
  "Olá! Vim pelo anúncio da formação para adolescentes de 12 a 17 anos. Quero descobrir qual formação faz sentido para meu filho."
);

function whatsappUrl() {
  const number = WHATSAPP_NUMBER.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${whatsappMessage}`;
}

export default function RootPage() {
  return (
    <main className="tec-landing">
      <section className="tec-hero">
        <nav className="tec-nav tec-container">
          <a href="/" className="tec-brand" aria-label="Tecnologge">
            <img src="/icons/icon.png" alt="Tecnologge" />
            <span>Tecnologge</span>
          </a>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="tec-nav-cta">
            Fale com a equipe
          </a>
        </nav>

        <div className="tec-container tec-hero-content">
          <div className="tec-eyebrow">Formação para adolescentes de 12 a 17 anos</div>
          <h1>Seu filho tem entre 12 e 17 anos e ainda não entende de informática?</h1>
          <p className="tec-hero-lead">
            Começar uma formação ainda este ano pode colocar seu filho alguns passos à frente
            quando chegar a hora de entrar no mercado de trabalho.
          </p>

          <div className="tec-video">
            <div className="tec-video-placeholder">
              <div className="tec-video-icon">▶</div>
              <strong>Seu vídeo de campanha entra aqui</strong>
              <span>Substitua por <code>/public/assets/video-campanha.mp4</code></span>
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
            <span className="tec-section-label">Pode começar do zero</span>
            <h2>Ele não precisa saber informática para começar.</h2>
          </div>
          <div>
            <p>
              Muitos pais pensam que o filho precisa chegar sabendo usar computador,
              programas ou ferramentas profissionais. Não precisa.
            </p>
            <p>
              A formação foi pensada para acompanhar o aluno desde os primeiros passos,
              transformando curiosidade em conhecimento prático.
            </p>
            <ul className="tec-check-list">
              <li><Check size={19} /> Linguagem adequada para adolescentes</li>
              <li><Check size={19} /> Aprendizado prático desde o início</li>
              <li><Check size={19} /> Acompanhamento durante a formação</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="tec-section tec-purple">
        <div className="tec-container tec-center">
          <span className="tec-section-label">Por que esperar janeiro?</span>
          <h2>Enquanto muitos pais deixam para 2027, seu filho pode começar agora.</h2>
          <p>
            Quatro meses de aprendizado não são apenas quatro meses no calendário.
            São mais tempo praticando, errando, corrigindo e construindo confiança.
          </p>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="tec-secondary-cta">
            Quero entender as formações
            <ArrowRight size={19} />
          </a>
        </div>
      </section>

      <section className="tec-section tec-light">
        <div className="tec-container">
          <div className="tec-section-heading">
            <span className="tec-section-label">Formação</span>
            <h2>Mais do que aprender informática.</h2>
            <p>
              O objetivo é desenvolver habilidades que façam sentido para a escola,
              para projetos pessoais e para o futuro profissional.
            </p>
          </div>

          <div className="tec-feature-grid">
            <article className="tec-feature">
              <Monitor size={25} />
              <h3>Ferramentas digitais</h3>
              <p>Conhecimento prático para usar a tecnologia com mais autonomia e segurança.</p>
            </article>
            <article className="tec-feature">
              <Sparkles size={25} />
              <h3>Habilidades para o futuro</h3>
              <p>Contato com competências que podem acompanhar o aluno em diferentes caminhos profissionais.</p>
            </article>
            <article className="tec-feature">
              <ShieldCheck size={25} />
              <h3>Confiança para criar</h3>
              <p>Aprender fazendo, com espaço para testar ideias e resolver problemas.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="tec-section tec-dark">
        <div className="tec-container tec-two-col tec-audience">
          <div>
            <span className="tec-section-label">Essa formação é para ele se...</span>
            <h2>Seu filho tem entre 12 e 17 anos e você percebe que ele precisa se preparar melhor.</h2>
          </div>
          <div className="tec-audience-list">
            <p><Check size={19} /> Passa bastante tempo no computador, mas não sabe usar a tecnologia para aprender.</p>
            <p><Check size={19} /> Tem curiosidade e vontade de aprender algo novo.</p>
            <p><Check size={19} /> Precisa desenvolver habilidades além da escola tradicional.</p>
            <p><Check size={19} /> Você quer que ele comece a construir uma preparação profissional desde cedo.</p>
          </div>
        </div>
      </section>

      <section className="tec-section tec-light">
        <div className="tec-container">
          <div className="tec-proof">
            <div>
              <span className="tec-section-label">Conheça a Tecnologge</span>
              <h2>Um ambiente para aprender fazendo.</h2>
              <p>
                Aqui entrarão fotos reais dos alunos, da escola e das experiências
                que fazem parte da formação.
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
        <div className="tec-container tec-location-inner">
          <div>
            <span className="tec-section-label">Onde estamos</span>
            <h2>Venha conhecer a Tecnologge.</h2>
            <p>Atendimento presencial em nossas unidades. A equipe pode explicar as opções e ajudar você a encontrar a formação adequada.</p>
          </div>
          <div className="tec-location-card">
            <MapPin size={23} />
            <strong>Garuva e Joinville</strong>
            <span>Os endereços e o mapa podem ser inseridos aqui.</span>
          </div>
        </div>
      </section>

      <section className="tec-final">
        <div className="tec-container tec-center">
          <span className="tec-section-label">O próximo passo é simples</span>
          <h2>Descubra qual formação faz sentido para seu filho.</h2>
          <p>Converse com nossa equipe e veja as opções disponíveis para adolescentes de 12 a 17 anos.</p>
          <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="tec-primary-cta">
            <MessageCircle size={20} />
            Quero conversar com a Tecnologge
            <ArrowRight size={19} />
          </a>
        </div>
      </section>

      <footer className="tec-footer">
        <div className="tec-container">
          <strong>Tecnologge</strong>
          <span>Voe na direção certa.</span>
        </div>
      </footer>
    </main>
  );
}
