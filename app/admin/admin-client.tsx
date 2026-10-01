"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  GripVertical,
  ImagePlus,
  LoaderCircle,
  Layers3,
  LogOut,
  Plus,
  Save,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { renderMarkdown } from "@/lib/markdown";
import type { GalleryImage, Project, ProjectInput, SectionImage } from "@/lib/types";

type AdminClientProps = {
  initialProjects: Project[];
  displayName: string;
  signOutPath: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatSavedTime(value: string): string {
  const normalized = value.replace("T", " ").replace(/\.\d{3}Z$/, " UTC");
  return normalized || "not yet saved";
}

function emptyProject(sortOrder: number): Project {
  const now = new Date().toISOString();
  return {
    id: `new-${crypto.randomUUID()}`,
    slug: "untitled-project",
    title: "Untitled project",
    shortDescription: "Add a concise description of the project and the problem it explores.",
    cardHeadline: "Add the central idea behind this work.",
    tags: [],
    projectType: "Digital product",
    platform: "Responsive web",
    role: "Product design",
    focus: "",
    statusLabel: "Concept",
    year: new Date().getFullYear().toString(),
    cardLayout: "landscape",
    cardImageUrl: "",
    cardImageAlt: "",
    heroImageUrl: "",
    heroImageAlt: "",
    galleryImages: [],
    sectionImages: [],
    accentColor: "#ff6b2c",
    featured: true,
    published: false,
    sortOrder,
    contentMarkdown:
      "## The premise\n\nDescribe the opportunity, the context, and why the work matters.\n\n## The approach\n\nExplain the decisions that shaped the system.\n\n## The outcome\n\nClose with what the work demonstrates—without inventing metrics.",
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };
}

function toInput(project: Project): ProjectInput {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, publishedAt: _publishedAt, hasUnpublishedChanges: _hasUnpublishedChanges, ...input } =
    project;
  void _id;
  void _createdAt;
  void _updatedAt;
  void _publishedAt;
  void _hasUnpublishedChanges;
  return input;
}

async function responseJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error || "Something went wrong.");
  return data;
}

