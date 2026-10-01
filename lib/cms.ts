import { env } from "cloudflare:workers";

import { seedProjects } from "@/lib/seed-projects";
import type { CardLayout, GalleryImage, Project, ProjectInput, SectionImage } from "@/lib/types";

type ProjectRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string;
  card_headline: string;
  tags_json: string;
  project_type: string;
  platform: string;
  role: string;
  focus: string;
  status_label: string;
  year: string;
  card_layout: string;
  card_image_url: string;
  card_image_alt: string;
  hero_image_url: string;
  hero_image_alt: string;
  gallery_json: string;
  section_images_json: string;
  accent_color: string;
  featured: number;
  published: number;
  sort_order: number;
  content_markdown: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

function database(): D1Database {
  if (!env.DB) throw new Error("The DB binding is not configured.");
  return env.DB;
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    cardHeadline: row.card_headline,
    tags: parseJson<string[]>(row.tags_json, []),
    projectType: row.project_type,
    platform: row.platform,
    role: row.role,
    focus: row.focus,
    statusLabel: row.status_label,
    year: row.year,
    cardLayout: row.card_layout as CardLayout,
    cardImageUrl: row.card_image_url,
    cardImageAlt: row.card_image_alt,
    heroImageUrl: row.hero_image_url,
    heroImageAlt: row.hero_image_alt,
    galleryImages: parseJson<GalleryImage[]>(row.gallery_json, []),
    sectionImages: parseJson<SectionImage[]>(row.section_images_json, []),
    accentColor: row.accent_color,
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    sortOrder: row.sort_order,
    contentMarkdown: row.content_markdown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

const insertSql = `
  INSERT INTO projects (
    id, slug, title, short_description, card_headline, tags_json,
    project_type, platform, role, focus, status_label, year, card_layout,
    card_image_url, card_image_alt, hero_image_url, hero_image_alt,
    gallery_json, section_images_json, accent_color, featured, published, sort_order,
    content_markdown, created_at, updated_at, published_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

function insertBindings(project: Project): unknown[] {
  return [
    project.id,
    project.slug,
    project.title,
    project.shortDescription,
    project.cardHeadline,
    JSON.stringify(project.tags),
    project.projectType,
    project.platform,
    project.role,
    project.focus,
    project.statusLabel,
    project.year,
    project.cardLayout,
    project.cardImageUrl,
    project.cardImageAlt,
    project.heroImageUrl,
    project.heroImageAlt,
    JSON.stringify(project.galleryImages),
    JSON.stringify(project.sectionImages),
    project.accentColor,
    project.featured ? 1 : 0,
    project.published ? 1 : 0,
    project.sortOrder,
    project.contentMarkdown,
    project.createdAt,
    project.updatedAt,
    project.publishedAt,
  ];
}

export async function ensureSeedProjects(): Promise<void> {
  const db = database();
  const seeded = await db
    .prepare("SELECT value FROM cms_settings WHERE key = 'initial_seed_complete' LIMIT 1")
    .first<{ value: string }>();
  if (seeded) return;

  const now = new Date().toISOString();
  const statements = seedProjects.map((input, index) => {
    const project: Project = {
      ...input,
      id: `seed-project-${index + 1}`,
      createdAt: now,
      updatedAt: now,
      publishedAt: input.published ? now : null,
    };
    return db
      .prepare(insertSql.replace("INSERT INTO", "INSERT OR IGNORE INTO"))
      .bind(...insertBindings(project));
  });
  statements.push(
    db
      .prepare(
        "INSERT OR IGNORE INTO cms_settings (key, value, updated_at) VALUES ('initial_seed_complete', '1', ?)",
      )
      .bind(now),
  );
  await db.batch(statements);
}

export async function listProjects(options: {
  publishedOnly?: boolean;
  featuredOnly?: boolean;
} = {}): Promise<Project[]> {
  await ensureSeedProjects();
  const conditions: string[] = [];
  if (options.publishedOnly) conditions.push("published = 1");
  if (options.featuredOnly) conditions.push("featured = 1");
  const where = conditions.length ? ` WHERE ${conditions.join(" AND ")}` : "";
  const result = await database()
    .prepare(`SELECT * FROM projects${where} ORDER BY sort_order ASC, created_at ASC`)
    .all<ProjectRow>();
  return result.results.map(rowToProject);
}

type ProjectDraftRow = { project_id: string; draft_json: string; updated_at: string };

export async function listAdminProjects(): Promise<Project[]> {
  const projects = await listProjects();
  const rows = await database().prepare("SELECT * FROM project_drafts").all<ProjectDraftRow>();
  const drafts = new Map(rows.results.map((row) => [row.project_id, row]));
  return projects.map((project) => {
    const row = drafts.get(project.id);
    if (!row) return { ...project, hasUnpublishedChanges: false };
    const changes = parseJson<ProjectInput>(row.draft_json, project);
    return { ...project, ...changes, sortOrder: project.sortOrder, updatedAt: row.updated_at, hasUnpublishedChanges: true };
  });
}

export async function getProjectDraftById(id: string): Promise<Project | null> {
  const project = await getProjectById(id);
  if (!project) return null;
  const row = await database().prepare("SELECT * FROM project_drafts WHERE project_id = ? LIMIT 1").bind(id).first<ProjectDraftRow>();
  if (!row) return project;
  return { ...project, ...parseJson<ProjectInput>(row.draft_json, project), sortOrder: project.sortOrder, updatedAt: row.updated_at, hasUnpublishedChanges: true };
}

export async function saveProjectDraft(id: string, input: ProjectInput): Promise<Project | null> {
  const existing = await getProjectById(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  await database().prepare("INSERT INTO project_drafts (project_id, draft_json, updated_at) VALUES (?, ?, ?) ON CONFLICT(project_id) DO UPDATE SET draft_json = excluded.draft_json, updated_at = excluded.updated_at")
    .bind(id, JSON.stringify(input), now).run();
  return { ...existing, ...input, updatedAt: now, hasUnpublishedChanges: true };
}

export async function publishProject(id: string, input: ProjectInput): Promise<Project | null> {
  const project = await updateProject(id, input);
  if (!project) return null;
  await database().prepare("DELETE FROM project_drafts WHERE project_id = ?").bind(id).run();
  return { ...project, hasUnpublishedChanges: false };
}

export async function getProjectById(id: string): Promise<Project | null> {
  await ensureSeedProjects();
  const row = await database()
    .prepare("SELECT * FROM projects WHERE id = ? LIMIT 1")
    .bind(id)
    .first<ProjectRow>();
  return row ? rowToProject(row) : null;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  await ensureSeedProjects();
  const row = await database()
    .prepare("SELECT * FROM projects WHERE slug = ? LIMIT 1")
    .bind(slug)
    .first<ProjectRow>();
  return row ? rowToProject(row) : null;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const now = new Date().toISOString();
  const project: Project = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    publishedAt: input.published ? now : null,
  };
  await database().prepare(insertSql).bind(...insertBindings(project)).run();
  return project;
}

export async function updateProject(
  id: string,
  input: ProjectInput,
): Promise<Project | null> {
  const existing = await getProjectById(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const publishedAt = input.published ? existing.publishedAt ?? now : null;

  await database()
    .prepare(`
      UPDATE projects SET
        slug = ?, title = ?, short_description = ?, card_headline = ?,
        tags_json = ?, project_type = ?, platform = ?, role = ?, focus = ?,
        status_label = ?, year = ?, card_layout = ?, card_image_url = ?,
        card_image_alt = ?, hero_image_url = ?, hero_image_alt = ?,
        gallery_json = ?, section_images_json = ?, accent_color = ?, featured = ?, published = ?,
        sort_order = ?, content_markdown = ?, updated_at = ?, published_at = ?
      WHERE id = ?
    `)
    .bind(
      input.slug,
      input.title,
      input.shortDescription,
      input.cardHeadline,
      JSON.stringify(input.tags),
      input.projectType,
      input.platform,
      input.role,
      input.focus,
      input.statusLabel,
      input.year,
      input.cardLayout,
      input.cardImageUrl,
      input.cardImageAlt,
      input.heroImageUrl,
      input.heroImageAlt,
      JSON.stringify(input.galleryImages),
      JSON.stringify(input.sectionImages),
      input.accentColor,
      input.featured ? 1 : 0,
      input.published ? 1 : 0,
      input.sortOrder,
      input.contentMarkdown,
      now,
      publishedAt,
      id,
    )
    .run();

  return { ...existing, ...input, updatedAt: now, publishedAt };
}

export async function deleteProject(id: string): Promise<boolean> {
  await database().prepare("DELETE FROM project_drafts WHERE project_id = ?").bind(id).run();
  const result = await database()
    .prepare("DELETE FROM projects WHERE id = ?")
    .bind(id)
    .run();
  return result.meta.changes > 0;
}

export async function reorderProjects(ids: string[]): Promise<void> {
  const db = database();
  const now = new Date().toISOString();
  await db.batch(
    ids.map((id, index) =>
      db
        .prepare("UPDATE projects SET sort_order = ?, updated_at = ? WHERE id = ?")
        .bind(index, now, id),
    ),
  );
}

export async function verifyCmsAdmin(userId: string): Promise<boolean> {
  const db = database();
  const setting = await db
    .prepare("SELECT value FROM cms_settings WHERE key = 'admin_user_id' LIMIT 1")
    .first<{ value: string }>();
  return setting?.value === userId;
}

export function getBucket(): R2Bucket {
  if (!env.BUCKET) throw new Error("The BUCKET binding is not configured.");
  return env.BUCKET;
}
