import { authorizeCmsRequest } from "@/lib/admin-auth";
import { getBucket } from "@/lib/cms";
import { recordMediaAsset } from "@/lib/media-assets";

export const runtime = "edge";

const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  const data = await request.formData();
  const file = data.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image to upload." }, { status: 400 });
  }
  const extension = allowedTypes.get(file.type);
  if (!extension) {
    return Response.json({ error: "Upload a JPG, PNG, WebP, AVIF, or GIF image." }, { status: 415 });
  }
  if (file.size > 12 * 1024 * 1024) {
    return Response.json({ error: "Images must be smaller than 12 MB." }, { status: 413 });
  }

  const id = crypto.randomUUID();
  const key = `uploads/${id}.${extension}`;
  await getBucket().put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
    customMetadata: { uploadedBy: auth.userId },
  });
  const asset = {
    id,
    url: `/media/${key}`,
    name: file.name.slice(0, 255),
    alt: "",
    mimeType: file.type,
    sizeBytes: file.size,
    createdAt: new Date().toISOString(),
  };
  await recordMediaAsset(asset);
  return Response.json({ url: asset.url, asset }, { status: 201 });
}
