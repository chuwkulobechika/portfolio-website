import { signInPath } from "@/app/session-auth";

export const runtime = "edge";

// Old sign-in link from ChatGPT hosting.
export function GET(request: Request): Response {
  const returnTo = new URL(request.url).searchParams.get("return_to") ?? "/admin";
  return Response.redirect(new URL(signInPath(returnTo), request.url), 301);
}
