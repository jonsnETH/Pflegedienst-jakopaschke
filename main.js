(() => {
  'use strict';

  // ── Intro animation ──────────────────────────────────────────
  const intro    = document.getElementById('intro');
  const introSkip = document.getElementById('intro-skip');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const finishIntro = () => {
    if (!intro || intro.classList.contains('is-done')) return;
    intro.classList.add('is-done');
    sessionStorage.setItem('pfj-intro', '1');
    document.body.style.overflow = '';
    intro.addEventListener('transitionend', () => {
      intro.hidden = true;
    }, { once: true });
  };

  if (intro && !document.documentElement.classList.contains('skip-intro') && !prefersReduced) {
    document.body.style.overflow = 'hidden';
    introSkip.addEventListener('click', finishIntro);

    // Prepare the SVG for animation
    const svg      = intro.querySelector('svg.logo-svg');
    const mark     = svg && svg.querySelector('#mark');
    if (!svg || !mark) { finishIntro(); return; }

    // Build wordmark group (everything except #mark and defs)
    let wordmark = svg.querySelector('#wordmark');
    if (!wordmark) {
      wordmark = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wordmark.id = 'wordmark';
      svg.insertBefore(wordmark, mark);
      for (const kid of Array.from(svg.children)) {
        if (kid === wordmark || kid === mark || kid.tagName.toLowerCase() === 'defs') continue;
        wordmark.appendChild(kid);
      }
    }

    // Split wordmark into top (PFLEGEDIENST) and bottom (JAKOPASCHKE²)
    let wmTop = svg.querySelector('#wm-top');
    let wmBottom = svg.querySelector('#wm-bottom');
    if (!wmTop || !wmBottom) {
      wmTop = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wmTop.id = 'wm-top';
      wmBottom = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      wmBottom.id = 'wm-bottom';

      const parts = Array.from(wordmark.children);
      for (const p of parts) wordmark.removeChild(p);

      const centers = parts.map(p => {
        try { const b = p.getBBox(); return b.y + b.height / 2; } catch { return 0; }
      });
      const sorted = centers.slice().sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] || 0;

      parts.forEach((p, i) => ((centers[i] <= median) ? wmTop : wmBottom).appendChild(p));
      wordmark.appendChild(wmTop);
      wordmark.appendChild(wmBottom);
    }

    const circle  = mark.querySelector('circle.cls-2');
    const divider = mark.querySelector('line.cls-2');
    const inners  = Array.from(mark.querySelectorAll('.cls-1'));

    const getLen = el => { try { return el.getTotalLength() || 0; } catch { return 0; } };
    const r    = parseFloat(circle && circle.getAttribute('r')) || 80;
    const cLen = 2 * Math.PI * r + 4;
    const dLen = getLen(divider) || 170;

    const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const easeOut   = t => 1 - Math.pow(1 - t, 3);
    const easeInOut = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
    const seg    = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

    const revealGroup = (g, t) => {
      const e = easeOut(t);
      g.style.opacity    = String(e);
      g.style.filter     = `blur(${(1-e)*8}px)`;
      g.style.transform  = `translateX(${(1-e)*10}px)`;
    };

    // Set initial states
    if (circle)  { circle.style.strokeDasharray = cLen; circle.style.strokeDashoffset = cLen; circle.style.opacity = 0; }
    if (divider) { divider.style.strokeDasharray = dLen; divider.style.strokeDashoffset = dLen; divider.style.opacity = 0; }
    inners.forEach(el => { el.style.opacity = 0; el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center'; el.style.transform = 'scale(1.02)'; });
    wmTop.style.opacity = 0; wmTop.style.filter = 'blur(8px)'; wmTop.style.transform = 'translateX(10px)';
    wmBottom.style.opacity = 0; wmBottom.style.filter = 'blur(8px)'; wmBottom.style.transform = 'translateX(10px)';

    // One-shot animation: maps elapsed ms to progress 0-100, capped at 60
    const BUILD_MS = 2800;
    const HOLD_MS  = 1200;
    let startTime = null;
    let phase = 'build'; // 'build' | 'hold' | 'done'

    const tick = now => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;

      if (phase === 'build') {
        const tt = clamp((elapsed / BUILD_MS) * 60, 0, 60);

        if (circle)  { const t = easeOut(seg(tt,0,14));  circle.style.opacity = t; circle.style.strokeDashoffset = cLen*(1-t); }
        if (divider) { const t = easeOut(seg(tt,12,22)); divider.style.opacity = t; divider.style.strokeDashoffset = dLen*(1-t); }
        const innerT = easeOut(seg(tt,10,22));
        inners.forEach(el => { el.style.opacity = innerT; el.style.transform = `scale(${1.02-0.02*innerT})`; });
        revealGroup(wmTop,    seg(tt, 22, 34));
        revealGroup(wmBottom, seg(tt, 34, 46));

        if (elapsed >= BUILD_MS) {
          // Snap to fully visible
          if (circle)  { circle.style.opacity = 1; circle.style.strokeDashoffset = 0; }
          if (divider) { divider.style.opacity = 1; divider.style.strokeDashoffset = 0; }
          inners.forEach(el => { el.style.opacity = 1; el.style.transform = 'scale(1)'; });
          [wmTop, wmBottom].forEach(g => { g.style.opacity=1; g.style.filter='blur(0)'; g.style.transform='translateX(0)'; });
          phase = 'hold';
          startTime = now;
        }
      } else if (phase === 'hold') {
        if (elapsed >= HOLD_MS) { finishIntro(); return; }
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  // ── Navigation ───────────────────────────────────────────────
  const nav    = document.getElementById('site-nav');
  const toggle = document.getElementById('nav-toggle');
  const mMenu  = document.getElementById('mobile-menu');

  // Sticky scroll state
  const onScroll = () => {
    if (window.scrollY > 20) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu toggle
  toggle.addEventListener('click', () => {
    const open = mMenu.hasAttribute('hidden');
    if (open) { mMenu.removeAttribute('hidden'); toggle.setAttribute('aria-expanded', 'true'); toggle.setAttribute('aria-label', 'Menü schließen'); }
    else       { mMenu.setAttribute('hidden', ''); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Menü öffnen'); }
  });

  // Close mobile menu on nav link click
  mMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mMenu.setAttribute('hidden', '');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  // Active nav link on scroll
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const ioNav = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        navLinks.forEach(l => { l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`); });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => ioNav.observe(s));

  // ── FAQ accordion ────────────────────────────────────────────
  document.querySelectorAll('.faq-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const body = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!expanded));
      body.classList.toggle('is-open', !expanded);
    });
  });

  // ── Tab switcher ─────────────────────────────────────────────
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('is-active'));
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(btn.getAttribute('aria-controls')).classList.add('is-active');
    });
  });

  // ── Scroll reveal ────────────────────────────────────────────
  if (!prefersReduced) {
    const revealEls = document.querySelectorAll('.reveal');
    const ioReveal = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); ioReveal.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => ioReveal.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-in'));
  }

  // ── Blog TOC active state ─────────────────────────────────────
  const tocLinks = document.querySelectorAll('.blog-toc nav a');
  if (tocLinks.length) {
    const headings = Array.from(tocLinks).map(a => document.querySelector(a.getAttribute('href')));
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          tocLinks.forEach(a => a.classList.remove('toc-active'));
          const active = document.querySelector(`.blog-toc nav a[href="#${entry.target.id}"]`);
          if (active) active.classList.add('toc-active');
        }
      });
    }, { rootMargin: '-80px 0px -60% 0px' });
    headings.forEach(h => { if (h) observer.observe(h); });
  }

})();
