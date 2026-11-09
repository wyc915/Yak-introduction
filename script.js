const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

document.getElementById("year").textContent = new Date().getFullYear();

/* ---------- 提示訊息 ---------- */
const toastEl = document.getElementById("toast");
let toastTimer;
const toast = (msg) => {
  toastEl.textContent = msg;
  toastEl.classList.add("is-show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-show"), 2000);
};

/* ---------- 標題拆字 ---------- */
const splitText = (el, text) => {
  el.setAttribute("aria-label", text);
  el.innerHTML = [...text]
    .map((c, i) => `<span class="ch" aria-hidden="true" style="--ci:${i}">${c === " " ? "&nbsp;" : c}</span>`)
    .join("");
};

/* ---------- 中 / 英切換 ---------- */
const EN = window.I18N_EN || {};
const ZH = { "meta.title": document.title, typed: ["派對有氧", "iPARTY", "K-pop MV", "兒童街舞"] };
const i18nEls = [...document.querySelectorAll("[data-i18n]")];
i18nEls.forEach((el) => {
  ZH[el.dataset.i18n] = el.classList.contains("split") ? el.textContent.trim() : el.innerHTML.trim();
});
let lang = root.getAttribute("data-lang") === "en" ? "en" : "zh";
const t = (key) => (lang === "en" && EN[key] != null ? EN[key] : ZH[key]);

const langBtn = document.getElementById("langToggle");
const applyLang = () => {
  root.lang = lang === "en" ? "en" : "zh-Hant";
  root.setAttribute("data-lang", lang);
  document.title = t("meta.title");
  i18nEls.forEach((el) => {
    const val = t(el.dataset.i18n);
    if (el.classList.contains("split")) splitText(el, val);
    else el.innerHTML = val;
  });
  langBtn.querySelector(".lang-label").textContent = lang === "en" ? "中" : "EN";
  langBtn.setAttribute("aria-label", lang === "en" ? "切換為中文" : "Switch to English");
};
applyLang();
langBtn.addEventListener("click", () => {
  lang = lang === "en" ? "zh" : "en";
  store.set("lang", lang);
  applyLang();
  restartTyping();
});

/* ---------- 深色 / 淺色 ---------- */
const darkMQ = window.matchMedia("(prefers-color-scheme: dark)");
const isDark = () => {
  const forced = root.getAttribute("data-theme");
  return forced ? forced === "dark" : darkMQ.matches;
};
const themeBtn = document.getElementById("themeToggle");
const syncThemeLabel = () =>
  themeBtn.setAttribute("aria-label", isDark() ? "切換淺色模式" : "切換深色模式");
syncThemeLabel();
themeBtn.addEventListener("click", () => {
  const next = isDark() ? "light" : "dark";
  root.setAttribute("data-theme", next);
  store.set("theme", next);
  syncThemeLabel();
});
darkMQ.addEventListener?.("change", syncThemeLabel);

/* ---------- 子元素依序編號 ---------- */
document.querySelectorAll("[data-stagger]").forEach((group) => {
  [...group.children].forEach((child, i) => child.style.setProperty("--i", i));
});

/* ---------- 打字效果 ---------- */
const typedEl = document.getElementById("typed");
let typeTimer;
const restartTyping = () => {
  clearTimeout(typeTimer);
  const words = t("typed");
  if (reduceMotion) { typedEl.textContent = words[0]; return; }
  let w = 0, c = 0, deleting = false;
  const tick = () => {
    const word = words[w];
    c += deleting ? -1 : 1;
    typedEl.textContent = word.slice(0, c);
    let delay = deleting ? 45 : 110;
    if (!deleting && c === word.length) { deleting = true; delay = 1700; }
    else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
    typeTimer = setTimeout(tick, delay);
  };
  typedEl.textContent = "";
  typeTimer = setTimeout(tick, 300);
};
setTimeout(restartTyping, 700);

