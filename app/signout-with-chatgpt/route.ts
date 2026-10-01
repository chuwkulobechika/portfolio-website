export const runtime = "edge";

// Old sign-out link from ChatGPT hosting.
export function GET(request: Request): Response {
  return Response.redirect(new URL("/logout", request.url), 301);
}
