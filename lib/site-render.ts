import homeTemplate from "@/templates/home.html?raw";
import studioTemplate from "@/templates/studio.html?raw";

import { escapeHtml } from "@/lib/markdown";
import { renderWorkSection } from "@/lib/render";
import type { Project } from "@/lib/types";
import type { LinkItem, SeoFields, SiteContentMap } from "@/lib/site-content";

const e = escapeHtml;

function section(html: string, className: string, replacement: string): string {
  const pattern = new RegExp(`<section class="${className}[^>]*>[\\s\\S]*?<\\/section>`);
  if (!pattern.test(html)) throw new Error(`Missing ${className} section in site template.`);
  return html.replace(pattern, replacement);
}

function links(items: LinkItem[], prefix = ""): string {
  return items.map(({ label, href }) => `<a href="${e(prefixHash(href, prefix))}">${e(label)}</a>`).join("");
}

function prefixHash(href: string, prefix: string): string {
  return prefix && href.startsWith("#") ? `${prefix}${href}` : href;
}

function wordmark(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return `<span>${e(text)}</span>`;
  return `<span>${e(words.slice(0, -1).join(" "))}</span><span>${e(words.at(-1) ?? "")}</span>`;
}

function head(html: string, seo: SeoFields, themeColor: string, heroUrl: string, origin: string): string {
  let result = html
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${e(seo.description)}" />`)
    .replace(/<meta name="theme-color" content="[^"]*" \/>/, `<meta name="theme-color" content="${e(themeColor)}" />`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${e(seo.title)}</title>`)
    .replace(/<link rel="preload" href="[^"]*" as="image" fetchpriority="high" \/>/, `<link rel="preload" href="${e(heroUrl)}" as="image" fetchpriority="high" />`);
  const socialImage = seo.socialImageUrl ? new URL(seo.socialImageUrl, origin).href : "";
  const social = socialImage
    ? `<meta property="og:image" content="${e(socialImage)}" /><meta name="twitter:image" content="${e(socialImage)}" /><meta name="twitter:card" content="summary_large_image" />`
    : `<meta name="twitter:card" content="summary" />`;
  result = result.replace("</head>", `<meta property="og:title" content="${e(seo.title)}" /><meta property="og:description" content="${e(seo.description)}" />${social}</head>`);
  return result;
}

function homeHeader(content: SiteContentMap): string {
  const { navigation: nav } = content;
  return `<header class="site-header" data-header>
    <a class="wordmark" href="#top" aria-label="${e(nav.portfolioWordmark)}, home">${wordmark(nav.portfolioWordmark)}</a>
    <nav class="desktop-nav" aria-label="Primary navigation">${links(nav.primaryLinks)}</nav>
    <div class="header-actions"><button class="icon-button theme-toggle" type="button" aria-label="Switch color theme" data-theme-toggle><span class="theme-icon" aria-hidden="true"></span></button><a class="header-cta" href="${e(nav.headerCta.href)}">${e(nav.headerCta.label)}</a><button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-button><span>Menu</span></button></div>
    <nav class="mobile-menu" id="mobile-menu" aria-label="Mobile navigation" hidden data-mobile-menu>${links(nav.primaryLinks)}<a href="${e(nav.headerCta.href)}">${e(nav.headerCta.label)}</a></nav>
  </header>`;
}

function homeFooter(content: SiteContentMap): string {
  const { navigation: nav, settings } = content;
  const identity = nav.footerIdentity.trim().split(/\s+/).map(e).join("<br />");
  return `<footer class="site-footer">
    <div class="footer-identity"><span>${e(nav.footerSubtitle)}</span><strong>${identity}</strong></div>
    <nav aria-label="Footer work links"><h3>Explore</h3>${links(nav.footerExplore)}</nav>
    <nav aria-label="Footer studio links"><h3>Studio</h3>${links(nav.footerStudio)}</nav>
    <div class="footer-contact"><h3>Contact</h3><a href="mailto:${e(settings.contactEmail)}">Email</a>${links(nav.socialLinks)}<span>${e(nav.copyright)}</span></div>
  </footer>`;
}

