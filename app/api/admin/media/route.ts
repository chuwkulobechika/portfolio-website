import { authorizeCmsRequest } from "@/lib/admin-auth";
import { listMediaAssets } from "@/lib/media-assets";

export const runtime = "edge";

export async function GET(): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  return Response.json({ assets: await listMediaAssets() });
}
