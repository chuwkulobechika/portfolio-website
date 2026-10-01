import { authorizeCmsRequest } from "@/lib/admin-auth";
import { getProjectDraftById, listProjects } from "@/lib/cms";
import { renderCaseStudy } from "@/lib/render";
import { getSiteContentMap } from "@/lib/site-content-store";

export const runtime = "edge";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const project = await getProjectDraftById(id);
  if (!project) return new Response("Not found", { status: 404 });
  const published = await listProjects({ publishedOnly: true });
  const nextProject = published.find((item) => item.id !== id) ?? null;
  const content = await getSiteContentMap("draft");
  return new Response(renderCaseStudy(project, nextProject, content), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}
