import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  checkPassword,
  createSessionToken,
  getAdminUser,
  safeRelativeReturnPath,
} from "@/app/session-auth";

export const runtime = "edge";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const returnTo = safeRelativeReturnPath(url.searchParams.get("return_to") ?? "/admin");
  if (await getAdminUser()) return redirectTo(returnTo);
  return loginPage(returnTo, url.searchParams.get("error") === "1");
}

export async function POST(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return new Response("Forbidden", { status: 403 });

  const form = await request.formData();
  const returnTo = safeRelativeReturnPath(String(form.get("return_to") ?? "/admin"));
  const password = String(form.get("password") ?? "");

  if (!(await checkPassword(password))) {
    // Slow down repeated guesses.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return redirectTo(`/login?error=1&return_to=${encodeURIComponent(returnTo)}`);
  }

  const secure = url.protocol === "https:" ? "; Secure" : "";
  return redirectTo(returnTo, {
    "Set-Cookie": `${SESSION_COOKIE}=${await createSessionToken()}; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; HttpOnly; SameSite=Lax${secure}`,
  });
}

function redirectTo(location: string, extra: Record<string, string> = {}): Response {
  return new Response(null, {
    status: 303,
    headers: { Location: location, "Cache-Control": "private, no-store", ...extra },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function loginPage(returnTo: string, failed: boolean): Response {
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Sign in · Portfolio CMS</title>
<style>
  :root { color-scheme: light dark; --bg: #f6f5f2; --card: #fff; --text: #141414; --muted: #6b6b6b; --line: #e3e1dc; --accent: #ff6b2c; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0f0f0f; --card: #181818; --text: #f2f2f2; --muted: #9a9a9a; --line: #2a2a2a; } }
  * { box-sizing: border-box; }
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 16px; background: var(--bg); color: var(--text); font: 15px/1.5 system-ui, -apple-system, sans-serif; }
  form { width: 100%; max-width: 360px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 28px; }
  .kicker { margin: 0 0 4px; color: var(--muted); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
  h1 { margin: 0 0 20px; font-size: 22px; }
  label { display: block; margin-bottom: 6px; font-size: 13px; color: var(--muted); }
  input { width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: transparent; color: inherit; font: inherit; }
  input:focus { outline: 2px solid var(--accent); outline-offset: 1px; }
  button { width: 100%; margin-top: 16px; padding: 11px; border: 0; border-radius: 8px; background: var(--text); color: var(--bg); font: inherit; font-weight: 600; cursor: pointer; }
  .error { margin: 0 0 14px; color: #d93025; font-size: 14px; }
</style>
</head>
<body>
<form method="post" action="/login">
  <p class="kicker">Portfolio CMS</p>
  <h1>Sign in</h1>
  ${failed ? '<p class="error" role="alert">That password is incorrect.</p>' : ""}
  <input type="hidden" name="return_to" value="${escapeHtml(returnTo)}">
  <label for="password">Password</label>
  <input id="password" name="password" type="password" autocomplete="current-password" required autofocus>
  <button type="submit">Sign in</button>
</form>
</body>
</html>`;
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}
