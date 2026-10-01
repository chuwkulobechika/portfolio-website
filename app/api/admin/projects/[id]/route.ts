import { authorizeCmsRequest } from "@/lib/admin-auth";
import { deleteProject, publishProject, saveProjectDraft } from "@/lib/cms";
import { projectInputSchema } from "@/lib/validation";

export const runtime = "edge";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  const body = await request.json() as { project?: unknown; action?: unknown };
  const result = projectInputSchema.safeParse(body.project);
  if (!result.success) {
    return Response.json(
      { error: "Check the highlighted project fields.", issues: result.error.flatten() },
      { status: 400 },
    );
  }
  const { id } = await context.params;
  try {
    const project = body.action === "publish"
      ? await publishProject(id, result.data)
      : body.action === "save"
        ? await saveProjectDraft(id, result.data)
        : null;
    return project
      ? Response.json({ project })
      : Response.json({ error: body.action === "publish" || body.action === "save" ? "Project not found." : "Choose save or publish." }, { status: body.action === "publish" || body.action === "save" ? 404 : 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save project.";
    const status = message.toLowerCase().includes("unique") ? 409 : 500;
    return Response.json(
      { error: status === 409 ? "That project URL is already in use." : message },
      { status },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  const { id } = await context.params;
  const deleted = await deleteProject(id);
  return deleted
    ? Response.json({ ok: true })
    : Response.json({ error: "Project not found." }, { status: 404 });
}
