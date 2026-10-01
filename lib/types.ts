export type CardLayout = "wide" | "portrait" | "landscape";

export type GalleryImage = {
  url: string;
  alt: string;
  caption: string;
};

export type SectionImage = GalleryImage & {
  sectionId: string;
};

export type Project = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  cardHeadline: string;
  tags: string[];
  projectType: string;
  platform: string;
  role: string;
  focus: string;
  statusLabel: string;
  year: string;
  cardLayout: CardLayout;
  cardImageUrl: string;
  cardImageAlt: string;
  heroImageUrl: string;
  heroImageAlt: string;
  galleryImages: GalleryImage[];
  sectionImages: SectionImage[];
  accentColor: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  contentMarkdown: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  hasUnpublishedChanges?: boolean;
};

export type ProjectInput = Omit<
  Project,
  "id" | "createdAt" | "updatedAt" | "publishedAt" | "hasUnpublishedChanges"
>;
