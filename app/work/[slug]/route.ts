import { getAdminUser } from "@/app/session-auth";
import { getProjectBySlug, listProjects } from "@/lib/cms";
import { renderCaseStudy } from "@/lib/render";
import { getSiteContentMap } from "@/lib/site-content-store";

export const runtime = "edge";

export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await context.params;
  const project = await getProjectBySlug(slug);
  if (!project) return new Response("Not found", { status: 404 });

  if (!project.published) {
    const isPreview = new URL(request.url).searchParams.get("preview") === "1";
    const user = isPreview ? await getAdminUser() : null;
    if (!user) return new Response("Not found", { status: 404 });
  }

  const published = await listProjects({ publishedOnly: true });
  const index = published.findIndex((item) => item.id === project.id);
  const nextProject =
    published.length > 1 && index >= 0
      ? published[(index + 1) % published.length]
      : published.find((item) => item.id !== project.id) ?? null;
  const content = await getSiteContentMap("published");
  return new Response(renderCaseStudy(project, nextProject, content), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
