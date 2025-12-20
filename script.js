/* ============================================================
   script.js - Robust replacement for My Bharat website
   - Universal modals (works with many HTML variants)
   - Slider init (home + festival)
   - Navbar toggle (mobile)
   - State search (if present)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------
     Helper utilities
  ------------------------------ */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function findModalByIds(...ids) {
    for (const id of ids) {
      if (!id) continue;
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function findFirst(root, selectors) {
    for (const s of selectors) {
      const el = root.querySelector(s);
      if (el) return el;
    }
    return null;
  }

  /* ------------------------------
     NAVBAR TOGGLE (mobile)
  ------------------------------ */
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("nav");
  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => nav.classList.toggle("open"));
  }

  /* ------------------------------
     UNIVERSAL SLIDER INIT
     - slideSelector: CSS selector for slides (e.g. ".slide")
     - prevSel / nextSel: prev/next button selectors
     - dotsContainerSel: selector for dots container
  ------------------------------ */
  function initSlider(slideSelector, prevSel, nextSel, dotsContainerSel, autoMs = 5000) {
    const slides = $$(slideSelector);
    if (!slides.length) return;

    const prevBtn = document.querySelector(prevSel);
    const nextBtn = document.querySelector(nextSel);
    const dotsContainer = document.querySelector(dotsContainerSel);
    let current = 0;
    let autoTimer = null;

    // create dots if container exists and no dots present
    if (dotsContainer && !dotsContainer.querySelectorAll(".dot").length) {
      slides.forEach((_, i) => {
        const d = document.createElement("div");
        d.className = "dot" + (i === 0 ? " active" : "");
        d.dataset.index = i;
        d.addEventListener("click", () => showSlide(i));
        dotsContainer.appendChild(d);
      });
    }

    const dots = dotsContainer ? Array.from(dotsContainer.querySelectorAll(".dot")) : [];

    function showSlide(index) {
      if (!slides.length) return;
      current = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === current));
      dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }

    function nextSlide() { showSlide(current + 1); }
    function prevSlide() { showSlide(current - 1); }

    nextBtn?.addEventListener("click", () => { nextSlide(); resetAuto(); });
    prevBtn?.addEventListener("click", () => { prevSlide(); resetAuto(); });

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    });

    function resetAuto() {
      if (!autoMs) return;
      if (autoTimer) clearInterval(autoTimer);
      autoTimer = setInterval(nextSlide, autoMs);
    }

    showSlide(0);
    resetAuto();
  }

  // Home slider and festival slider (if present)
  initSlider(".slide", ".slider-btn.prev", ".slider-btn.next", ".dots", 5000);
  initSlider(".festival-slide", ".festival-slider-btn.prev", ".festival-slider-btn.next", ".festival-dots", 5000);

  /* ------------------------------
     UNIVERSAL MODAL SETUP (robust)
     - accepts modalId variants and card selector
     Example calls:
       setupModal(['art-modal','artModal'], '.art-card')
  ------------------------------ */
  function setupModal(modalIdCandidates, cardSelector) {
    if (!modalIdCandidates) return;
    // modalIdCandidates can be string or array
    const ids = Array.isArray(modalIdCandidates) ? modalIdCandidates : [modalIdCandidates];
    const modal = findModalByIds(...ids);
    if (!modal) return;

    // find common parts (with fallbacks)
    const overlay = findFirst(modal, [".modal-overlay", ".overlay", ".modal-backdrop"]);
    const modalContent = findFirst(modal, [".modal-content", ".modal-body", ".modal-panel"]);
    const closeBtn = findFirst(modal, [".modal-close", ".close-btn", "button[aria-label='Close modal']"]);
    const modalImg = findFirst(modal, [".modal-image", "#modal-img", ".modal-image-wrap img", "img.modal-image"]);
    const modalTitle = findFirst(modal, [".modal-title", "#modal-title", "h2", "h3"]);
    const modalDesc = findFirst(modal, [".modal-desc", "#modal-desc", ".modal-info p", "p.modal-desc"]);

    // mark aria-hidden initially if not present
    if (!modal.hasAttribute("aria-hidden")) modal.setAttribute("aria-hidden", "true");

    function openModal(data = {}) {
      if (modalImg && data.img) modalImg.src = data.img;
      if (modalImg && data.img && data.title) modalImg.alt = data.title;
      if (modalTitle && data.title) modalTitle.textContent = data.title;
      if (modalDesc && data.desc) modalDesc.textContent = data.desc;
      modal.classList.add("open", "show");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      // set focus to close button if possible
      if (closeBtn) closeBtn.focus();
    }

    function closeModal() {
      modal.classList.remove("open", "show");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    // Attach to all cards matching selector (if any exist)
    const cards = Array.from(document.querySelectorAll(cardSelector || ""));
    cards.forEach(card => {
      card.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        // prefer data attributes, fallback to inner elements
        const img = card.dataset.img || card.querySelector("img")?.src || "";
        const title = card.dataset.title || card.querySelector("h3, .caption")?.textContent || card.getAttribute("aria-label") || "";
        // For multi-field descriptions (states page) try to build structured text
        let desc = card.dataset.desc || card.getAttribute("data-info") || "";
        // If card has specific state fields, include them
        const extras = [];
        if (card.dataset.culture) extras.push(`Culture: ${card.dataset.culture}`);
        if (card.dataset.lang) extras.push(`Languages: ${card.dataset.lang}`);
        if (card.dataset.govt) extras.push(`Government: ${card.dataset.govt}`);
        if (card.dataset.festivals) extras.push(`Festivals: ${card.dataset.festivals}`);
        if (card.dataset.facts) extras.push(`Facts: ${card.dataset.facts}`);
        if (extras.length && !desc) desc = extras.join(" \n\n ");
        else if (extras.length) desc = desc + (desc ? "\n\n" : "") + extras.join("\n\n");

        openModal({ img, title, desc });
      });
    });

    // overlay & close handling
    overlay?.addEventListener("click", closeModal);
    closeBtn?.addEventListener("click", closeModal);

    // prevent clicks inside modal content from bubbling to overlay
    modalContent?.addEventListener("click", (e) => e.stopPropagation());

    // Escape closes
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });
  }

  // Initialize modal pairs: try both ID naming conventions to be safe
  setupModal(["art-modal", "artModal"], ".art-card");
  setupModal(["cuisine-modal", "cuisineModal"], ".cuisine-card");
  setupModal(["festival-modal", "festivalModal"], ".festival-card");
  setupModal(["tourism-modal", "tourismModal"], ".tourism-card");
  setupModal(["stateModal", "state-modal", "states-modal"], ".state-card");

  /* ------------------------------
     STATE SEARCH (if stateSearch exists)
  ------------------------------ */
  const stateSearch = document.getElementById("stateSearch");
  if (stateSearch) {
    const tiles = Array.from(document.querySelectorAll(".state-card"));
    stateSearch.addEventListener("input", () => {
      const q = stateSearch.value.trim().toLowerCase();
      tiles.forEach(t => {
        const title = (t.dataset.title || "").toLowerCase();
        const tags = (
          (t.dataset.info || "") + " " +
          (t.dataset.culture || "") + " " +
          (t.dataset.lang || "") + " " +
          (t.dataset.festivals || "") + " " +
          (t.dataset.facts || "")
        ).toLowerCase();
        t.style.display = (!q || title.includes(q) || tags.includes(q)) ? "" : "none";
      });
    });
  }

  /* ------------------------------
     Tourism/Other page-specific: ensure tourism modal close button sits on top-right of image
     (if you rely on inline style tweaks, these JS adjustments make it consistent)
  ------------------------------ */
  const adjustCloseBtns = () => {
    $$(".modal-close").forEach(btn => {
      btn.style.position = "absolute";
      btn.style.top = "10px";
      btn.style.right = "12px";
      btn.style.zIndex = "40";
      // keep background/appearance minimal — visual styling is in CSS
      btn.setAttribute("aria-label", btn.getAttribute("aria-label") || "Close modal");
    });
  };
  adjustCloseBtns();

  /* ------------------------------
     NAV HIGHLIGHT (active link)
  ------------------------------ */
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach(link => {
    const href = link.getAttribute("href");
    if (!href) return;
    // compare filenames (handle index, trailing slashes)
    if (href === currentPage || href === ("./" + currentPage) || (href === "/" + currentPage)) {
      link.classList.add("active");
    }
  });

  /* ------------------------------
     Accessibility: allow Enter key on tiles to open modal
  ------------------------------ */
  ["art-card", "cuisine-card", "festival-card", "tourism-card", "state-card"].forEach(cls => {
    document.querySelectorAll("." + cls).forEach(el => {
      el.setAttribute("tabindex", "0");
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") el.click();
      });
    });
  });
});
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});
