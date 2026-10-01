import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const projects = sqliteTable(
  "projects",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    shortDescription: text("short_description").notNull().default(""),
    cardHeadline: text("card_headline").notNull().default(""),
    tagsJson: text("tags_json").notNull().default("[]"),
    projectType: text("project_type").notNull().default(""),
    platform: text("platform").notNull().default(""),
    role: text("role").notNull().default(""),
    focus: text("focus").notNull().default(""),
    statusLabel: text("status_label").notNull().default("Concept"),
    year: text("year").notNull().default(""),
    cardLayout: text("card_layout").notNull().default("landscape"),
    cardImageUrl: text("card_image_url").notNull().default(""),
    cardImageAlt: text("card_image_alt").notNull().default(""),
    heroImageUrl: text("hero_image_url").notNull().default(""),
    heroImageAlt: text("hero_image_alt").notNull().default(""),
    galleryJson: text("gallery_json").notNull().default("[]"),
    sectionImagesJson: text("section_images_json").notNull().default("[]"),
    accentColor: text("accent_color").notNull().default("#ff6b2c"),
    featured: integer("featured", { mode: "boolean" }).notNull().default(true),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    contentMarkdown: text("content_markdown").notNull().default(""),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    publishedAt: text("published_at"),
  },
  (table) => [
    uniqueIndex("projects_slug_unique").on(table.slug),
    index("projects_publishing_order_idx").on(
      table.published,
      table.featured,
      table.sortOrder,
    ),
  ],
);

export const cmsSettings = sqliteTable("cms_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const siteSections = sqliteTable("site_sections", {
  key: text("key").primaryKey(),
  draftJson: text("draft_json").notNull(),
  publishedJson: text("published_json").notNull(),
  updatedAt: text("updated_at").notNull(),
  publishedAt: text("published_at").notNull(),
});

export const projectDrafts = sqliteTable("project_drafts", {
  projectId: text("project_id").primaryKey(),
  draftJson: text("draft_json").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const mediaAssets = sqliteTable("media_assets", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  name: text("name").notNull(),
  alt: text("alt").notNull().default(""),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: text("created_at").notNull(),
});
