import { homeContent } from "@/content/home";

const linkFor = (label: string) => {
  if (label.includes("projets") || label.includes("La Cité") || label.includes("Azhar")) return "#projets";
  if (label.includes("visite") || label.includes("créneau")) return "#reservation";
  if (label.includes("guides")) return "#investir";
  if (label.includes("actualités")) return "#actualites";
  return "#contact";
};

function Actions({ labels }: { labels: readonly string[] }) {
  return (
    <div className="actions">
      {labels.map((label, index) => (
        <a className={index === 0 ? "button button-primary" : "button button-secondary"} href={linkFor(label)} key={label}>
          {label}
        </a>
      ))}
    </div>
  );
}

export default function HomePage() {
  const content = homeContent;
  return (
    <main>
      <section className="hero">
        <nav className="nav" aria-label="Navigation principale">
          <a className="brand" href="#" aria-label="BENZAMIA Promotion, accueil">
            <span className="monogram" aria-hidden="true">B</span><span>BENZAMIA</span>
          </a>
          <div className="nav-links">
            <a href="#projets">Projets</a><a href="#investir">Investir</a>
            <a href="#actualites">Actualités</a><a href="#contact">Contact</a>
          </div>
          <a className="nav-cta" href="#reservation">Réserver une visite</a>
        </nav>
        <div className="hero-content">
          <p className="eyebrow">{content.hero.eyebrow}</p>
          <h1>{content.hero.title[0]}<br /><em>{content.hero.title[1]}</em></h1>
          <p className="lead">{content.hero.description}</p>
          <Actions labels={content.hero.actions} />
        </div>
        <div className="hero-note">Architecture résidentielle · Chlef</div>
      </section>

      <section className="section split" id="benzamia">
        <p className="section-label">BENZAMIA</p>
        <div>
          <h2>{content.company.title}</h2>
          {content.company.paragraphs.map((paragraph) => <p className="copy" key={paragraph}>{paragraph}</p>)}
          <div className="stats">{content.company.stats.map((stat) => <strong key={stat}>{stat}</strong>)}</div>
        </div>
      </section>

      <section className="section" id="projets">
        <p className="section-label">PROJETS</p>
        <h2>{content.projects.title}</h2>
        <p className="copy wide">{content.projects.description}</p>
        <div className="filters" aria-label="Filtres de projets">
          {content.projects.filters.map((filter, index) => <button className={index === 0 ? "filter active" : "filter"} type="button" key={filter}>{filter}</button>)}
        </div>
        <div className="project-grid">
          {content.projects.items.map((project, index) => (
            <article className="project-card" key={project.slug}>
              <div className={index === 0 ? "project-visual warm" : "project-visual cool"}><span>{project.status}</span></div>
              <div className="project-body">
                <h3>{project.name}</h3><p>{project.description}</p><Actions labels={project.actions} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feature feature-dark" id="visite-virtuelle">
        <p className="section-label">VISITE VIRTUELLE</p><h2>{content.virtualTour.title}</h2>
        <p>{content.virtualTour.description}</p><a className="button button-light" href="#reservation">{content.virtualTour.action}</a>
      </section>

      <section className="section split" id="reservation">
        <p className="section-label">RÉSERVATION</p>
        <div><h2>{content.booking.title}</h2><p className="copy">{content.booking.description}</p>
          <a className="button button-primary" href="#contact">{content.booking.action}</a></div>
      </section>

      <section className="editorial-grid">
        <article className="feature" id="investir">
          <p className="section-label">INVESTIR À CHLEF</p><h2>{content.invest.title}</h2>
          <p>{content.invest.description}</p><a className="text-link" href="#">{content.invest.action} →</a>
        </article>
        <article className="feature feature-red" id="actualites">
          <p className="section-label">CONSEILS ET ACTUALITÉS</p><h2>{content.news.title}</h2>
          <p>{content.news.description}</p><a className="text-link" href="#">{content.news.action} →</a>
        </article>
      </section>

      <section className="final" id="contact">
        <h2>{content.final.title}</h2><p>{content.final.description}</p><Actions labels={content.final.actions} />
      </section>
    </main>
  );
}
