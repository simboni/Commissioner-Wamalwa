/* ============================================================
   Commissioner Dr. Dennis Wamalwa — interactions
   Vanilla JS, no dependencies. Progressive enhancement.
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Theme toggle (persisted) ---- */
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("cw-theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}
  function toggleTheme() {
    var current = root.getAttribute("data-theme");
    if (!current) {
      current = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("cw-theme", next); } catch (e) {}
  }

  /* ---- Nav: scrolled state + mobile toggle ---- */
  var nav = document.querySelector(".nav");
  var navLinks = document.querySelector(".nav-links");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-theme-toggle]");
    if (t) { toggleTheme(); return; }
    var nt = e.target.closest("[data-nav-toggle]");
    if (nt) { if (navLinks) navLinks.classList.toggle("open"); return; }
    // close mobile menu on link click
    if (e.target.closest(".nav-links a") && navLinks) navLinks.classList.remove("open");
  });

  /* ---- Active nav link by page ---- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    if (href === here || (here === "index.html" && a.hasAttribute("data-home"))) a.classList.add("active");
  });

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- Animated counters ---- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400, start = null;
    var isInt = target % 1 === 0;
    if (reduce) { el.textContent = (isInt ? target : target.toFixed(1)) + suffix; return; }
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (isInt ? Math.round(val) : val.toFixed(1)) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animateCount(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.6 });
      counters.forEach(function (c) { cio.observe(c); });
    }
  }

  /* ---- News filter (simple, no pagination) ---- */
  var chips = document.querySelectorAll(".chip[data-filter]");
  if (chips.length && !document.querySelector("[data-blog-grid]")) {
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("active"); });
        chip.classList.add("active");
        var f = chip.getAttribute("data-filter");
        document.querySelectorAll("[data-cat]").forEach(function (card) {
          var show = f === "all" || card.getAttribute("data-cat").indexOf(f) !== -1;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---- Blog: filter + pagination (per category) ---- */
  (function () {
    var grid = document.querySelector("[data-blog-grid]");
    if (!grid) return;
    var PAGE = parseInt(grid.getAttribute("data-page-size") || "9", 10);
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-cat]"));
    var pager = document.querySelector("[data-blog-pagination]");
    var countEl = document.querySelector("[data-blog-count]");
    var bchips = Array.prototype.slice.call(document.querySelectorAll(".chip[data-filter]"));
    var filter = "all", page = 1;
    function matches(c) { return filter === "all" || c.getAttribute("data-cat").split(" ").indexOf(filter) !== -1; }
    function pageList(cur, total) {
      var a = [];
      for (var i = 1; i <= total; i++) {
        if (i === 1 || i === total || (i >= cur - 1 && i <= cur + 1)) a.push(i);
        else if (a[a.length - 1] !== "…") a.push("…");
      }
      return a;
    }
    function render() {
      var filtered = cards.filter(matches);
      var pages = Math.max(1, Math.ceil(filtered.length / PAGE));
      if (page > pages) page = pages;
      cards.forEach(function (c) { c.style.display = "none"; });
      filtered.slice((page - 1) * PAGE, page * PAGE).forEach(function (c) { c.style.display = ""; });
      if (countEl) {
        countEl.textContent = filtered.length + " article" + (filtered.length !== 1 ? "s" : "") +
          (pages > 1 ? " · page " + page + " of " + pages : "");
      }
      if (pager) {
        if (pages <= 1) { pager.innerHTML = ""; }
        else {
          var h = '<button class="pg-btn" data-pg="prev"' + (page === 1 ? " disabled" : "") + ' aria-label="Previous page">‹</button>';
          pageList(page, pages).forEach(function (n) {
            h += n === "…" ? '<span class="pg-ellipsis">…</span>'
              : '<button class="pg-btn pg-num' + (n === page ? " active" : "") + '" data-pg="' + n + '">' + n + "</button>";
          });
          h += '<button class="pg-btn" data-pg="next"' + (page === pages ? " disabled" : "") + ' aria-label="Next page">›</button>';
          pager.innerHTML = h;
        }
      }
    }
    bchips.forEach(function (ch) {
      ch.addEventListener("click", function () {
        bchips.forEach(function (c) { c.classList.remove("active"); });
        ch.classList.add("active");
        filter = ch.getAttribute("data-filter"); page = 1; render();
      });
    });
    if (pager) {
      pager.addEventListener("click", function (e) {
        var b = e.target.closest("[data-pg]"); if (!b || b.disabled) return;
        var v = b.getAttribute("data-pg");
        if (v === "prev") page = Math.max(1, page - 1);
        else if (v === "next") page = page + 1;
        else page = parseInt(v, 10);
        render();
        var top = grid.getBoundingClientRect().top + window.scrollY - 110;
        window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
      });
    }
    render();
  })();

  /* ---- Gallery lightbox ---- */
  var lb = document.querySelector(".lightbox");
  if (lb) {
    var lbImg = lb.querySelector("img");
    var items = Array.prototype.slice.call(document.querySelectorAll(".g-item"));
    var idx = 0;
    function open(i) {
      idx = (i + items.length) % items.length;
      var src = items[idx].getAttribute("data-full") || items[idx].querySelector("img").src;
      lbImg.src = src;
      lbImg.alt = items[idx].querySelector("img").alt || "";
      lb.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() { lb.classList.remove("open"); document.body.style.overflow = ""; lbImg.src = ""; }
    items.forEach(function (it, i) { it.addEventListener("click", function () { open(i); }); });
    lb.addEventListener("click", function (e) {
      if (e.target.closest(".lb-close") || e.target === lb) return close();
      if (e.target.closest(".lb-nav.next")) return open(idx + 1);
      if (e.target.closest(".lb-nav.prev")) return open(idx - 1);
    });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") open(idx + 1);
      if (e.key === "ArrowLeft") open(idx - 1);
    });
  }

  /* ---- Contact form (front-end only demo) ---- */
  var form = document.querySelector("[data-contact-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".form-status");
      if (note) {
        note.textContent = "Thank you — your message has been recorded. The team will be in touch shortly.";
        note.style.color = "var(--emerald)";
      }
      form.reset();
    });
  }

  /* ---- Footer year ---- */
  var y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
