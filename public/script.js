const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const menuButton = document.querySelector("[data-menu-button]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const form = document.querySelector("[data-contact-form]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const storedTheme = localStorage.getItem("cc-theme");
if (storedTheme === "light" || storedTheme === "dark") {
  root.dataset.theme = storedTheme;
}

requestAnimationFrame(() => root.classList.add("is-ready"));

themeToggle?.addEventListener("click", () => {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = root.dataset.theme ? root.dataset.theme === "dark" : systemDark;
  const nextTheme = isDark ? "light" : "dark";
  root.dataset.theme = nextTheme;
  localStorage.setItem("cc-theme", nextTheme);
  themeToggle.setAttribute("aria-label", `Switch to ${nextTheme === "dark" ? "light" : "dark"} theme`);
});

function closeMenu() {
  if (!mobileMenu || !menuButton) return;
  mobileMenu.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

menuButton?.addEventListener("click", () => {
  const willOpen = mobileMenu.hidden;
  mobileMenu.hidden = !willOpen;
  menuButton.setAttribute("aria-expanded", String(willOpen));
  document.body.classList.toggle("menu-open", willOpen);
});

mobileMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

const revealItems = document.querySelectorAll(".reveal-item");
if (reducedMotion.matches) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.22 }
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

const serviceSteps = [...document.querySelectorAll("[data-service-step]")];
const serviceVisuals = [...document.querySelectorAll("[data-service-visual]")];

function setActiveService(index) {
  serviceSteps.forEach((step) => step.classList.toggle("is-current", step.dataset.serviceStep === index));
  serviceVisuals.forEach((visual) => {
    const isActive = visual.dataset.serviceVisual === index;
    visual.classList.toggle("is-active", isActive);
    visual.setAttribute("aria-hidden", String(!isActive));
  });
}

if (serviceSteps.length && serviceVisuals.length) {
  const serviceObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveService(visible.target.dataset.serviceStep);
    },
    { rootMargin: "-32% 0px -42% 0px", threshold: [0.1, 0.35, 0.6] }
  );
  serviceSteps.forEach((step) => serviceObserver.observe(step));
}

const caseSections = [...document.querySelectorAll("[data-case-section]")];
const caseLinks = [...document.querySelectorAll("[data-case-link]")];

function setActiveCaseChapter(chapter) {
  caseLinks.forEach((link) => {
    const isActive = link.dataset.caseLink === chapter;
    link.classList.toggle("is-active", isActive);
    if (isActive) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}

if (caseSections.length && caseLinks.length) {
  setActiveCaseChapter(caseSections[0].dataset.caseSection);
  const caseObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveCaseChapter(visible.target.dataset.caseSection);
    },
    { rootMargin: "-18% 0px -62% 0px", threshold: [0.05, 0.2, 0.5] }
  );
  caseSections.forEach((section) => caseObserver.observe(section));
}

const typeAxis = document.querySelector("[data-type-axis]");
const typeSample = document.querySelector("[data-type-sample]");
if (typeAxis && typeSample) {
  const updateTypeSample = () => {
    const progress = Number(typeAxis.value) / 100;
    const weight = Math.round(420 + progress * 340);
    const tracking = -0.035 - progress * 0.045;
    typeSample.style.setProperty("--sample-weight", weight);
    typeSample.style.setProperty("--sample-tracking", `${tracking.toFixed(3)}em`);
    typeAxis.setAttribute("aria-valuetext", `${Math.round(progress * 100)} percent expressive`);
  };
  typeAxis.addEventListener("input", updateTypeSample);
  updateTypeSample();
}

const stateTabs = [...document.querySelectorAll("[data-state-tab]")];
const stateDemo = document.querySelector("[data-state-demo]");
const stateCopy = document.querySelector("[data-state-copy]");
const componentStates = {
  rest: "Quiet until the interaction needs attention.",
  hover: "A small directional cue makes the next action clear.",
  press: "Immediate compression confirms the input before release.",
};

if (stateTabs.length && stateDemo && stateCopy) {
  stateTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const nextState = tab.dataset.stateTab;
      stateTabs.forEach((item) => item.setAttribute("aria-pressed", String(item === tab)));
      stateDemo.dataset.componentState = nextState;
      stateCopy.textContent = componentStates[nextState];
    });
  });
}

const scrollStatement = document.querySelector("[data-scroll-statement]");
if (scrollStatement) {
  const words = [...scrollStatement.querySelectorAll("[data-scroll-word]")];
  words.forEach((word, index) => {
    word.style.setProperty("--word-index", index);
    word.style.setProperty("--word-start", `${10 + index * 1.7}%`);
    word.style.setProperty("--word-end", `${16 + index * 1.7}%`);
  });

  if (!CSS.supports("animation-timeline: view()")) {
    const statementObserver = new IntersectionObserver(
      ([entry]) => scrollStatement.classList.toggle("is-lit", entry.isIntersecting),
      { rootMargin: "-28% 0px -28% 0px", threshold: 0.15 }
    );
    statementObserver.observe(scrollStatement);
  }
}

const tiltSurface = document.querySelector("[data-tilt]");
if (tiltSurface && !reducedMotion.matches && window.matchMedia("(pointer: fine)").matches) {
  let frameId = 0;
  let targetX = 0;
  let targetY = 0;

  const updateTilt = () => {
    tiltSurface.style.setProperty("--tilt-x", `${targetX.toFixed(2)}deg`);
    tiltSurface.style.setProperty("--tilt-y", `${targetY.toFixed(2)}deg`);
    frameId = 0;
  };

  tiltSurface.addEventListener("pointermove", (event) => {
    const bounds = tiltSurface.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
    targetX = normalizedX * 3;
    targetY = normalizedY * -3;
    if (!frameId) frameId = requestAnimationFrame(updateTilt);
  });

  tiltSurface.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    if (!frameId) frameId = requestAnimationFrame(updateTilt);
  });
}

function showError(field, message) {
  field.setAttribute("aria-invalid", "true");
  field.setAttribute("aria-describedby", `${field.id}-error`);
  document.getElementById(`${field.id}-error`).textContent = message;
}

function clearError(field) {
  field.removeAttribute("aria-invalid");
  field.removeAttribute("aria-describedby");
  const error = document.getElementById(`${field.id}-error`);
  if (error) error.textContent = "";
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = form.elements.name;
  const email = form.elements.email;
  const brief = form.elements.brief;
  const company = form.elements.company;
  const status = form.querySelector("[data-form-status]");
  let valid = true;

  [name, email, brief].forEach(clearError);
  status.textContent = "";

  if (!name.value.trim()) {
    showError(name, "Please add your name.");
    valid = false;
  }

  if (!email.validity.valid || !email.value.trim()) {
    showError(email, "Please add a valid email address.");
    valid = false;
  }

  if (!brief.value.trim()) {
    showError(brief, "Please share a little about the work.");
    valid = false;
  }

  if (!valid) {
    form.querySelector("[aria-invalid='true']")?.focus();
    status.textContent = "Please check the highlighted fields.";
    return;
  }

  const subject = encodeURIComponent(`Project conversation from ${name.value.trim()}`);
  const body = encodeURIComponent(
    `Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\nCompany: ${company.value.trim() || "Not provided"}\n\nProject context:\n${brief.value.trim()}`
  );
  status.textContent = "Opening your email app with this note ready to send.";
  const contactEmail = form.dataset.contactEmail || "hello@chukwulobechikadibia.com";
  window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
});
