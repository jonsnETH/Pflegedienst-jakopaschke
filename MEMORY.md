# Pflegedienst Jakopaschke — Project Memory

## Purpose
Single-page landing page (static HTML) for **Pflegedienst Jakopaschke** focused on **patient/customer acquisition**.
Primary contact routes: **Telefon**, **WhatsApp**, **E‑Mail**.

## Key Decisions (2026-02-06)

### Visual / Brand
- Logo is embedded as **inline SVG**.
- Logo animation concept: **Build sequence** that loops (~14s):
  1) Kreis (Stroke draw)
  2) Trennstrich (draw)
  3) „PFLEGEDIENST“ reveal
  4) „JAKOPASCHKE²“ reveal
  → hold → dissolve in reverse.
- Safari compatibility: SVG/CSS animation issues handled via **JS timeline**.

### Layout Philosophy
- Chosen direction: **Modern Clinic** look, but **staged / not full width** (Option A):
  - Unified wrapper: `.wrap` with `--contentMax` (~72rem).
  - Shared “stage” surface: `.stage-surface` (glass/blur, border, premium shadow).
  - Centered staged dividers (no full-width gradients).

### Motion / Effects (Premium but controlled)
- Subtle motion system:
  - Scroll reveal (`.reveal`)
  - Scroll-driven hero parallax (blobs + logo)
  - Hero cursor spotlight
  - Scroll progress bar + back-to-top
  - Active section highlighting in nav
- Advanced: **3D scroll-build IN/OUT** using `[data-fx3d]` with IntersectionObserver.
- Staggered build (wave) per container + hover parallax on service cards.
- Magnetic buttons for key CTAs (`[data-magnetic]`).

### Components upgraded to custom (less “template”)
- Trust: replaced 3 equal cards with a **Signature Trust Panel**.
- Process: replaced 3 cards with a **Timeline** (desktop horizontal / mobile vertical) incl. progress fill + marker.
- FAQ: reskinned to match stage/panel style (`faq-panel`, `faq-item`).
- Contact (left): replaced grid with **contact chips** (aligned with trust/timeline style).
- Address included:
  - Maxim-Gorki-Straße 28, 14974 Ludwigsfelde, Deutschland
  - Google Maps profile link: https://maps.app.goo.gl/E5L3AMo8mvCtd46r6?g_st=ipc

## Contact Data
- Telefon: **03378 18577** (`tel:+49337818577`)
- WhatsApp: **+49 151 67673238** (`https://wa.me/4915167673238`)
- E‑Mail: **info@pflegedienst-jakopaschke.de** (`mailto:info@pflegedienst-jakopaschke.de`)

## File(s)
- Main page: `index.html`
- Logo assets in folder (SVG/PNG variations).

## Known TODO / Next Steps
- Replace placeholder form `alert(...)` with a real form endpoint (Formspree / Netlify Forms) or remove form.
- Add real **Impressum** + **Datenschutz** pages/sections.
- DSGVO: consider replacing CDN usage (Tailwind CDN, FontAwesome, Google Fonts) with self-hosted assets.
- Content review: ensure claims (SGB V/XI, speed of start, coverage area) match reality.

## Notes
- Safari caching can hide changes; when testing: hard reload or reopen tab.
