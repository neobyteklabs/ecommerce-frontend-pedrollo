/* Movimiento del prototipo. Sin dependencias; cada bloque equivale a una directiva Angular. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('motion');

  // 1. Marcar qué se revela y con qué escalonado (en Angular: [bsvReveal] en la plantilla)
  const AUTO = '.product-card,.cat-card,.tile,.stat,.model-card,.trust-item,.order-row,.cart-line,.card,.s-head>*,.section-title,.timeline li,.email,.download,.spec-table,.swatch,.radio-card';
  function mark() {
    document.querySelectorAll(AUTO).forEach(el => { if (!el.hasAttribute('data-reveal') && !el.classList.contains('is-in') && !el.closest('.hero,.s-hero,.site-header,.modal,.toast-region')) el.setAttribute('data-reveal', el.matches('.product-card,.tile,.model-card,.swatch') ? 'scale' : ''); });
    // índice para escalonar hermanos
    document.querySelectorAll('[data-reveal]').forEach(el => { const sib = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal')); el.style.setProperty('--i', Math.min(sib.indexOf(el), 8)); });
  }

  // 2. IntersectionObserver: añade .is-in una sola vez
  const io = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); setTimeout(() => e.target.removeAttribute('data-reveal'), 1400); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  function observe() { document.querySelectorAll('[data-reveal]:not(.is-in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { el.classList.add('is-in'); setTimeout(() => el.removeAttribute('data-reveal'), 1400); } else io.observe(el); }); }

  // 3. Contador de cifras grandes ("60 m", "2.4 m³/h", "30 %")
  function counters() {
    document.querySelectorAll('.stat .big').forEach(el => {
      const m = el.textContent.trim().match(/^([\d.,]+)(.*)$/); if (!m || reduce) return;
      const target = parseFloat(m[1].replace(',', '')); const dec = (m[1].split('.')[1] || '').length; const suffix = m[2];
      el.setAttribute('data-count', target);
      const o = new IntersectionObserver(es => { es.forEach(e => { if (!e.isIntersecting) return; o.disconnect(); const t0 = performance.now(); const d = 1100;
        (function tick(t) { const p = Math.min(1, (t - t0) / d); const v = target * (1 - Math.pow(1 - p, 3)); el.textContent = v.toFixed(dec) + suffix; if (p < 1) requestAnimationFrame(tick); })(t0); }); }, { threshold: .5 });
      o.observe(el);
    });
  }

  // 4. Foco de luz que sigue al cursor (variables --mx/--my usadas por ::before)
  document.addEventListener('pointermove', e => { const c = e.target.closest('.product-card,.tile'); if (!c) return; const r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });

  // 5. Píldora de compra tras el hero + sección activa en la sub-barra
  function scrollBits() {
    const pill = document.querySelector('.buy-pill'); const hero = document.querySelector('.s-hero');
    const links = [...document.querySelectorAll('.sub-nav nav a[href^="#"]')];
    const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    function onScroll() {
      if (pill && hero) pill.classList.toggle('is-shown', scrollY > hero.offsetHeight * 0.55);
      let cur = null; secs.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = s; });
      links.forEach(a => a.classList.toggle('is-active', cur && a.getAttribute('href') === '#' + cur.id));
      const hi = document.querySelector('.hero-center>.hero-inner>.img-slot'); if (hi && !reduce) hi.style.transform = `translateY(${Math.min(scrollY, 600) * -0.12}px) scale(${1 + Math.min(scrollY, 600) * 0.00008})`;
    }
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }

  // 6. CTA "Ver producto ›" dentro de la card (aparece al hover)
  function ctas() { document.querySelectorAll('.product-card:not(:has(.cta))').forEach(c => { const s = document.createElement('span'); s.className = 'cta'; s.innerHTML = 'Ver producto ' + (window.icon ? icon('arrowRight') : '›'); c.appendChild(s); }); }

  function init() { ctas(); mark(); observe(); counters(); scrollBits(); }
  document.addEventListener('DOMContentLoaded', () => { init(); setTimeout(init, 400); });
  new MutationObserver(() => { ctas(); mark(); observe(); }).observe(document.documentElement, { childList: true, subtree: true });
})();
