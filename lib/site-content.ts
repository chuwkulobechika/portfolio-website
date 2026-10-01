export type LinkItem = { label: string; href: string };
export type ImageField = { url: string; alt: string };
export type SeoFields = { title: string; description: string; socialImageUrl: string };
export type ServiceItem = {
  title: string;
  description: string;
  detail: string;
  image: ImageField;
};
export type StudioExperiment = {
  title: string;
  description: string;
  category: string;
  image: ImageField;
};
export type TextFeature = { title: string; description: string };

export type HomeContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: ImageField;
  primaryCta: LinkItem;
  secondaryCta: LinkItem;
  positioningLead: string;
  positioningNote: string;
  workEyebrow: string;
  workTitle: string;
  studioEyebrow: string;
  studioTitle: string;
  studioDescription: string;
  studioCta: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  aboutFacts: string[];
  availability: string;
  contactTitle: string;
  contactDescription: string;
  contactButton: string;
};

export type ServicesContent = {
  title: string;
  introduction: string;
  items: ServiceItem[];
};

export type StudioContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: ImageField;
  heroPrimaryCta: string;
  experimentsTitle: string;
  experimentsDescription: string;
  experiments: StudioExperiment[];
  componentsTitle: string;
  componentsDescription: string;
  componentFeatures: TextFeature[];
  manifesto: string;
  practiceTitle: string;
  practiceDescription: string;
  practices: TextFeature[];
  contactEyebrow: string;
  contactTitle: string;
  contactButton: string;
};

export type NavigationContent = {
  portfolioWordmark: string;
  studioWordmark: string;
  primaryLinks: LinkItem[];
  headerCta: LinkItem;
  studioLinks: LinkItem[];
  footerExplore: LinkItem[];
  footerStudio: LinkItem[];
  socialLinks: LinkItem[];
  footerIdentity: string;
  footerSubtitle: string;
  footerWordmark: string;
  copyright: string;
};

export type SettingsContent = {
  contactEmail: string;
  homeSeo: SeoFields;
  studioSeo: SeoFields;
  themeColor: string;
};

export type SiteContentMap = {
  home: HomeContent;
  services: ServicesContent;
  studio: StudioContent;
  navigation: NavigationContent;
  settings: SettingsContent;
};

export type SiteContentKey = keyof SiteContentMap;

export const siteContentKeys: SiteContentKey[] = [
  "home",
  "services",
  "studio",
  "navigation",
  "settings",
];

