import type { Project } from "@/lib/types";
import { escapeHtml, renderMarkdown } from "@/lib/markdown";
import { defaultSiteContent, type HomeContent, type LinkItem, type SiteContentMap } from "@/lib/site-content";

function imageMarkup(project: Project): string {
  const src = project.cardImageUrl || project.heroImageUrl;
  if (!src) return '<div class="project-image-placeholder" aria-hidden="true"></div>';
  return `<img src="${escapeHtml(src)}" alt="${escapeHtml(project.cardImageAlt)}" loading="lazy" />`;
}

function cardMarkup(project: Project): string {
  const layoutClass =
    project.cardLayout === "wide"
      ? "project-featured"
      : project.cardLayout === "portrait"
        ? "project-portrait"
        : "project-landscape";
  const meta = [project.title, project.projectType || project.platform, project.statusLabel]
    .filter(Boolean)
    .map((item) => `<span>${escapeHtml(item)}</span>`)
    .join("");

  return `<a class="project ${layoutClass} project-link" href="/work/${escapeHtml(project.slug)}/" aria-label="Read the ${escapeHtml(project.title)} case study">
    <figure class="project-media project-media-${escapeHtml(project.cardLayout)}">${imageMarkup(project)}</figure>
    <div class="project-copy">
      <div class="project-meta">${meta}</div>
      <h3>${escapeHtml(project.cardHeadline)}</h3>
      <p>${escapeHtml(project.shortDescription)}</p>
    </div>
  </a>`;
}

export function renderWorkSection(projects: Project[], home?: HomeContent): string {
  const cards: string[] = [];
  let pair: string[] = [];
  const flushPair = () => {
    if (!pair.length) return;
    cards.push(`<div class="project-pair">${pair.join("\n")}</div>`);
    pair = [];
  };

  for (const project of projects) {
    if (project.cardLayout === "wide") {
      flushPair();
      cards.push(cardMarkup(project));
    } else {
      pair.push(cardMarkup(project));
      if (pair.length === 2) flushPair();
    }
  }
  flushPair();

  const body = cards.length
    ? cards.join("\n")
    : '<p class="work-empty">New work is being prepared. Check back soon.</p>';
  return `<section class="work section-shell" id="work" aria-labelledby="work-title">
    <header class="work-heading"><p>${escapeHtml(home?.workEyebrow ?? "Featured work and self-initiated concepts")}</p><h2 id="work-title">${escapeHtml(home?.workTitle ?? "The decisions are part of the design.")}</h2></header>
    ${body}
  </section>`;
}

function metaItem(label: string, value: string): string {
  if (!value) return "";
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function galleryMarkup(project: Project): string {
  if (!project.galleryImages.length) return "";
  return `<section class="case-section case-gallery-section" id="gallery" data-case-section>
    <p class="chapter-label">Gallery</p>
    <h2>Selected screens and details.</h2>
    <div class="case-gallery">
      ${project.galleryImages
        .map(
          (image) => `<figure><img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.alt)}" loading="lazy" />${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}</figure>`,
        )
        .join("\n")}
    </div>
  </section>`;
}

function caseLinks(items: LinkItem[]): string {
  return items.map((item) => `<a href="${escapeHtml(item.href.startsWith("#") ? `/${item.href}` : item.href)}">${escapeHtml(item.label)}</a>`).join("");
}

export function renderCaseStudy(project: Project, nextProject: Project | null, content: SiteContentMap = defaultSiteContent): string {
  const { navigation: nav, settings } = content;
  const contactHref = nav.headerCta.href.startsWith("#") ? `/${nav.headerCta.href}` : nav.headerCta.href;
  const nameParts = nav.portfolioWordmark.trim().split(/\s+/);
  const caseWordmark = nameParts.length < 2
    ? `<span>${escapeHtml(nav.portfolioWordmark)}</span>`
    : `<span>${escapeHtml(nameParts.slice(0, -1).join(" "))}</span><span>${escapeHtml(nameParts.at(-1) ?? "")}</span>`;
  const story = renderMarkdown(project.contentMarkdown, project.sectionImages);
  const toc = [
    ...story.toc,
    ...(project.galleryImages.length ? [{ id: "gallery", label: "Gallery" }] : []),
  ];
  const heroImage = project.heroImageUrl || project.cardImageUrl;
  const tags = project.tags
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");
  const next = nextProject
    ? `<a class="next-project" href="/work/${escapeHtml(nextProject.slug)}/"><div><span>Next project</span><strong>${escapeHtml(nextProject.title)}</strong></div><span class="next-arrow" aria-hidden="true">↗</span></a>`
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(project.shortDescription)}" />
    <meta name="theme-color" content="${escapeHtml(settings.themeColor)}" />
    <title>${escapeHtml(project.title)} — ${escapeHtml(nav.portfolioWordmark)}</title>
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="preload" href="/assets/geist-variable.ttf" as="font" type="font/ttf" crossorigin />
    <link rel="stylesheet" href="/case-study.css" />
    <script src="/script.js" defer></script>
  </head>
  <body class="case-page project-dynamic" style="--project-accent:${escapeHtml(project.accentColor)}">
    <a class="skip-link" href="#case-content">Skip to content</a>
    <header class="site-header" data-header>
      <a class="wordmark" href="/" aria-label="${escapeHtml(nav.portfolioWordmark)}, home">${caseWordmark}</a>
      <nav class="desktop-nav" aria-label="Primary navigation">${caseLinks(nav.primaryLinks)}</nav>
      <div class="header-actions"><button class="icon-button theme-toggle" type="button" aria-label="Switch color theme" data-theme-toggle><span class="theme-icon" aria-hidden="true"></span></button><a class="header-cta" href="${escapeHtml(contactHref)}">${escapeHtml(nav.headerCta.label)}</a><button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-button><span>Menu</span></button></div>
      <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden data-mobile-menu>${caseLinks(nav.primaryLinks)}<a href="${escapeHtml(contactHref)}">${escapeHtml(nav.headerCta.label)}</a></nav>
    </header>
    <main class="case-main" id="case-content">
      <section class="case-hero">
        <a class="back-link" href="/#work"><span aria-hidden="true">←</span> Selected work</a>
        <div class="case-title-grid"><div><p class="case-kicker">${tags || escapeHtml(project.statusLabel)}</p><h1>${escapeHtml(project.title)}</h1></div><p class="case-summary">${escapeHtml(project.shortDescription)}</p></div>
        <dl class="case-meta">${metaItem("Project", project.projectType)}${metaItem("Platform", project.platform)}${metaItem("Role", project.role)}${metaItem("Year", project.year)}</dl>
        ${heroImage ? `<figure class="case-hero-media"><img src="${escapeHtml(heroImage)}" alt="${escapeHtml(project.heroImageAlt || project.cardImageAlt)}" fetchpriority="high" /></figure>` : ""}
      </section>
      <div class="case-layout">
        <aside class="case-index"><nav aria-label="Case study chapters"><p>On this page</p>${toc.map((item) => `<a href="#${escapeHtml(item.id)}">${escapeHtml(item.label)}</a>`).join("")}</nav></aside>
        <article class="case-story">${story.html}${galleryMarkup(project)}</article>
      </div>
      ${next}
    </main>
    <footer class="case-footer"><span>${escapeHtml(nav.footerIdentity)}</span><a href="${escapeHtml(contactHref)}">${escapeHtml(nav.headerCta.label)} ↗</a></footer>
  </body>
</html>`;
}
