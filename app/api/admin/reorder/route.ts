import { authorizeCmsRequest } from "@/lib/admin-auth";
import { reorderProjects } from "@/lib/cms";
import { reorderSchema } from "@/lib/validation";

export const runtime = "edge";

export async function POST(request: Request): Promise<Response> {
  const auth = await authorizeCmsRequest();
  if (!auth.ok) return auth.response;
  const result = reorderSchema.safeParse(await request.json());
  if (!result.success) {
    return Response.json({ error: "Invalid project order." }, { status: 400 });
  }
  await reorderProjects(result.data.ids);
  return Response.json({ ok: true });
}
