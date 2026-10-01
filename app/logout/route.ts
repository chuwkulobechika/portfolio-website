import { SESSION_COOKIE, safeRelativeReturnPath } from "@/app/session-auth";

export const runtime = "edge";

function signOut(request: Request): Response {
  const returnTo = safeRelativeReturnPath(new URL(request.url).searchParams.get("return_to"));
  return new Response(null, {
    status: 303,
    headers: {
      Location: returnTo,
      "Cache-Control": "private, no-store",
      "Set-Cookie": `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`,
    },
  });
}

export const GET = signOut;
export const POST = signOut;