export function AdminClient({ initialProjects, displayName, signOutPath }: AdminClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [draft, setDraft] = useState<Project>(initialProjects[0] ?? emptyProject(0));
  const [baseline, setBaseline] = useState(JSON.stringify(initialProjects[0] ?? draft));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const isNew = !projects.some((project) => project.id === draft.id);
  const isDirty = JSON.stringify(draft) !== baseline;
  const preview = useMemo(
    () => renderMarkdown(draft.contentMarkdown, draft.sectionImages),
    [draft.contentMarkdown, draft.sectionImages],
  );
  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? project.published : !project.published);
      const matchesSearch =
        !query ||
        project.title.toLowerCase().includes(query) ||
        project.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [projects, search, statusFilter]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  function setField<K extends keyof Project>(key: K, value: Project[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectProject(project: Project) {
    if (isDirty && !window.confirm("Discard the unsaved changes to this project?")) return;
    setDraft(structuredClone(project));
    setBaseline(JSON.stringify(project));
    setSidebarOpen(false);
  }

  function startNewProject() {
    if (isDirty && !window.confirm("Discard the unsaved changes to this project?")) return;
    const next = emptyProject(projects.length);
    setDraft(next);
    setBaseline(JSON.stringify(next));
    setSidebarOpen(false);
  }

  async function saveProject(nextDraft = draft, action: "save" | "publish" = "save") {
    setSaving(true);
    try {
      const url = isNew ? "/api/admin/projects" : `/api/admin/projects/${draft.id}`;
      const response = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project: toInput(nextDraft), action }),
      });
      const data = await responseJson<{ project: Project }>(response);
      setProjects((current) => {
        const exists = current.some((project) => project.id === data.project.id);
        const next = exists
          ? current.map((project) => (project.id === data.project.id ? data.project : project))
          : [...current, data.project];
        return next.sort((a, b) => a.sortOrder - b.sortOrder);
      });
      setDraft(data.project);
      setBaseline(JSON.stringify(data.project));
      toast.success(action === "publish" ? (data.project.published ? "Published to the portfolio." : "Project unpublished.") : "Draft saved. The live site is unchanged.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function publishProject() {
    const next = { ...draft, published: draft.publishedAt ? draft.published : true };
    await saveProject(next, "publish");
  }

  async function removeProject() {
    if (isNew) {
      startNewProject();
      return;
    }
    try {
      await responseJson<{ ok: true }>(
        await fetch(`/api/admin/projects/${draft.id}`, { method: "DELETE" }),
      );
      const remaining = projects.filter((project) => project.id !== draft.id);
      setProjects(remaining);
      const next = remaining[0] ?? emptyProject(0);
      setDraft(next);
      setBaseline(JSON.stringify(next));
      toast.success("Project removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove project.");
    }
  }

  async function moveProject(id: string, direction: -1 | 1) {
    const currentIndex = projects.findIndex((project) => project.id === id);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= projects.length) return;
    const next = [...projects];
    [next[currentIndex], next[nextIndex]] = [next[nextIndex], next[currentIndex]];
    const ordered = next.map((project, index) => ({ ...project, sortOrder: index }));
    setProjects(ordered);
    if (draft.id === id) setDraft((current) => ({ ...current, sortOrder: nextIndex }));
    try {
      await responseJson<{ ok: true }>(
        await fetch("/api/admin/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: ordered.map((project) => project.id) }),
        }),
      );
      toast.success("Project order updated.");
    } catch (error) {
      setProjects(projects);
      toast.error(error instanceof Error ? error.message : "Unable to reorder projects.");
    }
  }

  async function uploadImage(file: File, destination: string): Promise<string | null> {
    setUploading(destination);
    try {
      const data = new FormData();
      data.append("file", file);
      const result = await responseJson<{ url: string }>(
        await fetch("/api/admin/upload", { method: "POST", body: data }),
      );
      toast.success("Image uploaded.");
      return result.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload image.");
      return null;
    } finally {
      setUploading(null);
    }
  }

  async function handleCardUpload(file?: File) {
    if (!file) return;
    const url = await uploadImage(file, "card-image");
    if (url) setField("cardImageUrl", url);
  }

  async function handleHeroUpload(file?: File) {
    if (!file) return;
    const url = await uploadImage(file, "hero-image");
    if (url) setField("heroImageUrl", url);
  }

  function updateGallery(index: number, changes: Partial<GalleryImage>) {
    setDraft((current) => ({
      ...current,
      galleryImages: current.galleryImages.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...changes } : image,
      ),
    }));
  }

  async function handleGalleryUpload(index: number, file?: File) {
    if (!file) return;
    const url = await uploadImage(file, `gallery-${index}`);
    if (url) updateGallery(index, { url });
  }

  function updateSectionImage(index: number, changes: Partial<SectionImage>) {
    setDraft((current) => ({
      ...current,
      sectionImages: current.sectionImages.map((image, imageIndex) =>
        imageIndex === index ? { ...image, ...changes } : image,
      ),
    }));
  }

  async function handleSectionImageUpload(index: number, file?: File) {
    if (!file) return;
    const url = await uploadImage(file, `section-${index}`);
    if (url) updateSectionImage(index, { url });
  }

  return (
    <div className="cms-shell">
      <Toaster position="top-right" />
      <aside className={`cms-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="cms-brand">
          <a href="/" target="_blank" rel="noreferrer">
            <span>Chukwulobe</span>
            <strong>Portfolio CMS</strong>
          </a>
          <Button className="sidebar-close" variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Close projects panel"><ChevronLeft /></Button>
        </div>
        <a className="cms-site-link" href="/admin/content"><Layers3 /> Edit site content <ArrowUpRight /></a>
        <div className="cms-sidebar-actions">
          <Button className="new-project-button" onClick={startNewProject}><Plus /> New project</Button>
          <label className="cms-search"><Search /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" /></label>
          <div className="cms-filters" aria-label="Filter projects">
            {(["all", "published", "draft"] as const).map((filter) => (
              <button key={filter} className={statusFilter === filter ? "is-active" : ""} onClick={() => setStatusFilter(filter)}>{filter}</button>
            ))}
          </div>
        </div>
        <div className="project-list">
          {filteredProjects.map((project) => {
            const actualIndex = projects.findIndex((item) => item.id === project.id);
            return (
              <div key={project.id} className={`project-list-row ${draft.id === project.id ? "is-current" : ""}`}>
                <button className="project-list-main" onClick={() => selectProject(project)}>
                  <span className="project-thumb">{project.cardImageUrl ? <img src={project.cardImageUrl} alt="" /> : <FileText />}</span>
                  <span><strong>{project.title}</strong><small>{project.published ? "Published" : "Draft"} · {project.year || "No year"}</small></span>
                </button>
                <div className="order-controls">
                  <button onClick={() => moveProject(project.id, -1)} disabled={actualIndex === 0} aria-label={`Move ${project.title} up`}><ArrowUp /></button>
                  <button onClick={() => moveProject(project.id, 1)} disabled={actualIndex === projects.length - 1} aria-label={`Move ${project.title} down`}><ArrowDown /></button>
                </div>
              </div>
            );
          })}
          {!filteredProjects.length && <p className="project-list-empty">No projects match this view.</p>}
        </div>
        <div className="cms-account"><span>{displayName}</span><a href={signOutPath}><LogOut /> Sign out</a></div>
      </aside>

      <main className="cms-workspace">
        <header className="cms-topbar">
          <Button className="sidebar-open" variant="outline" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open projects panel"><ChevronRight /></Button>
          <div className="cms-document-status">
            <span className={draft.published ? "status-dot is-live" : "status-dot"}></span>
            <div><strong>{isNew ? "New project" : draft.title}</strong><span>{isDirty ? "Unsaved changes" : draft.hasUnpublishedChanges ? "Draft saved · not published" : draft.published ? "Live" : "Draft saved"}</span></div>
          </div>
          <div className="cms-topbar-actions">
            {!isNew && <Button variant="outline" onClick={() => { if (isDirty) { toast.info("Save the draft before previewing it."); return; } window.open(`/admin/preview/project/${draft.id}/`, "_blank"); }}><ArrowUpRight /> Preview</Button>}
            <Button variant="outline" onClick={() => saveProject()} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Save />} Save draft</Button>
            <Button className="publish-button" onClick={publishProject} disabled={saving}>{saving ? <LoaderCircle className="spin" /> : <Check />} {draft.publishedAt && !draft.published ? "Unpublish" : draft.published ? "Publish changes" : "Publish"}</Button>
          </div>
        </header>

        <div className="cms-editor-wrap">
          <div className="cms-title-block">
            <p>{isNew ? "Create a case study" : "Edit case study"}</p>
            <input
              className="cms-title-input"
              value={draft.title}
              onChange={(event) => {
                const title = event.target.value;
                setDraft((current) => ({
                  ...current,
                  title,
                  slug: isNew && (current.slug === "untitled-project" || current.slug === slugify(current.title)) ? slugify(title) || "untitled-project" : current.slug,
                }));
              }}
              aria-label="Project title"
            />
            <p className="cms-updated">Last saved {formatSavedTime(draft.updatedAt)}</p>
          </div>

          <Tabs defaultValue="overview" className="cms-tabs">
            <TabsList variant="line" className="cms-tab-list">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="story">Case study</TabsTrigger>
              <TabsTrigger value="settings">Publishing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="cms-panel">
              <section className="editor-section"><div className="editor-section-heading"><span>01</span><div><h2>Card content</h2><p>The story a visitor sees before opening the project.</p></div></div>
                <div className="field-grid">
                  <Field label="Card headline" hint={`${draft.cardHeadline.length}/180`} wide><Textarea value={draft.cardHeadline} onChange={(event) => setField("cardHeadline", event.target.value)} rows={3} /></Field>
                  <Field label="Short description" hint={`${draft.shortDescription.length}/600`} wide><Textarea value={draft.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} rows={4} /></Field>
                  <Field label="Tags" hint="Comma separated" wide><Input value={draft.tags.join(", ")} onChange={(event) => setField("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 8))} /></Field>
                </div>
              </section>
              <section className="editor-section"><div className="editor-section-heading"><span>02</span><div><h2>Project details</h2><p>Metadata used on the case-study introduction.</p></div></div>
                <div className="field-grid">
                  <Field label="Project type"><Input value={draft.projectType} onChange={(event) => setField("projectType", event.target.value)} /></Field>
                  <Field label="Platform"><Input value={draft.platform} onChange={(event) => setField("platform", event.target.value)} /></Field>
                  <Field label="Role"><Input value={draft.role} onChange={(event) => setField("role", event.target.value)} /></Field>
                  <Field label="Year"><Input value={draft.year} onChange={(event) => setField("year", event.target.value)} /></Field>
                  <Field label="Focus" wide><Input value={draft.focus} onChange={(event) => setField("focus", event.target.value)} /></Field>
                  <Field label="Status label" wide><Input value={draft.statusLabel} onChange={(event) => setField("statusLabel", event.target.value)} /></Field>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="media" className="cms-panel">
              <section className="editor-section"><div className="editor-section-heading"><span>01</span><div><h2>Primary imagery</h2><p>Use a strong editorial image; the card and hero can share it or use different crops.</p></div></div>
                <div className="primary-media-grid">
                  <div className="primary-media-card">
                    <div className="primary-media-heading"><div><span>Portfolio card</span><p>Shown in selected work on the homepage.</p></div></div>
                    <div className="media-preview">{draft.cardImageUrl ? <img src={draft.cardImageUrl} alt={draft.cardImageAlt} /> : <ImagePlus />}</div>
                    <div className="media-controls">
                      <label className="upload-button">{uploading === "card-image" ? <LoaderCircle className="spin" /> : <Upload />} Upload card image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => handleCardUpload(event.target.files?.[0])} /></label>
                      <Field label="Card image URL"><Input value={draft.cardImageUrl} onChange={(event) => setField("cardImageUrl", event.target.value)} placeholder="/assets/project-card.jpg" /></Field>
                      <Field label="Card alt text"><Input value={draft.cardImageAlt} onChange={(event) => setField("cardImageAlt", event.target.value)} placeholder="Describe what the image shows" /></Field>
                    </div>
                  </div>
                  <div className="primary-media-card">
                    <div className="primary-media-heading"><div><span>Case-study hero</span><p>The large opening image inside the case study.</p></div></div>
                    <div className="media-preview">{draft.heroImageUrl ? <img src={draft.heroImageUrl} alt={draft.heroImageAlt} /> : <ImagePlus />}</div>
                    <div className="media-controls">
                      <div className="media-action-row"><label className="upload-button">{uploading === "hero-image" ? <LoaderCircle className="spin" /> : <Upload />} Upload hero image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => handleHeroUpload(event.target.files?.[0])} /></label><Button variant="outline" size="sm" disabled={!draft.cardImageUrl} onClick={() => setDraft((current) => ({ ...current, heroImageUrl: current.cardImageUrl, heroImageAlt: current.cardImageAlt }))}>Use card image</Button></div>
                      <Field label="Hero image URL"><Input value={draft.heroImageUrl} onChange={(event) => setField("heroImageUrl", event.target.value)} placeholder="/assets/project-hero.jpg" /></Field>
                      <Field label="Hero alt text"><Input value={draft.heroImageAlt} onChange={(event) => setField("heroImageAlt", event.target.value)} placeholder="Describe the case-study hero image" /></Field>
                    </div>
                  </div>
                </div>
              </section>
              <section className="editor-section"><div className="editor-section-heading"><span>02</span><div><h2>Case-study gallery</h2><p>Add supporting screens, details, and captions in story order.</p></div></div>
                <div className="gallery-editor">
                  {draft.galleryImages.map((image, index) => (
                    <div className="gallery-row" key={`${index}-${image.url}`}>
                      <div className="gallery-handle"><GripVertical /><span>{String(index + 1).padStart(2, "0")}</span></div>
                      <div className="gallery-thumb">{image.url ? <img src={image.url} alt="" /> : <ImagePlus />}</div>
                      <div className="gallery-fields"><Input value={image.url} onChange={(event) => updateGallery(index, { url: event.target.value })} placeholder="Image URL" /><Input value={image.alt} onChange={(event) => updateGallery(index, { alt: event.target.value })} placeholder="Alt text" /><Input value={image.caption} onChange={(event) => updateGallery(index, { caption: event.target.value })} placeholder="Caption (optional)" /></div>
                      <div className="gallery-actions"><label aria-label="Upload gallery image">{uploading === `gallery-${index}` ? <LoaderCircle className="spin" /> : <Upload />}<input type="file" accept="image/*" onChange={(event) => handleGalleryUpload(index, event.target.files?.[0])} /></label><button onClick={() => setField("galleryImages", draft.galleryImages.filter((_, imageIndex) => imageIndex !== index))} aria-label="Remove gallery image"><Trash2 /></button></div>
                    </div>
                  ))}
                  <Button variant="outline" onClick={() => setField("galleryImages", [...draft.galleryImages, { url: "", alt: "", caption: "" }])}><Plus /> Add gallery image</Button>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="story" className="cms-panel cms-story-panel">
              <section className="editor-section story-editor-section"><div className="editor-section-heading"><span>01</span><div><h2>Case-study narrative</h2><p>Write in Markdown. Use ## for chapters, ### for subheads, &gt; for pull quotes, and standard lists or links.</p></div></div>
                <div className="markdown-grid">
                  <div className="markdown-column"><div className="markdown-column-heading"><span>Markdown</span><small>{draft.contentMarkdown.split(/\s+/).filter(Boolean).length} words</small></div><Textarea className="markdown-textarea" value={draft.contentMarkdown} onChange={(event) => setField("contentMarkdown", event.target.value)} spellCheck /></div>
                  <div className="markdown-column"><div className="markdown-column-heading"><span>Live preview</span><small>{preview.toc.length} chapters</small></div><article className="markdown-preview" dangerouslySetInnerHTML={{ __html: preview.html }} /></div>
                </div>
              </section>
              <section className="editor-section"><div className="editor-section-heading"><span>02</span><div><h2>Images inside chapters</h2><p>Optionally place one or more images at the end of any case-study chapter, including “Shaping the system”.</p></div></div>
                <div className="section-image-editor">
                  {draft.sectionImages.map((image, index) => {
                    const chapterExists = preview.toc.some((chapter) => chapter.id === image.sectionId);
                    return (
                      <div className="section-image-row" key={index}>
                        <div className="section-image-topline">
                          <span className="section-image-number">{String(index + 1).padStart(2, "0")}</span>
                          <label>Place after chapter<select value={image.sectionId} onChange={(event) => updateSectionImage(index, { sectionId: event.target.value })}>{!chapterExists && <option value={image.sectionId}>Missing chapter · {image.sectionId}</option>}{preview.toc.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.label}</option>)}</select></label>
                          <button type="button" onClick={() => setField("sectionImages", draft.sectionImages.filter((_, imageIndex) => imageIndex !== index))} aria-label="Remove section image"><Trash2 /></button>
                        </div>
                        <div className="section-image-content">
                          <div className="section-image-thumb">{image.url ? <img src={image.url} alt="" /> : <ImagePlus />}</div>
                          <div className="section-image-fields">
                            <label className="upload-button">{uploading === `section-${index}` ? <LoaderCircle className="spin" /> : <Upload />} Upload image<input type="file" accept="image/*" onChange={(event) => handleSectionImageUpload(index, event.target.files?.[0])} /></label>
                            <Input value={image.url} onChange={(event) => updateSectionImage(index, { url: event.target.value })} placeholder="Image URL" />
                            <Input value={image.alt} onChange={(event) => updateSectionImage(index, { alt: event.target.value })} placeholder="Alt text" />
                            <Input value={image.caption} onChange={(event) => updateSectionImage(index, { caption: event.target.value })} placeholder="Caption (optional)" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Button variant="outline" disabled={!preview.toc.length} onClick={() => setField("sectionImages", [...draft.sectionImages, { sectionId: preview.toc[0]?.id ?? "", url: "", alt: "", caption: "" }])}><Plus /> Add image to a chapter</Button>
                  {!preview.toc.length && <p className="section-image-note">Add a chapter beginning with ## in the Markdown editor before attaching an image.</p>}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="settings" className="cms-panel">
              <section className="editor-section"><div className="editor-section-heading"><span>01</span><div><h2>Publishing</h2><p>Control where the project appears and how its URL is formed.</p></div></div>
                <div className="settings-stack">
                  <SettingRow title="Published" description="Makes the case study publicly available. Drafts remain private to the CMS."><Switch checked={draft.published} onCheckedChange={(checked) => setField("published", checked)} /></SettingRow>
                  <SettingRow title="Featured on homepage" description="Includes this project in the selected work section when it is published."><Switch checked={draft.featured} onCheckedChange={(checked) => setField("featured", checked)} /></SettingRow>
                  <div className="settings-fields">
                    <Field label="Project URL"><div className="slug-input"><span>/work/</span><Input value={draft.slug} onChange={(event) => setField("slug", slugify(event.target.value))} /></div></Field>
                    <Field label="Card layout"><select value={draft.cardLayout} onChange={(event) => setField("cardLayout", event.target.value as Project["cardLayout"])}><option value="wide">Wide feature</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></Field>
                    <Field label="Accent color"><div className="color-input"><input type="color" value={draft.accentColor} onChange={(event) => setField("accentColor", event.target.value)} /><Input value={draft.accentColor} onChange={(event) => setField("accentColor", event.target.value)} /></div></Field>
                  </div>
                </div>
              </section>
              <section className="editor-section danger-section"><div className="editor-section-heading"><span>02</span><div><h2>Danger zone</h2><p>Removing a project cannot be undone.</p></div></div>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 /> Remove project</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Remove “{draft.title}”?</AlertDialogTitle><AlertDialogDescription>This deletes the project record and removes it from the portfolio. Uploaded image files are retained so they are not accidentally lost.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={removeProject}>Remove project</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function Field({ label, hint, wide, children }: { label: string; hint?: string; wide?: boolean; children: React.ReactNode }) {
  return <div className={`cms-field ${wide ? "is-wide" : ""}`}><div className="field-label-row"><Label>{label}</Label>{hint && <span>{hint}</span>}</div>{children}</div>;
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="setting-row"><div><h3>{title}</h3><p>{description}</p></div>{children}</div>;
}
