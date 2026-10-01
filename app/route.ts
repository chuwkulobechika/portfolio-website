import { listProjects } from "@/lib/cms";
import { authorizeCmsRequest } from "@/lib/admin-auth";
import { getSiteContentMap } from "@/lib/site-content-store";
import { renderHomePage } from "@/lib/site-render";

export const runtime = "edge";

export async function GET(request: Request): Promise<Response> {
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  if (preview) {
    const auth = await authorizeCmsRequest();
    if (!auth.ok) return auth.response;
  }
  const projects = await listProjects({ publishedOnly: true, featuredOnly: true });
  const content = await getSiteContentMap(preview ? "draft" : "published");
  const html = renderHomePage(content, projects, new URL(request.url).origin);
  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
