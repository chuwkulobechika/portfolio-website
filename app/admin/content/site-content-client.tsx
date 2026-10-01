"use client";

/* eslint-disable @next/next/no-img-element */

import { ArrowDown, ArrowUp, ArrowUpRight, Check, ChevronLeft, ChevronRight, ImagePlus, Layers3, LoaderCircle, LogOut, Plus, Save, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ContentRecord } from "@/lib/site-content-store";
import type { SiteContentKey } from "@/lib/site-content";
import type { MediaAsset } from "@/lib/media-assets";

type Records = { [K in SiteContentKey]: ContentRecord<K> };
type Section = SiteContentKey | "media";
type Path = (string | number)[];

const sections: { key: Section; label: string; description: string; group: string }[] = [
  { key: "home", label: "Home page", description: "Hero, featured work copy, about, and contact", group: "Pages" },
  { key: "services", label: "Services", description: "Sticky story, images, and service details", group: "Pages" },
  { key: "studio", label: "Lowbe Studio", description: "Experiments, components, manifesto, practice", group: "Pages" },
  { key: "navigation", label: "Navigation & footer", description: "Menus, wordmarks, social and footer links", group: "Site-wide" },
  { key: "settings", label: "Contact & SEO", description: "Email, page titles, descriptions, social images", group: "Site-wide" },
  { key: "media", label: "Media library", description: "Site and uploaded imagery", group: "Assets" },
];

type FieldGroup = { title: string; description: string; fields: string[] };
const fieldGroups: Record<SiteContentKey, FieldGroup[]> = {
  home: [
    { title: "First impression", description: "The headline, image, and two routes into the work.", fields: ["heroEyebrow", "heroTitle", "heroDescription", "heroImage", "primaryCta", "secondaryCta"] },
    { title: "Positioning & work", description: "Introduce the approach and frame the case studies.", fields: ["positioningLead", "positioningNote", "workEyebrow", "workTitle"] },
    { title: "Studio introduction", description: "A clear bridge into Lowbe Studio.", fields: ["studioEyebrow", "studioTitle", "studioDescription", "studioCta"] },
    { title: "About & availability", description: "Personal introduction, focus areas, and current status.", fields: ["aboutTitle", "aboutParagraphs", "aboutFacts", "availability"] },
    { title: "Contact", description: "The invitation and the form's primary action.", fields: ["contactTitle", "contactDescription", "contactButton"] },
  ],
  services: [
    { title: "Service narrative", description: "The introduction visitors see before scrolling.", fields: ["title", "introduction"] },
    { title: "Sticky-scroll chapters", description: "Reorder each service with its image, copy, and supporting detail.", fields: ["items"] },
  ],
  studio: [
    { title: "Studio hero", description: "The first impression of the experimental practice.", fields: ["heroEyebrow", "heroTitle", "heroDescription", "heroImage", "heroPrimaryCta"] },
    { title: "Experimental work", description: "Editorial studies, imagery, and captions.", fields: ["experimentsTitle", "experimentsDescription", "experiments"] },
    { title: "Component lab", description: "Text around the live interaction demos.", fields: ["componentsTitle", "componentsDescription", "componentFeatures"] },
    { title: "Why Lowbe", description: "The manifesto animates word by word as visitors scroll.", fields: ["manifesto"] },
    { title: "Practice & invitation", description: "Focus areas and the final partnership invitation.", fields: ["practiceTitle", "practiceDescription", "practices", "contactEyebrow", "contactTitle", "contactButton"] },
  ],
  navigation: [
    { title: "Site identity", description: "Names displayed in the portfolio and studio headers.", fields: ["portfolioWordmark", "studioWordmark"] },
    { title: "Header navigation", description: "Menus across the portfolio, studio, and case studies.", fields: ["primaryLinks", "headerCta", "studioLinks"] },
    { title: "Footer links", description: "Explore, studio, and social destinations.", fields: ["footerExplore", "footerStudio", "socialLinks"] },
    { title: "Footer identity", description: "Signature and copyright line.", fields: ["footerIdentity", "footerSubtitle", "footerWordmark", "copyright"] },
  ],
  settings: [
    { title: "Contact destination", description: "Used by the form, footer, and studio contact button.", fields: ["contactEmail"] },
    { title: "Search & social previews", description: "Titles, descriptions, and share images for both pages.", fields: ["homeSeo", "studioSeo"] },
    { title: "Browser appearance", description: "Color used by supported browser UI.", fields: ["themeColor"] },
  ],
};

