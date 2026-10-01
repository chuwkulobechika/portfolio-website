import { getChatGPTUser, requireChatGPTUser } from "@/app/chatgpt-auth";
import { verifyCmsAdmin } from "@/lib/cms";

export async function requireCmsAdmin(returnTo = "/admin") {
  const user = await requireChatGPTUser(returnTo);
  const allowed = await verifyCmsAdmin(user.userId);
  return { user, allowed };
}

export async function authorizeCmsRequest(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: Response }
> {
  const user = await getChatGPTUser();
  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: "Authentication required." }, { status: 401 }),
    };
  }
  const allowed = await verifyCmsAdmin(user.userId);
  if (!allowed) {
    return {
      ok: false,
      response: Response.json({ error: "This account cannot access the CMS." }, { status: 403 }),
    };
  }
  return { ok: true, userId: user.userId };
}
