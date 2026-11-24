document.documentElement.classList.add("js");

import Lenis from "lenis";
import Swiper from "swiper";
import { Navigation, Pagination, A11y, Keyboard } from "swiper/modules";
import { animate, stagger } from "animejs";

/* ---------- Bitrix24 CRM lead endpoint (same operator, RF datacenter) ---------- */
const API_ENDPOINT = "https://api.familycampers.ru/lead.php";

/* ---------- smooth scroll ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: true, smoothWheel: true, duration: 1.05 });
  lenis.on("scroll", () => {});
}

/* anchor links through Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (!id || id === "#") return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -80 });
    else target.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* ---------- mobile menu ---------- */
const burger = document.getElementById("burger");
const mobileMenu = document.getElementById("mobileMenu");
if (burger && mobileMenu) {
  const setOpen = (open) => {
    mobileMenu.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setOpen(mobileMenu.hidden));
  mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
}

/* ---------- gallery ---------- */
const galleryEl = document.querySelector(".gallery-swiper");
if (galleryEl) {
  new Swiper(galleryEl, {
    modules: [Navigation, Pagination, A11y, Keyboard],
    slidesPerView: 1,
    spaceBetween: 0,
    loop: true,
    keyboard: { enabled: true },
    navigation: { nextEl: ".gallery-next", prevEl: ".gallery-prev" },
    pagination: { el: ".gallery-pagination", clickable: true },
    a11y: { enabled: true },
  });
}

/* ---------- reveal on scroll (anime.js) ---------- */
const revealEls = document.querySelectorAll(".reveal");
if (revealEls.length) {
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        el.classList.add("is-in");
        animate(el, {
          opacity: [0, 1],
          translateY: [18, 0],
          duration: 620,
          ease: "outQuad",
          delay: stagger(70),
        });
        io.unobserve(el);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  }
}

/* ---------- lead form ---------- */
const form = document.getElementById("leadForm");
if (form) {
  const okBox = document.getElementById("formOk");
  const errBox = document.getElementById("formErr");

  const show = (node, text) => {
    if (!node) return;
    if (text) node.textContent = text;
    node.hidden = false;
  };
  const hide = (node) => { if (node) node.hidden = true; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hide(okBox);
    hide(errBox);

    if (form.botcheck && form.botcheck.checked) return;

    const name = (form.name?.value || "").trim();
    const phone = (form.phone?.value || "").trim();
    const comment = (form.comment?.value || "").trim();
    const consent = form.consent;
    if (consent && !consent.checked) {
      show(errBox, "Отметьте согласие на обработку персональных данных.");
      return;
    }
    if (name.length < 2 || phone.length < 6) {
      show(errBox, "Укажите имя и телефон.");
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    const prev = btn ? btn.textContent : "";
    if (btn) { btn.disabled = true; btn.textContent = "Отправляем…"; }

    const utm = (window.fcUtm && window.fcUtm()) || {};
    const src = ["Сайт fcampers — главная", utm.LANDING ? "страница: " + utm.LANDING : ""]
      .filter(Boolean).join(" | ");

    const payload = {
      type: "lead",
      fields: {
        TITLE: "Заявка с сайта (главная)",
        NAME: name,
        PHONE: [{ VALUE: phone, VALUE_TYPE: "WORK" }],
        COMMENTS: comment || "—",
        SOURCE_ID: "WEB",
        SOURCE_DESCRIPTION: src.slice(0, 255),
        UTM_SOURCE: utm.UTM_SOURCE || "",
        UTM_MEDIUM: utm.UTM_MEDIUM || "",
        UTM_CAMPAIGN: utm.UTM_CAMPAIGN || "",
        UTM_CONTENT: utm.UTM_CONTENT || "",
        UTM_TERM: utm.UTM_TERM || "",
        EMAIL: [{ VALUE: "familycampers@ya.ru", VALUE_TYPE: "WORK" }],
      },
      tg_text: [
        "Новая заявка с сайта (главная)",
        "",
        `Имя: ${name}`,
        `Телефон: ${phone}`,
        `Комментарий: ${comment || "—"}`,
        `Время: ${new Date().toLocaleString("ru-RU")}`,
      ].join("\n"),
    };

    let sent = false;
    try {
      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      sent = res.ok && data && data.ok === true;
    } catch (err) {
      sent = false;
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
    }

    if (sent) {
      if (window.fcGoal) window.fcGoal("form_lead_main");
      form.reset();
      show(okBox, "Заявка отправлена. Свяжемся в рабочее время.");
    } else {
      show(errBox, "Не удалось отправить. Позвоните: +7 (499) 638-24-05.");
    }
  });
}

/* ---------- footer year ---------- */
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = String(new Date().getFullYear()); });

/* ---------- consent modal ---------- */
const consentModal = document.getElementById("consentModal");
if (consentModal) {
  const box = consentModal.querySelector(".consent-modal__box");
  const openConsent = () => {
    consentModal.hidden = false;
    document.body.style.overflow = "hidden";
    consentModal.querySelector("[data-consent-accept]")?.focus();
  };
  const closeConsent = () => {
    consentModal.hidden = true;
    document.body.style.overflow = "";
  };
  document.querySelectorAll("[data-consent-open]").forEach((el) => {
    el.addEventListener("click", (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      openConsent();
    });
  });
  consentModal.querySelectorAll("[data-consent-close]").forEach((el) => el.addEventListener("click", closeConsent));
  consentModal.addEventListener("click", (e) => { if (e.target === consentModal) closeConsent(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !consentModal.hidden) closeConsent(); });
  consentModal.querySelector("[data-consent-accept]")?.addEventListener("click", () => {
    const cb = document.querySelector('#leadForm input[name="consent"]');
    if (cb) cb.checked = true;
    closeConsent();
  });
  box?.addEventListener("touchstart", () => {}, { passive: true });
}
