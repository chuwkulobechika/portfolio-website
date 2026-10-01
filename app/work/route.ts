export const runtime = "edge";

// There is no standalone work index; send visitors to the homepage section.
export function GET(request: Request): Response {
  return Response.redirect(new URL("/#work", request.url), 301);
}
