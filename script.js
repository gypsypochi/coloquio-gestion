const body = document.body;
const toggleViewBtn = document.getElementById("toggleViewBtn");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const printBtn = document.getElementById("printBtn");
const resetProgressBtn = document.getElementById("resetProgressBtn");
const viewStatus = document.getElementById("viewStatus");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const practiceBlocksText = document.getElementById("practiceBlocksText");
const practiceProgressFill = document.getElementById("practiceProgressFill");
const mainLayout = document.querySelector(".layout");
const checks = Array.from(document.querySelectorAll(".progress-check"));
const scriptCards = Array.from(document.querySelectorAll(".script-card"));
const practiceButtons = Array.from(document.querySelectorAll(".script-card__button"));
const scriptHeaders = Array.from(document.querySelectorAll(".script-card__header"));

const STORAGE_KEYS = {
  view: "coloquio-view-mode",
  theme: "coloquio-theme-mode",
  checks: "coloquio-progress-checks",
  practicedSlides: "coloquio-practiced-slides",
  openSlides: "coloquio-open-slides"
};

function safeStorageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Ignorar errores de almacenamiento para no romper la visualizacion.
  }
}

function safeStorageRemove(key) {
  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    // Ignorar errores de almacenamiento para no romper la visualizacion.
  }
}

function setView(mode, persist = true) {
  const normalizedMode = mode === "summary" ? "summary" : "full";
  const isSummary = normalizedMode === "summary";

  document.documentElement.classList.remove("is-summary");
  body.classList.remove("is-summary");
  mainLayout?.classList.remove("is-summary");

  if (isSummary) {
    body.classList.add("is-summary");
  }

  toggleViewBtn?.setAttribute("aria-pressed", String(!isSummary));
  if (toggleViewBtn) {
    toggleViewBtn.textContent = isSummary ? "Ver guion completo" : "Ver resumen";
  }

  if (viewStatus) {
    viewStatus.textContent = `Vista actual: ${isSummary ? "resumen" : "guion completo"}`;
  }

  console.log(`Modo actual del guion: ${normalizedMode}`);

  if (persist) {
    safeStorageSet(STORAGE_KEYS.view, normalizedMode);
  }
}

function setTheme(mode, persist = true) {
  const normalizedMode = mode === "dark" ? "dark" : "light";
  const isDark = normalizedMode === "dark";

  body.classList.toggle("dark-mode", isDark);

  if (themeToggleBtn) {
    themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    themeToggleBtn.setAttribute("data-theme", normalizedMode);
    themeToggleBtn.setAttribute("title", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }

  if (persist) {
    safeStorageSet(STORAGE_KEYS.theme, normalizedMode);
  }
}

function updateChecklistProgress() {
  const total = checks.length;
  const completed = checks.filter((check) => check.checked).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  if (progressText) {
    progressText.textContent = `${percentage}%`;
  }

  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }

  const storedChecks = checks.map((check) => check.checked);
  safeStorageSet(STORAGE_KEYS.checks, JSON.stringify(storedChecks));
}

function setPracticedState(card, isPracticed) {
  const button = card.querySelector(".script-card__button");

  card.classList.toggle("is-practiced", isPracticed);
  card.setAttribute("data-practiced", String(isPracticed));

  if (button) {
    button.textContent = isPracticed ? "Practicado" : "Marcar como practicado";
    button.classList.toggle("is-active", isPracticed);
    button.setAttribute("aria-pressed", String(isPracticed));
  }
}

function setAccordionState(card, isOpen) {
  const header = card.querySelector(".script-card__header");
  const chevron = card.querySelector(".script-card__chevron");

  card.classList.toggle("is-open", isOpen);

  if (header) {
    header.setAttribute("aria-expanded", String(isOpen));
  }

  if (chevron) {
    chevron.textContent = isOpen ? "\u25B2" : "\u25BC";
  }
}

function updateOpenSlidesStorage() {
  const openSlides = scriptCards
    .filter((card) => card.classList.contains("is-open"))
    .map((card) => Number(card.dataset.slide));

  safeStorageSet(STORAGE_KEYS.openSlides, JSON.stringify(openSlides));
}

