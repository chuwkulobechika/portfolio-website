import type { SectionImage } from "@/lib/types";

export type MarkdownResult = {
  html: string;
  toc: Array<{ id: string; label: string }>;
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return escapeHtml(trimmed);
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:" ? escapeHtml(url.toString()) : "#";
  } catch {
    return "#";
  }
}

function inline(value: string): string {
  let result = escapeHtml(value);
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, url) =>
    `<img src="${safeUrl(url)}" alt="${alt}" loading="lazy" />`,
  );
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, url) =>
    `<a href="${safeUrl(url)}" rel="noreferrer">${label}</a>`,
  );
  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");
  result = result.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return result;
}

function headingId(label: string, seen: Map<string, number>): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function sectionMediaMarkup(images: SectionImage[]): string {
  const valid = images.filter((image) => image.url.trim());
  if (!valid.length) return "";
  return `<div class="case-section-media">
    ${valid
      .map(
        (image) => `<figure><img src="${safeUrl(image.url)}" alt="${escapeHtml(image.alt)}" loading="lazy" />${image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""}</figure>`,
      )
      .join("\n")}
  </div>`;
}

export function renderMarkdown(markdown: string, sectionImages: SectionImage[] = []): MarkdownResult {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const output: string[] = [];
  const toc: MarkdownResult["toc"] = [];
  const seen = new Map<string, number>();
  let paragraph: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let sectionOpen = false;
  let currentSectionId = "";

  const flushParagraph = () => {
    if (!paragraph.length) return;
    output.push(`<p>${inline(paragraph.join(" "))}</p>`);
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    output.push(`</${listType}>`);
    listType = null;
  };
  const closeSection = () => {
    if (!sectionOpen) return;
    output.push(sectionMediaMarkup(sectionImages.filter((image) => image.sectionId === currentSectionId)));
    output.push("</section>");
    sectionOpen = false;
    currentSectionId = "";
  };

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const unordered = line.match(/^[-*]\s+(.+)/);
    const ordered = line.match(/^\d+\.\s+(.+)/);
    const quote = line.match(/^>\s?(.+)/);

    if (h2) {
      flushParagraph();
      closeList();
      closeSection();
      const id = headingId(h2[1], seen);
      toc.push({ id, label: h2[1] });
      output.push(`<section class="case-section" id="${id}" data-case-section>`);
      output.push(`<p class="chapter-label">${String(toc.length).padStart(2, "0")}</p>`);
      output.push(`<h2>${inline(h2[1])}</h2>`);
      sectionOpen = true;
      currentSectionId = id;
      continue;
    }
    if (h3) {
      flushParagraph();
      closeList();
      output.push(`<h3>${inline(h3[1])}</h3>`);
      continue;
    }
    if (unordered || ordered) {
      flushParagraph();
      const nextType = unordered ? "ul" : "ol";
      if (listType !== nextType) {
        closeList();
        listType = nextType;
        output.push(`<${listType}>`);
      }
      output.push(`<li>${inline((unordered ?? ordered)![1])}</li>`);
      continue;
    }
    if (quote) {
      flushParagraph();
      closeList();
      output.push(`<blockquote class="case-pull">${inline(quote[1])}</blockquote>`);
      continue;
    }
    if (!line.trim()) {
      flushParagraph();
      closeList();
      continue;
    }
    paragraph.push(line.trim());
  }

  flushParagraph();
  closeList();
  closeSection();
  if (!output.length) {
    output.push('<section class="case-section"><p>This case study is being prepared.</p></section>');
  }
  return { html: output.join("\n"), toc };
}
