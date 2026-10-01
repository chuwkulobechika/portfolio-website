import { authorizeCmsRequest } from "@/lib/admin-auth";
import { getContentRecord, saveContentSection } from "@/lib/site-content-store";
import { siteContentKeys, type SiteContentKey, type SiteContentMap } from "@/lib/site-content";
import { siteContentSchemas } from "@/lib/site-content-validation";

export const runtime = "edge";

type Context = { params: Promise<{ key: string }> };

export async function GET(_request: Request, context: Context): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  const { key } = await context.params;
  if (!siteContentKeys.includes(key as SiteContentKey)) {
    return Response.json({ error: "Unknown site section." }, { status: 404 });
  }
  return Response.json({ record: await getContentRecord(key as SiteContentKey) });
}

export async function PUT(request: Request, context: Context): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  const { key } = await context.params;
  if (!siteContentKeys.includes(key as SiteContentKey)) {
    return Response.json({ error: "Unknown site section." }, { status: 404 });
  }
  let payload: { content?: unknown; action?: unknown; expectedUpdatedAt?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (payload.action !== "save" && payload.action !== "publish") {
    return Response.json({ error: "Choose save or publish." }, { status: 400 });
  }
  if (payload.expectedUpdatedAt !== null && typeof payload.expectedUpdatedAt !== "string") {
    return Response.json({ error: "Invalid revision value." }, { status: 400 });
  }
  const parsed = siteContentSchemas[key as SiteContentKey].safeParse(payload.content);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid content.", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const record = await saveContentSection(
      key as SiteContentKey,
      parsed.data as SiteContentMap[SiteContentKey],
      payload.action,
      payload.expectedUpdatedAt,
    );
    return Response.json({ record });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not save this section." }, { status: 409 });
  }
}