const fieldLabels: Record<string, string> = {
  heroEyebrow: "Eyebrow", heroTitle: "Hero headline", heroDescription: "Hero description", heroImage: "Hero image",
  primaryCta: "Primary call to action", secondaryCta: "Secondary call to action",
  positioningLead: "Positioning statement", positioningNote: "Supporting note",
  workEyebrow: "Work section eyebrow", workTitle: "Work section title",
  studioEyebrow: "Studio preview eyebrow", studioTitle: "Studio preview title", studioDescription: "Studio preview description", studioCta: "Studio preview link text",
  aboutTitle: "About title", aboutParagraphs: "About paragraphs", aboutFacts: "Focus areas",
  availability: "Availability status", contactTitle: "Contact headline", contactDescription: "Contact description", contactButton: "Contact button",
  title: "Title", introduction: "Introduction", items: "Service stories", detail: "Detail label",
  experimentsTitle: "Experiments title", experimentsDescription: "Experiments intro", experiments: "Experiments",
  componentsTitle: "Component lab title", componentsDescription: "Component lab intro", componentFeatures: "Component labels",
  manifesto: "Why the studio exists", practiceTitle: "Practice title", practiceDescription: "Practice intro", practices: "Practice areas",
  contactEyebrow: "Contact eyebrow", heroPrimaryCta: "Hero button", category: "Category",
  portfolioWordmark: "Portfolio wordmark", studioWordmark: "Studio wordmark", primaryLinks: "Main menu links", headerCta: "Header call to action",
  studioLinks: "Studio menu links", footerExplore: "Footer explore links", footerStudio: "Footer studio links", socialLinks: "Social links",
  footerIdentity: "Footer name", footerSubtitle: "Footer role", footerWordmark: "Oversized footer wordmark", copyright: "Copyright line",
  contactEmail: "Contact email", homeSeo: "Home page search preview", studioSeo: "Studio page search preview", socialImageUrl: "Social preview image", themeColor: "Browser theme color",
  url: "Image URL", alt: "Alt text", label: "Link text", href: "Link destination", description: "Description", image: "Image",
};

function humanLabel(key: string): string {
  return fieldLabels[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
}

function setAt(root: unknown, path: Path, value: unknown): unknown {
  const next = structuredClone(root) as Record<string | number, unknown>;
  let pointer = next;
  for (const part of path.slice(0, -1)) pointer = pointer[part] as Record<string | number, unknown>;
  pointer[path.at(-1)!] = value;
  return next;
}

function blankLike(value: unknown): unknown {
  if (typeof value === "string") return "";
  if (Array.isArray(value)) return [];
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, part]) => [key, blankLike(part)]));
  return value;
}

function newArrayItem(path: Path, current: unknown[]): unknown {
  if (current.length) return blankLike(current[0]);
  if (path.at(-1) === "socialLinks" || String(path.at(-1)).includes("Links")) return { label: "", href: "" };
  return "";
}

function isLongText(key: string, value: string): boolean {
  return value.length > 100 || /description|paragraph|manifesto|introduction|positioning|note|copy/i.test(key);
}