/* ---------- 數字遞增 ---------- */
const countUp = (el) => {
  const to = Number(el.dataset.to);
  if (reduceMotion) { el.textContent = to.toLocaleString("en-US"); return; }
  const dur = 1400, start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US");
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

/* ---------- 進場觀察 ---------- */
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-in");
      el.querySelectorAll(".count").forEach(countUp);
      io.unobserve(el);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll("[data-anim], [data-stagger], .split, .job").forEach((el) => io.observe(el));

/* ---------- 導覽列 / 進度條 / 回頂端 / 時間軸 / 視差 ---------- */
const nav = document.getElementById("nav");
const progress = document.getElementById("progress");
const toTop = document.getElementById("toTop");
const timeline = document.getElementById("timeline");
const timelineFill = document.getElementById("timelineFill");
const heroInner = document.getElementById("heroInner");
let lastY = window.scrollY;
let ticking = false;

const onScroll = () => {
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;

  progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  nav.classList.toggle("is-scrolled", y > 20);
  nav.classList.toggle("is-hidden", y > lastY && y > 400 && !nav.classList.contains("menu-open"));
  toTop.classList.toggle("is-show", y > innerHeight * 0.8);

  const r = timeline.getBoundingClientRect();
  const p = (innerHeight * 0.65 - r.top) / r.height;
  timelineFill.style.transform = `scaleY(${Math.max(0, Math.min(1, p))})`;

  if (!reduceMotion && y < innerHeight) {
    heroInner.style.transform = `translateY(${y * 0.3}px)`;
    heroInner.style.opacity = String(Math.max(0, 1 - y / (innerHeight * 0.8)));
  }

  lastY = y;
  ticking = false;
};
window.addEventListener("scroll", () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- 手機版選單 ---------- */
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");
const closeMenu = () => {
  links.classList.remove("is-open");
  toggle.classList.remove("is-open");
  nav.classList.remove("menu-open");
};
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  toggle.classList.toggle("is-open", open);
  nav.classList.toggle("menu-open", open);
});
links.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

/* ---------- 導覽列高亮 ---------- */
const navAnchors = [...links.querySelectorAll("a")];
const sectionIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navAnchors.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${entry.target.id}`));
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
document.querySelectorAll("section[id]").forEach((s) => sectionIO.observe(s));

/* ---------- 複製 Email ---------- */
document.getElementById("copyMail").addEventListener("click", async (e) => {
  const email = e.currentTarget.dataset.email;
  try {
    await navigator.clipboard.writeText(email);
  } catch (err) {
    const tmp = Object.assign(document.createElement("textarea"), { value: email });
    document.body.appendChild(tmp); tmp.select();
    try { document.execCommand("copy"); } catch (e2) {}
    tmp.remove();
  }
  toast(lang === "en" ? EN["contact.copied"] : "已複製電話");
});

window.addEventListener("beforeprint", () => {
  document.querySelectorAll(".count").forEach((el) => (el.textContent = Number(el.dataset.to).toLocaleString("en-US")));
  document.querySelectorAll("[data-anim], [data-stagger], .split, .job").forEach((el) => el.classList.add("is-in"));
});

/* ---------- 滑鼠互動（僅桌機） ---------- */
if (finePointer && !reduceMotion) {
  const glow = document.getElementById("cursorGlow");
  const shapes = document.querySelectorAll(".shape");
  const portrait = document.getElementById("portrait");
  portrait.style.transition = "transform .6s cubic-bezier(.2,.7,.2,1)";

  window.addEventListener("mousemove", (e) => {
    document.body.classList.add("has-cursor");
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    const cx = e.clientX - innerWidth / 2;
    const cy = e.clientY - innerHeight / 2;
    shapes.forEach((s) => {
      const d = Number(s.dataset.depth);
      s.style.transform = `translate(${cx * d}px, ${cy * d}px)`;
    });
    portrait.style.transform =
      `perspective(1000px) rotateY(${cx / innerWidth * 8}deg) rotateX(${-cy / innerHeight * 8}deg) translate(${cx * -0.015}px, ${cy * -0.015}px)`;
  });
  document.addEventListener("mouseleave", () => document.body.classList.remove("has-cursor"));

  document.querySelectorAll(".tilt").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      card.classList.add("tilt-on");
      card.style.transform = `perspective(800px) rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 10}deg) translateY(-4px)`;
      card.style.setProperty("--mx", `${x * 100}%`);
      card.style.setProperty("--my", `${y * 100}%`);
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      setTimeout(() => card.classList.remove("tilt-on"), 150);
    });
  });

  document.querySelectorAll(".magnetic").forEach((btn) => {
    btn.addEventListener("mousemove", (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
    });
    btn.addEventListener("mouseleave", () => (btn.style.transform = ""));
  });
}