export function renderHomePage(content: SiteContentMap, projects: Project[], origin: string): string {
  const { home, services, navigation: nav, settings } = content;
  let html = head(homeTemplate, settings.homeSeo, settings.themeColor, home.heroImage.url, origin);
  html = html.replace(/<header class="site-header" data-header>[\s\S]*?<\/header>/, homeHeader(content));
  html = section(html, "hero", `<section class="hero" id="top" aria-labelledby="hero-title">
    <div class="hero-heading reveal-sequence"><p class="eyebrow">${e(home.heroEyebrow)}</p><h1 id="hero-title">${e(home.heroTitle)}</h1></div>
    <div class="hero-intro reveal-sequence"><p>${e(home.heroDescription)}</p><div class="hero-actions"><a class="button button-primary" href="${e(home.primaryCta.href)}">${e(home.primaryCta.label)}</a><a class="text-link" href="${e(home.secondaryCta.href)}">${e(home.secondaryCta.label)} <span aria-hidden="true">↘</span></a></div></div>
    <figure class="hero-media reveal-visual"><img src="${e(home.heroImage.url)}" alt="${e(home.heroImage.alt)}" fetchpriority="high" /></figure>
  </section>`);
  html = section(html, "positioning", `<section class="positioning section-shell" aria-labelledby="positioning-title"><p class="positioning-lead" id="positioning-title">${e(home.positioningLead)}</p><p class="positioning-note">${e(home.positioningNote)}</p></section>`);
  html = section(html, "work", renderWorkSection(projects, home));
  const visuals = services.items.map((item, i) => `<figure class="service-visual${i === 0 ? " is-active" : ""}" data-service-visual="${i}" aria-hidden="${i !== 0}"><img src="${e(item.image.url)}" alt="${e(item.image.alt)}" loading="lazy" /></figure>`).join("");
  const steps = services.items.map((item, i) => `<article class="service-step${i === 0 ? " is-current" : ""}" data-service-step="${i}"><img class="service-mobile-image" src="${e(item.image.url)}" alt="" loading="lazy" /><div class="service-step-copy"><h3>${e(item.title)}</h3><p>${e(item.description)}</p><span>${e(item.detail)}</span></div></article>`).join("");
  html = section(html, "services", `<section class="services section-shell" id="services" aria-labelledby="services-title"><header class="services-intro"><h2 id="services-title">${e(services.title)}</h2><p>${e(services.introduction)}</p></header><div class="service-story"><div class="service-media-column" aria-live="polite"><div class="service-media-stage" data-service-stage>${visuals}</div></div><div class="service-steps">${steps}</div></div></section>`);
  html = section(html, "studio", `<section class="studio section-shell" id="studio" aria-labelledby="studio-title"><a class="studio-link" href="/studio/" aria-label="Explore ${e(nav.studioWordmark)}"><div class="studio-mark" aria-hidden="true">L</div><div class="studio-copy"><p class="eyebrow">${e(home.studioEyebrow)}</p><h2 id="studio-title">${e(home.studioTitle)}</h2><p>${e(home.studioDescription)}</p><span class="studio-action">${e(home.studioCta)} <b aria-hidden="true">↗</b></span></div></a></section>`);
  html = section(html, "about", `<section class="about section-shell" id="about" aria-labelledby="about-title"><h2 id="about-title">${e(home.aboutTitle)}</h2><div class="about-body">${home.aboutParagraphs.map((p) => `<p>${e(p)}</p>`).join("")}</div><div class="about-facts" aria-label="Professional focus">${home.aboutFacts.map((fact) => `<span>${e(fact)}</span>`).join("")}</div></section>`);
  html = html.replace(/<div class="contact-lead">[\s\S]*?<\/div>/, `<div class="contact-lead"><p class="availability">${e(home.availability)}</p><h2 id="contact-title">${e(home.contactTitle)}</h2><p>${e(home.contactDescription)}</p></div>`);
  html = html.replace(/<button class="button button-light form-submit" type="submit">[^<]*<\/button>/, `<button class="button button-light form-submit" type="submit">${e(home.contactButton)}</button>`);
  html = html.replace('<form class="contact-form" novalidate data-contact-form>', `<form class="contact-form" novalidate data-contact-form data-contact-email="${e(settings.contactEmail)}">`);
  html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, homeFooter(content));
  html = html.replace(/<div class="footer-wordmark" aria-hidden="true">[^<]*<\/div>/, `<div class="footer-wordmark" aria-hidden="true">${e(nav.footerWordmark)}</div>`);
  return html;
}

function studioHeader(content: SiteContentMap): string {
  const { navigation: nav, settings } = content;
  return `<header class="site-header studio-header"><a class="wordmark" href="/" aria-label="Return to ${e(nav.portfolioWordmark)}'s portfolio">${wordmark(nav.studioWordmark)}</a><nav class="desktop-nav" aria-label="Studio navigation">${links(nav.studioLinks)}</nav><div class="header-actions"><button class="icon-button theme-toggle" type="button" aria-label="Switch color theme" data-theme-toggle><span class="theme-icon" aria-hidden="true"></span></button><a class="header-cta" href="mailto:${e(settings.contactEmail)}">${e(nav.headerCta.label)}</a><button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu" data-menu-button><span>Menu</span></button></div><nav class="mobile-menu" id="mobile-menu" aria-label="Mobile studio navigation" hidden data-mobile-menu>${links(nav.studioLinks)}<a href="/">Main portfolio</a></nav></header>`;
}

