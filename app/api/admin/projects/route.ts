import { authorizeCmsRequest } from "@/lib/admin-auth";
import { createProject, listAdminProjects } from "@/lib/cms";
import { projectInputSchema } from "@/lib/validation";

export const runtime = "edge";

export async function GET(): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  return Response.json({ projects: await listAdminProjects() });
}

export async function POST(request: Request): Promise<Response> {
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
  try {
    const project = await createProject({ ...result.data, published: body.action === "publish" });
    return Response.json({ project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create project.";
    const status = message.toLowerCase().includes("unique") ? 409 : 500;
    return Response.json(
      { error: status === 409 ? "That project URL is already in use." : message },
      { status },
    );
  }
}
