import { env } from "cloudflare:workers";
import { getBucket } from "@/lib/cms";

export type MediaAsset = {
  id: string;
  url: string;
  name: string;
  alt: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  builtIn?: boolean;
};

const builtInNames = [
  "hero-system.jpg", "lifevault-study.jpg", "swapxnext-study.jpg",
  "brand-explorations.jpg", "lowbe-hero.jpg", "lowbe-tension.jpg", "lowbe-assembly.jpg",
];

function database(): D1Database {
  if (!env.DB) throw new Error("The DB binding is not configured.");
  return env.DB;
}

export async function listMediaAssets(): Promise<MediaAsset[]> {
  const rows = await database().prepare("SELECT id, url, name, alt, mime_type AS mimeType, size_bytes AS sizeBytes, created_at AS createdAt FROM media_assets ORDER BY created_at DESC").all<MediaAsset>();
  const legacy = await getBucket().list({ prefix: "projects/", limit: 1000 }).catch(() => null);
  const olderAssets = (legacy?.objects ?? []).map((object) => ({
    id: `legacy:${object.key}`,
    url: `/media/${object.key}`,
    name: object.key.split("/").at(-1) ?? object.key,
    alt: "",
    mimeType: "image/*",
    sizeBytes: object.size,
    createdAt: object.uploaded.toISOString(),
  }));
  return [
    ...rows.results,
    ...olderAssets,
    ...builtInNames.map((name) => ({
      id: `built-in:${name}`,
      url: `/assets/${name}`,
      name,
      alt: "",
      mimeType: "image/jpeg",
      sizeBytes: 0,
      createdAt: "",
      builtIn: true,
    })),
  ];
}

export async function recordMediaAsset(asset: MediaAsset): Promise<void> {
  await database().prepare("INSERT INTO media_assets (id, url, name, alt, mime_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(asset.id, asset.url, asset.name, asset.alt, asset.mimeType, asset.sizeBytes, asset.createdAt)
    .run();
}
