import { z } from "zod";

const imagePath = z
  .string()
  .max(2048)
  .refine(
    (value) => !value || value.startsWith("/") || /^https:\/\//i.test(value),
    "Use a site path beginning with / or a secure https URL.",
  );

export const galleryImageSchema = z.object({
  url: imagePath,
  alt: z.string().max(300),
  caption: z.string().max(500),
});

export const sectionImageSchema = galleryImageSchema.extend({
  sectionId: z
    .string()
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Choose a valid case-study chapter."),
});

export const projectInputSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  title: z.string().min(2).max(120),
  shortDescription: z.string().min(8).max(600),
  cardHeadline: z.string().min(8).max(180),
  tags: z.array(z.string().min(1).max(40)).max(8),
  projectType: z.string().max(80),
  platform: z.string().max(80),
  role: z.string().max(120),
  focus: z.string().max(180),
  statusLabel: z.string().max(60),
  year: z.string().max(20),
  cardLayout: z.enum(["wide", "portrait", "landscape"]),
  cardImageUrl: imagePath,
  cardImageAlt: z.string().max(300),
  heroImageUrl: imagePath,
  heroImageAlt: z.string().max(300),
  galleryImages: z.array(galleryImageSchema).max(20),
  sectionImages: z.array(sectionImageSchema).max(30),
  accentColor: z.string().regex(/^#[0-9a-f]{6}$/i, "Use a six-digit hex color."),
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  contentMarkdown: z.string().max(120000),
});

export const reorderSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
});
