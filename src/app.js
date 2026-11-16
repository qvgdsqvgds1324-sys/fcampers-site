document.documentElement.classList.add("js");

import Lenis from "lenis";
import Swiper from "swiper";
import { Navigation, Pagination, A11y, Keyboard } from "swiper/modules";
import { animate, stagger } from "animejs";

/* ---------- Bitrix24 CRM lead endpoint (same operator, RF datacenter) ---------- */
const LEAD_ENDPOINT = "https://familycampers.bitrix24.ru/rest/12/brdaq9h353en619p/";

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

    const payload = {
      fields: {
        TITLE: "Заявка с сайта (главная)",
        NAME: name,
        PHONE: [{ VALUE: phone, VALUE_TYPE: "WORK" }],
        COMMENTS: comment || "—",
        SOURCE_DESCRIPTION: "Сайт fcampers — главная страница",
        EMAIL: [{ VALUE: "familycampers@ya.ru", VALUE_TYPE: "WORK" }],
      },
    };

    let sent = false;
    try {
      const res = await fetch(LEAD_ENDPOINT + "crm.lead.add.json", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      sent = res.ok && data && data.result > 0;
    } catch (err) {
      try {
        const body = new URLSearchParams();
        body.append("fields[TITLE]", payload.fields.TITLE);
        body.append("fields[NAME]", payload.fields.NAME);
        body.append("fields[PHONE][0][VALUE]", phone);
        body.append("fields[PHONE][0][VALUE_TYPE]", "WORK");
        body.append("fields[COMMENTS]", payload.fields.COMMENTS);
        body.append("fields[EMAIL][0][VALUE]", "familycampers@ya.ru");
        body.append("fields[EMAIL][0][VALUE_TYPE]", "WORK");
        body.append("fields[SOURCE_DESCRIPTION]", payload.fields.SOURCE_DESCRIPTION);
        await fetch(LEAD_ENDPOINT + "crm.lead.add.json", { method: "POST", mode: "no-cors", body });
        sent = true;
      } catch (err2) {
        sent = false;
      }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = prev; }
    }

    if (sent) {
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