export function SiteContentClient({ initialRecords, initialMedia, displayName, signOutPath }: { initialRecords: Records; initialMedia: MediaAsset[]; displayName: string; signOutPath: string }) {
  const [records, setRecords] = useState<Records>(initialRecords);
  const [section, setSection] = useState<Section>("home");
  const [draft, setDraft] = useState<unknown>(structuredClone(initialRecords.home.draft));
  const [baseline, setBaseline] = useState(JSON.stringify(initialRecords.home.draft));
  const [media, setMedia] = useState<MediaAsset[]>(initialMedia);
  const [mediaPicker, setMediaPicker] = useState<Path | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dirty = JSON.stringify(draft) !== baseline;
  const currentRecord = section !== "media" ? records[section] : null;
  const title = sections.find((item) => item.key === section)?.label ?? "Home page";

  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  function selectSection(next: Section) {
    if (next === section) { setSidebarOpen(false); return; }
    if (dirty && !window.confirm("Discard unsaved changes to this section?")) return;
    setSection(next);
    if (next !== "media") {
      setDraft(structuredClone(records[next].draft));
      setBaseline(JSON.stringify(records[next].draft));
    }
    setSidebarOpen(false);
  }

  function update(path: Path, value: unknown) {
    setDraft((current: unknown) => setAt(current, path, value));
  }

  async function save(action: "save" | "publish") {
    if (section === "media" || !currentRecord) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content/${section}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft, action, expectedUpdatedAt: currentRecord.updatedAt }),
      });
      const result = await response.json() as { record?: ContentRecord; error?: string };
      if (!response.ok || !result.record) throw new Error(result.error ?? "Could not save this section.");
      setRecords((current) => ({ ...current, [section]: result.record }) as Records);
      setDraft(structuredClone(result.record.draft));
      setBaseline(JSON.stringify(result.record.draft));
      toast.success(action === "publish" ? "Published to the live site." : "Draft saved. The live site is unchanged.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this section.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file?: File, target?: Path) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/admin/upload", { method: "POST", body: form });
      const result = await response.json() as { asset?: MediaAsset; error?: string };
      if (!response.ok || !result.asset) throw new Error(result.error ?? "Upload failed.");
      setMedia((current) => [result.asset!, ...current]);
      if (target) update(target, result.asset.url);
      toast.success("Image added to the media library.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function chooseMedia(asset: MediaAsset) {
    if (!mediaPicker) return;
    update(mediaPicker, asset.url);
    setMediaPicker(null);
  }

  function previewUrl(): string {
    return section === "studio" ? "/studio/?preview=1" : "/?preview=1";
  }

  function field(path: Path, key: string, value: unknown): React.ReactNode {
    if (typeof value === "string") {
      const imageUrlField = key === "url" || key === "socialImageUrl";
      return <div className="site-field" key={path.join(".")}>
        <label htmlFor={`f-${path.join("-")}`}>{humanLabel(key)}</label>
        {isLongText(key, value) && !imageUrlField
          ? <Textarea id={`f-${path.join("-")}`} value={value} rows={key === "manifesto" ? 8 : 3} onChange={(event) => update(path, event.target.value)} />
          : <Input id={`f-${path.join("-")}`} value={value} onChange={(event) => update(path, event.target.value)} />}
        {imageUrlField && <div className="site-image-actions"><Button type="button" size="sm" variant="outline" onClick={() => setMediaPicker(path)}><ImagePlus /> Choose image</Button><label className="site-upload-inline"><Upload /> Upload<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => upload(event.target.files?.[0], path)} /></label></div>}
        {imageUrlField && value && <img className="site-image-preview" src={value} alt="Image preview" />}
      </div>;
    }
    if (Array.isArray(value)) {
      return <div className="site-array" key={path.join(".")}><div className="site-array-heading"><h3>{humanLabel(key)}</h3><span>{value.length} items</span></div>
        {value.map((item, index) => <div className="site-array-item" key={`${path.join(".")}-${index}`}><div className="site-array-item-top"><strong>{typeof item === "object" && item ? String((item as Record<string, unknown>).title ?? (item as Record<string, unknown>).label ?? `${humanLabel(key)} ${index + 1}`) : `${humanLabel(key)} ${index + 1}`}</strong><div><button type="button" aria-label="Move up" disabled={index === 0} onClick={() => { const next = [...value]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; update(path, next); }}><ArrowUp /></button><button type="button" aria-label="Move down" disabled={index === value.length - 1} onClick={() => { const next = [...value]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; update(path, next); }}><ArrowDown /></button><button type="button" aria-label="Remove item" onClick={() => update(path, value.filter((_, i) => i !== index))}><Trash2 /></button></div></div><div className="site-array-item-fields">{typeof item === "string" ? field([...path, index], "text", item) : item && typeof item === "object" ? Object.entries(item).map(([childKey, childValue]) => field([...path, index, childKey], childKey, childValue)) : null}</div></div>)}
        <Button type="button" variant="outline" onClick={() => update(path, [...value, newArrayItem(path, value)])}><Plus /> Add {key === "items" ? "service" : key === "experiments" ? "experiment" : key.includes("Links") ? "link" : "item"}</Button>
      </div>;
    }
    if (value && typeof value === "object") {
      return <div className="site-object" key={path.join(".")}><h3>{humanLabel(key)}</h3><div className="site-object-grid">{Object.entries(value).map(([childKey, childValue]) => field([...path, childKey], childKey, childValue))}</div></div>;
    }
    return null;
  }

  return <div className="cms-shell site-cms-shell"><Toaster position="top-right" />
    <aside className={`cms-sidebar site-sidebar ${sidebarOpen ? "is-open" : ""}`}>
      <div className="cms-brand"><a href="/admin/content"><span>Chukwulobe</span><strong>Portfolio CMS</strong></a><Button className="sidebar-close" variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><ChevronLeft /></Button></div>
      <div className="site-sidebar-list"><a className="site-projects-link" href="/admin"><Layers3 /> Projects & case studies <ArrowUpRight /></a>{["Pages", "Site-wide", "Assets"].map((group) => <div key={group} className="site-sidebar-group"><p>{group}</p>{sections.filter((item) => item.group === group).map((item) => <button type="button" key={item.key} className={section === item.key ? "is-current" : ""} onClick={() => selectSection(item.key)}><span><strong>{item.label}</strong><small>{item.description}</small></span>{item.key !== "media" && records[item.key].hasUnpublishedChanges && <i aria-label="Unpublished changes" />}</button>)}</div>)}</div>
      <div className="cms-account"><span>{displayName}</span><a href={signOutPath}><LogOut /> Sign out</a></div>
    </aside>
    <main className="cms-workspace">
      <header className="cms-topbar"><Button className="sidebar-open" variant="outline" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><ChevronRight /></Button><div className="cms-document-status"><span className={`status-dot ${currentRecord && !currentRecord.hasUnpublishedChanges ? "is-live" : ""}`} /><div><strong>{title}</strong><span>{dirty ? "Unsaved changes" : currentRecord?.hasUnpublishedChanges ? "Draft saved · not published" : section === "media" ? `${media.length} images` : "Published"}</span></div></div>{section !== "media" && <div className="cms-topbar-actions"><Button variant="outline" onClick={() => { if (dirty) { toast.info("Save the draft before previewing it."); return; } window.open(previewUrl(), "_blank"); }}><ArrowUpRight /> Preview</Button><Button variant="outline" disabled={busy} onClick={() => save("save")}>{busy ? <LoaderCircle className="spin" /> : <Save />} Save draft</Button><Button className="publish-button" disabled={busy} onClick={() => save("publish")}>{busy ? <LoaderCircle className="spin" /> : <Check />} Publish</Button></div>}</header>
      <div className="cms-editor-wrap site-editor-wrap"><div className="cms-title-block"><p>Site content</p><h1>{title}</h1><p className="site-title-note">{sections.find((item) => item.key === section)?.description}. {section !== "media" && "Save a private draft, preview it, then publish when ready."}</p></div>
        {section === "media" ? <div className="site-library"><div className="site-library-head"><p>Choose existing images in any image field, or upload new files here. Uploaded files remain available even when a content item is removed.</p><label className="site-upload-inline site-upload-large">{uploading ? <LoaderCircle className="spin" /> : <Upload />} Upload image<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => upload(event.target.files?.[0])} /></label></div><div className="site-media-grid">{media.map((asset) => <div className="site-media-card" key={asset.id}><img src={asset.url} alt={asset.alt || asset.name} /><div><strong>{asset.name}</strong><small>{asset.builtIn ? "Included with site" : asset.sizeBytes ? `${(asset.sizeBytes / 1024 / 1024).toFixed(1)} MB` : "Uploaded"}</small><button type="button" onClick={() => { void navigator.clipboard.writeText(asset.url); toast.success("Image URL copied."); }}>Copy URL</button></div></div>)}</div></div>
        : <div className="site-fields">{fieldGroups[section].map((group, index) => <section className="site-field-section" key={group.title}><div className="site-group-heading"><span>{String(index + 1).padStart(2, "0")}</span><h2>{group.title}</h2><p>{group.description}</p></div><div className="site-group-fields">{group.fields.map((key) => field([key], key, (draft as Record<string, unknown>)[key]))}</div></section>)}</div>}
      </div>
    </main>
    {mediaPicker && <div className="site-modal-backdrop" role="presentation" onMouseDown={() => setMediaPicker(null)}><div className="site-modal" role="dialog" aria-modal="true" aria-label="Choose an image" onMouseDown={(event) => event.stopPropagation()}><div className="site-modal-head"><div><p>Media library</p><h2>Choose an image</h2></div><Button variant="outline" onClick={() => setMediaPicker(null)}>Close</Button></div><div className="site-media-grid">{media.map((asset) => <button className="site-media-choice" type="button" key={asset.id} onClick={() => chooseMedia(asset)}><img src={asset.url} alt={asset.alt || asset.name} /><span>{asset.name}</span></button>)}</div></div></div>}
  </div>;
}