export const defaultSiteContent: SiteContentMap = {
  home: {
    heroEyebrow: "Digital product designer",
    heroTitle: "Clarity, built into products.",
    heroDescription: "Product thinking, interface design, interaction, prototyping, and Framer development for mobile and web.",
    heroImage: {
      url: "/assets/hero-system.jpg",
      alt: "Abstract composition of glass, metal, and orange planes representing structure, interaction, and product craft",
    },
    primaryCta: { label: "Start a conversation", href: "#contact" },
    secondaryCta: { label: "View selected work", href: "#work" },
    positioningLead: "I stay close to the product, from the first useful question to the final interaction.",
    positioningNote: "The work combines systems thinking with an editorial eye. Clear enough to earn trust, expressive enough to be remembered.",
    workEyebrow: "Featured work and self-initiated concepts",
    workTitle: "The decisions are part of the design.",
    studioEyebrow: "Lowbe Studio",
    studioTitle: "The same foundation, with more room to experiment.",
    studioDescription: "Lowbe Studio is the freelance and experimental extension of Chukwulobe's practice: landing pages, Framer components, interaction studies, concepts, and small digital products.",
    studioCta: "Enter the studio",
    aboutTitle: "A designer who stays close to the product.",
    aboutParagraphs: [
      "Chukwulobe Chikadibia is a digital product designer working across mobile and web. His practice combines product thinking, interface design, interaction, prototyping, and Framer development.",
      "He moves comfortably between focused studio work and full-time product environments, translating early ideas into interfaces that feel considered, useful, and ready to build.",
    ],
    aboutFacts: ["Mobile and web", "Product and visual systems", "Prototypes and interaction", "Framer builds"],
    availability: "Open to full-time and select freelance work",
    contactTitle: "Have a product, role, or partnership in mind?",
    contactDescription: "Share the context and where the work stands. A clear first note is enough.",
    contactButton: "Start a conversation",
  },
  services: {
    title: "Five ways I move a product forward.",
    introduction: "Strategy and execution stay connected, so the final interface still carries the intent that started the project.",
    items: [
      { title: "Product thinking", description: "Clarify the opportunity, shape requirements, and turn ambiguity into a useful product direction.", detail: "Framing, flows, product definition", image: { url: "/assets/lifevault-study.jpg", alt: "LifeVault product thinking and information architecture study" } },
      { title: "Mobile product design", description: "Design touch-first flows and interfaces that remain direct when the product becomes complex.", detail: "UX, interface systems, prototypes", image: { url: "/assets/swapxnext-study.jpg", alt: "SwapXNext mobile interface and interaction study" } },
      { title: "Web product design", description: "Build responsive product surfaces with clear navigation, useful hierarchy, and a considered visual system.", detail: "Web apps, responsive systems, design systems", image: { url: "/assets/brand-explorations.jpg", alt: "LightWork AI and Orivfy responsive web explorations" } },
      { title: "Interaction and prototyping", description: "Make behavior tangible before development commits to it, from small feedback to complete product flows.", detail: "Motion logic, high-fidelity prototypes", image: { url: "/assets/hero-system.jpg", alt: "Abstract planes illustrating interaction layers and prototype logic" } },
      { title: "Framer development", description: "Translate a visual direction into a polished, responsive site with motion that earns its place.", detail: "Marketing sites, portfolios, experiments", image: { url: "/assets/brand-explorations.jpg", alt: "Art-directed Framer-ready launch page compositions" } },
    ],
  },
  studio: {
    heroEyebrow: "Independent experimental practice",
    heroTitle: "Lowbe Studio",
    heroDescription: "Visual systems, Framer components, interaction studies, landing pages, and small digital products.",
    heroImage: { url: "/assets/lowbe-hero.jpg", alt: "Folded smoked glass and brushed metal forming a precise abstract studio object" },
    heroPrimaryCta: "Explore the work",
    experimentsTitle: "Work made to test a sharper idea.",
    experimentsDescription: "Self-directed studies that move between visual identity, interface behavior, responsive systems, and launch storytelling.",
    experiments: [
      { title: "Tension Engine", description: "An interaction study about momentum, resistance, and the point where motion becomes feedback.", category: "Motion system", image: { url: "/assets/lowbe-tension.jpg", alt: "Smoked glass bands moving through precision metal frames" } },
      { title: "Adaptive Assembly", description: "A modular component language built to stretch across compact and expressive compositions.", category: "Component study", image: { url: "/assets/lowbe-assembly.jpg", alt: "Layered translucent planes and an orange tension surface in a modular installation" } },
      { title: "Signal Pages", description: "Landing-page directions where typography, product proof, and motion share one clear rhythm.", category: "Web exploration", image: { url: "/assets/brand-explorations.jpg", alt: "Editorial web and brand compositions for two digital product concepts" } },
    ],
    componentsTitle: "Components should reveal how they feel.",
    componentsDescription: "Small working studies for type, state, and physical response. Designed as reusable behavior, not static decoration.",
    componentFeatures: [
      { title: "Variable type axis", description: "Live control" },
      { title: "Responsive state", description: "Three moments" },
      { title: "Direct response", description: "Pointer and touch" },
    ],
    manifesto: "Lowbe exists because not every good idea should begin with a brief. Some ideas need to be stretched, prototyped, broken, and rebuilt before they become useful. The studio gives those ideas room to move.",
    practiceTitle: "What lives here.",
    practiceDescription: "Same foundation, more freedom. The studio pushes typography, composition, color, and interaction while keeping the work useful.",
    practices: [
      { title: "Components", description: "Framer components, responsive modules, and behavior studies that can become working systems." },
      { title: "Launches", description: "Landing pages and campaign surfaces with a focused message and a memorable visual position." },
      { title: "Concepts", description: "Mini products and early ideas shaped far enough to test their purpose, structure, and tone." },
      { title: "Explorations", description: "Type, motion, image, and interface experiments that build a wider design vocabulary." },
    ],
    contactEyebrow: "Selected freelance projects and partnerships",
    contactTitle: "Bring the idea that needs more room.",
    contactButton: "Start a conversation",
  },
  navigation: {
    portfolioWordmark: "Chukwulobe Chikadibia",
    studioWordmark: "Lowbe Studio",
    primaryLinks: [
      { label: "Work", href: "#work" },
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Lowbe Studio", href: "/studio/" },
    ],
    headerCta: { label: "Start a conversation", href: "#contact" },
    studioLinks: [
      { label: "Experiments", href: "#experiments" },
      { label: "Components", href: "#components" },
      { label: "Why Lowbe", href: "#reason" },
    ],
    footerExplore: [
      { label: "Selected work", href: "#work" },
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
    ],
    footerStudio: [
      { label: "Lowbe Studio", href: "/studio/" },
      { label: "Back to top", href: "#top" },
    ],
    socialLinks: [],
    footerIdentity: "Chukwulobe Chikadibia",
    footerSubtitle: "Digital product designer",
    footerWordmark: "Chukwulobe",
    copyright: "© 2026 Chukwulobe Chikadibia",
  },
  settings: {
    contactEmail: "hello@chukwulobechikadibia.com",
    homeSeo: {
      title: "Chukwulobe Chikadibia | Digital Product Designer",
      description: "Chukwulobe Chikadibia designs thoughtful mobile products, web experiences, interaction systems, and Framer builds.",
      socialImageUrl: "",
    },
    studioSeo: {
      title: "Lowbe Studio | Experiments by Chukwulobe Chikadibia",
      description: "Lowbe Studio is Chukwulobe Chikadibia's experimental practice for design components, Framer studies, landing pages, interaction systems, and small digital products.",
      socialImageUrl: "",
    },
    themeColor: "#050505",
  },
};