export function renderStudioPage(content: SiteContentMap, origin: string): string {
  const { studio, navigation: nav, settings } = content;
  let html = head(studioTemplate, settings.studioSeo, settings.themeColor, studio.heroImage.url, origin);
  html = html.replace(/<header class="site-header studio-header">[\s\S]*?<\/header>/, studioHeader(content));
  html = section(html, "studio-hero", `<section class="studio-hero" aria-labelledby="studio-hero-title"><div class="studio-hero-copy reveal-sequence"><p class="studio-kicker">${e(studio.heroEyebrow)}</p><h1 id="studio-hero-title">${e(studio.heroTitle)}</h1><p class="studio-hero-note">${e(studio.heroDescription)}</p><div class="studio-hero-actions"><a class="button studio-button" href="#experiments">${e(studio.heroPrimaryCta)}</a><a class="studio-text-link" href="/">Main portfolio <span aria-hidden="true">↗</span></a></div></div><figure class="studio-hero-media reveal-visual"><img src="${e(studio.heroImage.url)}" alt="${e(studio.heroImage.alt)}" fetchpriority="high" /></figure></section>`);
  const experiments = studio.experiments.map((item, i) => `<article class="experiment ${["experiment-wide", "experiment-tall", "experiment-offset"][i % 3]} reveal-item"><figure><img src="${e(item.image.url)}" alt="${e(item.image.alt)}" loading="lazy" /></figure><div class="experiment-caption"><div><h3>${e(item.title)}</h3><p>${e(item.description)}</p></div><span>${e(item.category)}</span></div></article>`).join("");
  html = section(html, "studio-experiments", `<section class="studio-experiments studio-shell" id="experiments" aria-labelledby="experiments-title"><header class="studio-section-heading"><h2 id="experiments-title">${e(studio.experimentsTitle)}</h2><p>${e(studio.experimentsDescription)}</p></header><div class="experiment-grid">${experiments}</div></section>`);
  html = html.replace(/<header class="component-heading">[\s\S]*?<\/header>/, `<header class="component-heading"><h2 id="components-title">${e(studio.componentsTitle)}</h2><p>${e(studio.componentsDescription)}</p></header>`);
  const componentHeaders = studio.componentFeatures.map((item) => `<header><h3>${e(item.title)}</h3><span>${e(item.description)}</span></header>`);
  let componentIndex = 0;
  html = html.replace(/<header><h3>[^<]*<\/h3><span>[^<]*<\/span><\/header>/g, (match) => componentHeaders[componentIndex++] ?? match);
  const words = studio.manifesto.trim().split(/\s+/).map((word) => `<span data-scroll-word>${e(word)}</span>`).join(" ");
  html = section(html, "studio-manifesto", `<section class="studio-manifesto" id="reason" aria-labelledby="reason-title"><div class="manifesto-inner studio-shell"><h2 class="manifesto-copy" id="reason-title" data-scroll-statement>${words}</h2></div></section>`);
  html = section(html, "studio-practice", `<section class="studio-practice studio-shell" aria-labelledby="practice-title"><div class="practice-intro"><h2 id="practice-title">${e(studio.practiceTitle)}</h2><p>${e(studio.practiceDescription)}</p></div><div class="practice-grid">${studio.practices.map((item) => `<article><h3>${e(item.title)}</h3><p>${e(item.description)}</p></article>`).join("")}</div></section>`);
  html = section(html, "studio-contact", `<section class="studio-contact" aria-labelledby="studio-contact-title"><div class="studio-shell studio-contact-inner"><p>${e(studio.contactEyebrow)}</p><h2 id="studio-contact-title">${e(studio.contactTitle)}</h2><a class="button studio-button studio-button-light" href="mailto:${e(settings.contactEmail)}">${e(studio.contactButton)}</a></div></section>`);
  html = html.replace(/<footer class="studio-footer studio-shell">[\s\S]*?<\/footer>/, `<footer class="studio-footer studio-shell"><a href="/">${e(nav.portfolioWordmark)}</a><span>${e(nav.studioWordmark)}</span><span>${e(nav.copyright)}</span></footer>`);
  return html;
}
