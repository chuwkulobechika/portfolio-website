import { signOutPath } from "@/app/session-auth";
import { AdminClient } from "@/app/admin/admin-client";
import { requireCmsAdmin } from "@/lib/admin-auth";
import { listAdminProjects } from "@/lib/cms";

import "./admin.css";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user, allowed } = await requireCmsAdmin("/admin");
  if (!allowed) {
    return (
      <main className="admin-denied">
        <p className="admin-kicker">Portfolio CMS</p>
        <h1>This account does not have admin access.</h1>
        <p>Only the designated owner can use this CMS.</p>
        <a href={signOutPath("/admin")}>Sign out and use the owner account</a>
      </main>
    );
  }
  const projects = await listAdminProjects();
  return (
    <AdminClient
      initialProjects={projects}
      displayName={user.displayName}
      signOutPath={signOutPath("/")}
    />
  );
}
