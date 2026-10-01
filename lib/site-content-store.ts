import { env } from "cloudflare:workers";

import {
  defaultSiteContent,
  siteContentKeys,
  type SiteContentKey,
  type SiteContentMap,
} from "@/lib/site-content";

type ContentRow = {
  key: string;
  draft_json: string;
  published_json: string;
  updated_at: string;
  published_at: string;
};

export type ContentRecord<K extends SiteContentKey = SiteContentKey> = {
  key: K;
  draft: SiteContentMap[K];
  published: SiteContentMap[K];
  updatedAt: string | null;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
};

function database(): D1Database {
  if (!env.DB) throw new Error("The DB binding is not configured.");
  return env.DB;
}

function parseContent<K extends SiteContentKey>(value: string, key: K): SiteContentMap[K] {
  try {
    return JSON.parse(value) as SiteContentMap[K];
  } catch {
    return defaultSiteContent[key];
  }
}

function recordFromRow<K extends SiteContentKey>(key: K, row: ContentRow | null): ContentRecord<K> {
  if (!row) {
    return {
      key,
      draft: defaultSiteContent[key],
      published: defaultSiteContent[key],
      updatedAt: null,
      publishedAt: null,
      hasUnpublishedChanges: false,
    };
  }
  return {
    key,
    draft: parseContent(row.draft_json, key),
    published: parseContent(row.published_json, key),
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    hasUnpublishedChanges: row.draft_json !== row.published_json,
  };
}

export async function getContentRecord<K extends SiteContentKey>(key: K): Promise<ContentRecord<K>> {
  const row = await database()
    .prepare("SELECT * FROM site_sections WHERE key = ? LIMIT 1")
    .bind(key)
    .first<ContentRow>();
  return recordFromRow(key, row);
}

export async function getContentRecords(): Promise<{ [K in SiteContentKey]: ContentRecord<K> }> {
  const rows = await database().prepare("SELECT * FROM site_sections").all<ContentRow>();
  const byKey = new Map(rows.results.map((row) => [row.key, row]));
  return Object.fromEntries(
    siteContentKeys.map((key) => [key, recordFromRow(key, byKey.get(key) ?? null)]),
  ) as { [K in SiteContentKey]: ContentRecord<K> };
}

export async function getSiteContentMap(mode: "published" | "draft" = "published"): Promise<SiteContentMap> {
  const records = await getContentRecords();
  return Object.fromEntries(
    siteContentKeys.map((key) => [key, records[key][mode]]),
  ) as SiteContentMap;
}

export async function saveContentSection<K extends SiteContentKey>(
  key: K,
  content: SiteContentMap[K],
  action: "save" | "publish",
  expectedUpdatedAt: string | null,
): Promise<ContentRecord<K>> {
  const current = await getContentRecord(key);
  if (current.updatedAt !== expectedUpdatedAt) {
    throw new Error("This section changed elsewhere. Reload it before saving.");
  }
  const now = new Date().toISOString();
  const draftJson = JSON.stringify(content);
  const publishedJson = action === "publish" ? draftJson : JSON.stringify(current.published);
  const publishedAt = action === "publish" ? now : current.publishedAt ?? now;

  const result = await database()
    .prepare(`
      INSERT INTO site_sections (key, draft_json, published_json, updated_at, published_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        draft_json = excluded.draft_json,
        published_json = excluded.published_json,
        updated_at = excluded.updated_at,
        published_at = excluded.published_at
      WHERE site_sections.updated_at = ?
    `)
    .bind(key, draftJson, publishedJson, now, publishedAt, current.updatedAt)
    .run();

  if (!result.meta.changes) {
    throw new Error("This section changed elsewhere. Reload it before saving.");
  }

  return getContentRecord(key);
}