function updatePracticeProgress() {
  const practicedCards = scriptCards.filter((card) => card.classList.contains("is-practiced")).length;
  const totalCards = scriptCards.length;
  const percentage = totalCards === 0 ? 0 : Math.round((practicedCards / totalCards) * 100);
  const practicedSlides = scriptCards
    .filter((card) => card.classList.contains("is-practiced"))
    .map((card) => Number(card.dataset.slide));

  if (practiceBlocksText) {
    practiceBlocksText.textContent = `Bloques practicados: ${practicedCards} de ${totalCards}`;
  }

  if (practiceProgressFill) {
    practiceProgressFill.style.width = `${percentage}%`;
  }

  safeStorageSet(STORAGE_KEYS.practicedSlides, JSON.stringify(practicedSlides));
}

function loadProgress() {
  let savedChecks = [];
  let savedPracticedSlides = [];
  let savedView = "full";
  let savedOpenSlides = [1];
  let savedTheme = "light";

  try {
    savedChecks = JSON.parse(safeStorageGet(STORAGE_KEYS.checks) || "[]");
  } catch (error) {
    savedChecks = [];
  }

  checks.forEach((check, index) => {
    check.checked = Boolean(savedChecks[index]);
  });

  try {
    savedPracticedSlides = JSON.parse(safeStorageGet(STORAGE_KEYS.practicedSlides) || "[]");
  } catch (error) {
    savedPracticedSlides = [];
  }

  scriptCards.forEach((card) => {
    const slideNumber = Number(card.dataset.slide);
    setPracticedState(card, savedPracticedSlides.includes(slideNumber));
  });

  try {
    savedOpenSlides = JSON.parse(safeStorageGet(STORAGE_KEYS.openSlides) || "[1]");
  } catch (error) {
    savedOpenSlides = [1];
  }

  if (!Array.isArray(savedOpenSlides) || savedOpenSlides.length === 0) {
    savedOpenSlides = [1];
  }

  scriptCards.forEach((card, index) => {
    const slideNumber = Number(card.dataset.slide);
    const isOpen = savedOpenSlides.includes(slideNumber) || (!savedOpenSlides.length && index === 0);
    setAccordionState(card, isOpen);
  });

  savedView = safeStorageGet(STORAGE_KEYS.view);
  if (savedView !== "full" && savedView !== "summary") {
    savedView = "full";
  }

  savedTheme = safeStorageGet(STORAGE_KEYS.theme);
  if (savedTheme !== "light" && savedTheme !== "dark") {
    savedTheme = "light";
  }

  setTheme(savedTheme);
  setView(savedView);
  updateChecklistProgress();
  updatePracticeProgress();
}

toggleViewBtn?.addEventListener("click", () => {
  const nextMode = body.classList.contains("is-summary") ? "full" : "summary";
  setView(nextMode);
});

printBtn?.addEventListener("click", () => {
  window.print();
});

resetProgressBtn?.addEventListener("click", () => {
  checks.forEach((check) => {
    check.checked = false;
  });

  scriptCards.forEach((card) => {
    setPracticedState(card, false);
  });

  safeStorageRemove(STORAGE_KEYS.checks);
  safeStorageRemove(STORAGE_KEYS.practicedSlides);
  safeStorageRemove(STORAGE_KEYS.view);
  safeStorageRemove(STORAGE_KEYS.openSlides);
  scriptCards.forEach((card, index) => {
    setAccordionState(card, index === 0);
  });
  setView("full", false);
  updateChecklistProgress();
  updatePracticeProgress();
});

themeToggleBtn?.addEventListener("click", () => {
  const nextTheme = body.classList.contains("dark-mode") ? "light" : "dark";
  setTheme(nextTheme);
});

checks.forEach((check) => {
  check.addEventListener("change", updateChecklistProgress);
});

practiceButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".script-card");
    if (!card) {
      return;
    }

    const isPracticed = !card.classList.contains("is-practiced");
    setPracticedState(card, isPracticed);
    updatePracticeProgress();
  });
});

scriptHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const card = header.closest(".script-card");
    if (!card) {
      return;
    }

    const isOpen = !card.classList.contains("is-open");
    setAccordionState(card, isOpen);
    updateOpenSlidesStorage();
  });
});

loadProgress();
