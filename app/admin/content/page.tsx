import { signOutPath } from "@/app/session-auth";
import { requireCmsAdmin } from "@/lib/admin-auth";
import { getContentRecords } from "@/lib/site-content-store";
import { listMediaAssets } from "@/lib/media-assets";
import { SiteContentClient } from "./site-content-client";

import "../admin.css";
import "./site-content.css";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const { user, allowed } = await requireCmsAdmin("/admin/content");
  if (!allowed) {
    return <main className="admin-denied"><p className="admin-kicker">Portfolio CMS</p><h1>This account does not have admin access.</h1><p>Only the designated owner can use this CMS.</p><a href={signOutPath("/admin/content")}>Sign out and use the owner account</a></main>;
  }
  const [records, media] = await Promise.all([getContentRecords(), listMediaAssets()]);
  return <SiteContentClient initialRecords={records} initialMedia={media} displayName={user.displayName} signOutPath={signOutPath("/")} />;
}
