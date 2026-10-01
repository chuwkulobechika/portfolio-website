import { z } from "zod";

const text = (max = 500) => z.string().trim().min(1).max(max);
const optionalText = (max = 500) => z.string().trim().max(max);
const imageUrl = z.string().trim().max(2048).refine(
  (value) => !value || (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) || /^https:\/\//i.test(value),
  "Use a site path or an HTTPS image URL.",
);
const linkUrl = z.string().trim().min(1).max(2048).refine(
  (value) =>
    (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) ||
    value.startsWith("#") ||
    /^https:\/\//i.test(value) ||
    /^mailto:[^\s@]+@[^\s@]+$/i.test(value),
  "Use a site path, #anchor, HTTPS URL, or mailto link.",
);
const image = z.object({ url: imageUrl, alt: optionalText(300) }).refine(
  (value) => !value.url || Boolean(value.alt),
  "Add descriptive alt text for this image.",
);
const link = z.object({ label: text(80), href: linkUrl });
const seo = z.object({
  title: text(120),
  description: text(320),
  socialImageUrl: imageUrl,
});

export const siteContentSchemas = {
  home: z.object({
    heroEyebrow: text(100), heroTitle: text(180), heroDescription: text(600), heroImage: image,
    primaryCta: link, secondaryCta: link,
    positioningLead: text(600), positioningNote: text(600),
    workEyebrow: text(120), workTitle: text(180),
    studioEyebrow: text(100), studioTitle: text(180), studioDescription: text(800), studioCta: text(80),
    aboutTitle: text(180), aboutParagraphs: z.array(text(2000)).min(1).max(5),
    aboutFacts: z.array(text(100)).min(1).max(10),
    availability: text(180), contactTitle: text(180), contactDescription: text(600), contactButton: text(80),
  }),
  services: z.object({
    title: text(180), introduction: text(600),
    items: z.array(z.object({ title: text(100), description: text(600), detail: text(160), image })).min(1).max(12),
  }),
  studio: z.object({
    heroEyebrow: text(100), heroTitle: text(100), heroDescription: text(600), heroImage: image,
    heroPrimaryCta: text(80), experimentsTitle: text(180), experimentsDescription: text(600),
    experiments: z.array(z.object({ title: text(100), description: text(600), category: text(80), image })).min(1).max(12),
    componentsTitle: text(180), componentsDescription: text(600),
    componentFeatures: z.array(z.object({ title: text(100), description: text(180) })).length(3),
    manifesto: text(2000), practiceTitle: text(180), practiceDescription: text(600),
    practices: z.array(z.object({ title: text(100), description: text(600) })).min(1).max(12),
    contactEyebrow: text(180), contactTitle: text(180), contactButton: text(80),
  }),
  navigation: z.object({
    portfolioWordmark: text(100), studioWordmark: text(100),
    primaryLinks: z.array(link).min(1).max(10), headerCta: link,
    studioLinks: z.array(link).min(1).max(10),
    footerExplore: z.array(link).max(12), footerStudio: z.array(link).max(12),
    socialLinks: z.array(link).max(12),
    footerIdentity: text(100), footerSubtitle: text(100), footerWordmark: text(100), copyright: text(120),
  }),
  settings: z.object({
    contactEmail: z.string().email().max(254), homeSeo: seo, studioSeo: seo,
    themeColor: z.string().regex(/^#[0-9a-f]{6}$/i),
  }),
} as const;
