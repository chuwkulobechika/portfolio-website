import { getAdminUser, requireAdminUser } from "@/app/session-auth";

// Anyone holding a valid owner session is the CMS admin.
export async function requireCmsAdmin(returnTo = "/admin") {
  const user = await requireAdminUser(returnTo);
  return { user, allowed: true };
}

export async function authorizeCmsRequest(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: Response }
> {
  const user = await getAdminUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Authentication required." }, { status: 401 }),
    };
  }
  return { ok: true, userId: user.userId };
}
