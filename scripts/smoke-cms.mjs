import assert from "node:assert/strict";

const base = process.env.CMS_BASE ?? "http://localhost:5173";
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base)) {
  throw new Error("CMS smoke test only runs against a local preview server.");
}
const cookie = "__sites_local_auth=1";

async function call(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { Cookie: cookie, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  const type = response.headers.get("content-type") ?? "";
  const body = type.includes("application/json") ? await response.json() : await response.text();
  return { response, body };
}

async function saveContent(content, action, expectedUpdatedAt) {
  const result = await call("/api/admin/content/home", {
    method: "PUT",
    body: JSON.stringify({ content, action, expectedUpdatedAt }),
  });
  assert.equal(result.response.status, 200, JSON.stringify(result.body));
  return result.body.record;
}

let restoreHome = null;
let temporaryId = null;
try {
  const initial = await call("/api/admin/content/home");
  assert.equal(initial.response.status, 200, JSON.stringify(initial.body));
  const original = initial.body.record;
  assert.equal(original.hasUnpublishedChanges, false, "Keep existing local drafts untouched.");
  restoreHome = original.published;
  const marker = `CMS smoke test ${Date.now()}`;
  const changed = { ...original.draft, heroEyebrow: marker };
  const draft = await saveContent(changed, "save", original.updatedAt);
  assert.equal(draft.hasUnpublishedChanges, true);
  const publicBefore = await call("/");
  assert.equal(publicBefore.response.status, 200);
  assert.equal(publicBefore.body.includes(marker), false, "Draft leaked into public page.");
  const preview = await call("/?preview=1");
  assert.equal(preview.response.status, 200);
  assert.equal(preview.body.includes(marker), true, "Preview did not show saved draft.");
  const published = await saveContent(changed, "publish", draft.updatedAt);
  assert.equal(published.hasUnpublishedChanges, false);
  const publicAfter = await call("/");
  assert.equal(publicAfter.body.includes(marker), true, "Published content not on public page.");
  await saveContent(restoreHome, "publish", published.updatedAt);
  restoreHome = null;

  const projectsResponse = await call("/api/admin/projects");
  assert.equal(projectsResponse.response.status, 200);
  const sample = projectsResponse.body.projects[0];
  assert.ok(sample, "Expected a seeded project.");
  const { id, createdAt, updatedAt, publishedAt, hasUnpublishedChanges, ...baseProject } = sample;
  void id; void createdAt; void updatedAt; void publishedAt; void hasUnpublishedChanges;
  const slug = `cms-smoke-${Date.now()}`;
  const newProject = { ...baseProject, slug, title: "CMS smoke test", cardHeadline: "Temporary draft card", published: false, featured: false, sortOrder: 999 };
  const created = await call("/api/admin/projects", { method: "POST", body: JSON.stringify({ project: newProject, action: "save" }) });
  assert.equal(created.response.status, 201, JSON.stringify(created.body));
  temporaryId = created.body.project.id;
  const sectionImageUrl = "/assets/lifevault-study.jpg";
  const sectionImageCaption = "Section image smoke test";
  const edited = {
    ...newProject,
    cardHeadline: "Saved private draft card",
    shortDescription: "Saved private draft summary for CMS verification.",
    contentMarkdown: "## Test chapter\n\nA temporary narrative used to verify chapter media.",
    sectionImages: [{ sectionId: "test-chapter", url: sectionImageUrl, alt: "Temporary case-study visual", caption: sectionImageCaption }],
  };
  const saved = await call(`/api/admin/projects/${temporaryId}`, { method: "PUT", body: JSON.stringify({ project: edited, action: "save" }) });
  assert.equal(saved.response.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.project.hasUnpublishedChanges, true);
  const hidden = await call(`/work/${slug}`);
  assert.equal(hidden.response.status, 404, "Unpublished project became public.");
  const projectPreview = await call(`/admin/preview/project/${temporaryId}`);
  assert.equal(projectPreview.response.status, 200);
  assert.equal(projectPreview.body.includes("Saved private draft summary for CMS verification."), true, "Project preview did not show the saved draft.");
  assert.equal(projectPreview.body.includes(sectionImageCaption), true, "Project preview did not place the image in its selected chapter.");
  const promoted = await call(`/api/admin/projects/${temporaryId}`, { method: "PUT", body: JSON.stringify({ project: { ...edited, published: true }, action: "publish" }) });
  assert.equal(promoted.response.status, 200, JSON.stringify(promoted.body));
  const visible = await call(`/work/${slug}`);
  assert.equal(visible.response.status, 200, "Published project did not become public.");
  assert.equal(visible.body.includes(sectionImageCaption), true, "Published chapter image was missing from the case study.");
  console.log("CMS smoke checks passed: site draft/preview/publish and project draft/publish.");
} finally {
  if (restoreHome) {
    const current = await call("/api/admin/content/home");
    await saveContent(restoreHome, "publish", current.body.record.updatedAt);
  }
  if (temporaryId) await call(`/api/admin/projects/${temporaryId}`, { method: "DELETE" });
}
