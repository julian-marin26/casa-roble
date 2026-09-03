/* ============================================================================
   main.js — Casa Roble
   Patrón IIFE con <script defer>. Sin imports, sin build, sin npm.
   Todo el contenido está en el HTML: este archivo solo lo enriquece.
   Si el JS falla, la web sigue leyéndose entera.
   ========================================================================== */
(function () {
  "use strict";

  var data = window.__BRAND__ || {};

  /* ---------- Helpers ---------- */
  var $  = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  var reduced   = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var punteroFino = matchMedia("(hover: hover) and (pointer: fine)").matches;

  function escHTML(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function safe(fn, nombre) {
    try { fn(); } catch (e) { console.warn("[" + nombre + "]", e); }
  }

  /* ---------- Bucle rAF único (evita 4 bucles compitiendo) ---------- */
  var actualizadores = [];
  function addUpdater(fn) { actualizadores.push(fn); }
  function arrancarBucle() {
    if (!actualizadores.length) return;
    (function loop() {
      for (var i = 0; i < actualizadores.length; i++) actualizadores[i]();
      requestAnimationFrame(loop);
    })();
  }

  /* =========================================================================
     SPLASH — doble red de seguridad (CSS a los 4.5s + JS aquí)
     ====================================================================== */
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var ocultar = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(ocultar, 400);
    else window.addEventListener("load", function () { setTimeout(ocultar, 300); });
    setTimeout(ocultar, 3000);
  }

  /* =========================================================================
     NAVEGACIÓN — transparente arriba, sólida al bajar
     ====================================================================== */
  function initNav() {
    var nav = $("[data-nav]");
    if (!nav) return;
    if (nav.classList.contains("is-solida")) return; // carta.html ya nace sólida

    var solida = false;
    function revisar() {
      var debe = window.scrollY > 40;
      if (debe !== solida) {
        solida = debe;
        nav.classList.toggle("is-solida", debe);
      }
    }
    revisar();
    window.addEventListener("scroll", revisar, { passive: true });
  }

  function initMenuMovil() {
    var burger = $("[data-burger]");
    var menu = $("[data-menu-movil]");
    if (!burger || !menu) return;

    function cerrar() {
      burger.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-abierto");
      document.body.style.overflow = "";
      setTimeout(function () {
        if (burger.getAttribute("aria-expanded") === "false") menu.hidden = true;
      }, 450);
    }

    burger.addEventListener("click", function () {
      var abierto = burger.getAttribute("aria-expanded") === "true";
      if (abierto) { cerrar(); return; }
      menu.hidden = false;
      // fuerza reflow para que la transición de opacidad se vea
      void menu.offsetWidth;
      menu.classList.add("is-abierto");
      burger.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    });

    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) cerrar();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") cerrar();
    });
  }

  /* =========================================================================
     SCROLL SUAVE NATIVO para anclas (sin Lenis: menos frágil en Windows)
     ====================================================================== */
  function initScrollAnclas() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      var offset = 84;
      window.scrollTo({
        top: destino.getBoundingClientRect().top + window.scrollY - offset,
        behavior: reduced ? "auto" : "smooth"
      });
    });
  }

  /* =========================================================================
     REVEAL AL HACER SCROLL — umbral bajo + red de seguridad a los 6s
     ====================================================================== */
  function initReveals() {
    var objetivos = $$(".reveal:not([data-split])");
    if (!objetivos.length) return;

    if (!("IntersectionObserver" in window)) {
      objetivos.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-visible");
        io.unobserve(en.target);
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });

    objetivos.forEach(function (el) { io.observe(el); });

    // Seguridad: nada puede quedarse invisible para siempre
    setTimeout(function () {
      $$(".reveal:not(.is-visible)").forEach(function (el) {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.4) {
          el.classList.add("is-visible");
        }
      });
    }, 6000);
  }

  /* =========================================================================
     SPLIT DE PALABRAS — respeta <br> y <em> (gotcha A.4)
     ====================================================================== */
  function partirPalabras(el) {
    el.setAttribute("aria-label", el.textContent.trim().replace(/\s+/g, " "));
    function envolver(texto) {
      return texto.split(/(\s+)/).map(function (p) {
        return /^\s*$/.test(p) ? p
          : '<span class="split-word" aria-hidden="true">' + escHTML(p) + "</span>";
      }).join("");
    }
    var html = Array.prototype.map.call(el.childNodes, function (nodo) {
      if (nodo.nodeType === 3) return envolver(nodo.textContent);
      if (nodo.nodeName === "BR") return "<br>";
      if (nodo.nodeType === 1) {
        var tag = nodo.tagName.toLowerCase();
        return "<" + tag + ">" + envolver(nodo.textContent) + "</" + tag + ">";
      }
      return "";
    }).join("");
    el.innerHTML = html;
    return $$(".split-word", el);
  }

  function initSplit() {
    $$('[data-split="words"]').forEach(function (el) {
      if (el.dataset.splitHecho) return;
      el.dataset.splitHecho = "1";
      el.classList.remove("reveal");           // defensa secundaria (A.4.5)
      var palabras = partirPalabras(el);
      palabras.forEach(function (p, i) {
        p.style.transitionDelay = Math.min(i * 42, 900) + "ms";
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { el.classList.add("is-splitted"); });
      });
      // Seguridad: si algo falla, el texto se ve igual
      setTimeout(function () { el.classList.add("is-splitted"); }, 2500);
    });
  }

  /* =========================================================================
     CURSOR PERSONALIZADO — oculto hasta el primer movimiento (gotcha A.3)
     ====================================================================== */
  function initCursor() {
    if (!punteroFino) return;
    var cursor = $("[data-cursor]");
    if (!cursor) return;
    var punto = $(".cursor-dot", cursor);
    var anillo = $(".cursor-ring", cursor);
    if (!punto || !anillo) return;

    var mx = 0, my = 0, ax = 0, ay = 0, primero = false;

    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      punto.style.transform = "translate3d(" + mx + "px," + my + "px,0)";
      if (!primero) {
        primero = true;
        ax = mx; ay = my;
        anillo.style.transform = "translate3d(" + ax + "px," + ay + "px,0)";
        cursor.classList.add("is-ready");
      }
    }, { passive: true });

    document.addEventListener("mouseleave", function () { cursor.classList.remove("is-ready"); });
    document.addEventListener("mouseenter", function () { if (primero) cursor.classList.add("is-ready"); });

    addUpdater(function () {
      ax += (mx - ax) * 0.16;
      ay += (my - ay) * 0.16;
      anillo.style.transform = "translate3d(" + ax + "px," + ay + "px,0)";
    });

    var SELECTOR = 'a, button, input, select, textarea, [data-tilt]';
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest(SELECTOR)) cursor.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest(SELECTOR)) cursor.classList.remove("is-hover");
    });
  }

  /* =========================================================================
     TILT 3D EN LAS TARJETAS — el efecto firma de este sitio
     Se limita por capacidad de hover, NUNCA por reduced-motion
     ====================================================================== */
  function initTilt() {
    if (!punteroFino) return;
    $$("[data-tilt]").forEach(function (tarjeta) {
      if (tarjeta.dataset.tiltListo) return;
      tarjeta.dataset.tiltListo = "1";

      var MAX = 7;

      function mover(e) {
        var r = tarjeta.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        tarjeta.style.transform =
          "perspective(900px) rotateY(" + (px * MAX) + "deg) rotateX(" +
          (-py * MAX) + "deg) translateY(-6px)";
      }

      function salir() { tarjeta.style.transform = ""; }

      // mouseover/mouseout + relatedTarget: más compatible que enter/leave
      tarjeta.addEventListener("mouseover", function (e) {
        if (tarjeta.contains(e.relatedTarget)) return;
        // Durante el movimiento la transicion debe ser corta o la tarjeta
        // persigue al raton con medio segundo de retraso
        tarjeta.style.transition = "transform 120ms linear";
        tarjeta.addEventListener("mousemove", mover);
      });
      tarjeta.addEventListener("mouseout", function (e) {
        if (tarjeta.contains(e.relatedTarget)) return;
        tarjeta.removeEventListener("mousemove", mover);
        tarjeta.style.transition = "";   // vuelve a la salida suave del CSS
        salir();
      });
    });
  }

  /* =========================================================================
     MARQUESINA — se duplica el contenido y se anima en CSS
     ====================================================================== */
  function initMarquee() {
    var track = $("[data-marquee]");
    if (!track || track.dataset.loopListo) return;
    track.dataset.loopListo = "1";
    var original = track.innerHTML;
    track.innerHTML = original + original + original;
    track.classList.add("is-loop");
  }

  /* =========================================================================
     PARALLAX SUAVE DEL HERO (solo si GSAP cargó)
     ====================================================================== */
  function initHeroParallax() {
    var fig = $("[data-parallax] img");
    if (!fig || reduced) return;
    gsap.to(fig, {
      yPercent: 8,
      ease: "none",
      scrollTrigger: {
        trigger: fig.closest("[data-parallax]"),
        start: "top bottom",
        end: "bottom top",
        scrub: 0.6
      }
    });
  }

  /* =========================================================================
     ESTADO DE HOY — se calcula desde manifest.js
     ====================================================================== */
  function initHoy() {
    var salida = $("[data-hoy]");
    if (!salida || !data.horarios) return;
    var hoy = new Date().getDay(); // 0 domingo … 6 sábado
    var tramo = null;
    for (var i = 0; i < data.horarios.length; i++) {
      var h = data.horarios[i];
      if (h.diasNum && h.diasNum.indexOf(hoy) !== -1) { tramo = h; break; }
    }
    if (!tramo) return;
    salida.textContent = /cerrado/i.test(tramo.horas)
      ? "Hoy cerramos"
      : "Hoy: " + tramo.horas;
  }

  function initAnio() {
    $$("[data-anio]").forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* =========================================================================
     FILTROS DE LA CARTA (carta.html)
     Lee del DOM, así que no hay dos copias de los datos que se desincronicen
     ====================================================================== */
  function initFiltros() {
    var barra = $("[data-filtros]");
    if (!barra) return;
    var chips = $$(".chip", barra);
    var items = $$(".carta-item");
    var bloques = $$(".carta-bloque");
    var vacio = $("[data-vacio]");

    function aplicar(filtro) {
      items.forEach(function (item) {
        var cat = item.dataset.cat || "";
        var tags = item.dataset.tags || "";
        var mostrar = filtro === "todo" || cat === filtro || tags.indexOf(filtro) !== -1;
        item.hidden = !mostrar;
      });

      var visiblesTotales = 0;
      bloques.forEach(function (bloque) {
        var visibles = $$(".carta-item", bloque).filter(function (i) { return !i.hidden; });
        bloque.hidden = visibles.length === 0;
        visiblesTotales += visibles.length;
      });

      if (vacio) vacio.hidden = visiblesTotales > 0;
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        chips.forEach(function (c) { c.classList.remove("is-activo"); });
        chip.classList.add("is-activo");
        aplicar(chip.dataset.filtro || "todo");
      });
    });
  }

  /* =========================================================================
     FORMULARIO DE RESERVA — envío simulado
     En la fase 2 esta función hace un fetch() al backend en lugar del setTimeout
     ====================================================================== */
  function initFormulario() {
    var form = $("[data-form]");
    if (!form) return;
    var aviso = $("[data-form-aviso]", form) || $("[data-form-aviso]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (aviso) { aviso.textContent = ""; aviso.classList.remove("es-error"); }

      if (!form.reportValidity()) {
        if (aviso) {
          aviso.textContent = "Faltan datos: revisa nombre, teléfono y día.";
          aviso.classList.add("es-error");
        }
        return;
      }

      form.classList.add("is-enviando");
      if (aviso) aviso.textContent = "Enviando…";

      setTimeout(function () {
        form.classList.remove("is-enviando");
        var nombre = (form.querySelector('[name="nombre"]') || {}).value || "";
        if (aviso) {
          aviso.textContent = "Recibido" + (nombre ? ", " + nombre.split(" ")[0] : "") +
            ". Te confirmamos por teléfono en menos de dos horas. (Demo: no se envía nada.)";
        }
        form.reset();
      }, 1100);
    });
  }

  /* =========================================================================
     BOOT
     ====================================================================== */
  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initMenuMovil, "initMenuMovil");
    safe(initScrollAnclas, "initScrollAnclas");
    safe(initSplit, "initSplit");
    safe(initReveals, "initReveals");
    safe(initCursor, "initCursor");
    safe(initTilt, "initTilt");
    safe(initMarquee, "initMarquee");
    safe(initHoy, "initHoy");
    safe(initAnio, "initAnio");
    safe(initFiltros, "initFiltros");
    safe(initFormulario, "initFormulario");

    if (window.gsap && window.ScrollTrigger) {
      try { gsap.registerPlugin(ScrollTrigger); } catch (_) {}
      safe(initHeroParallax, "initHeroParallax");
    }

    arrancarBucle();
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
