# Design System: Best Cement — CIRP Information Site

## 1. Brand Identity & Principles
* **Mission:** Tell dealers, creditors, employees and the public, clearly and calmly, that J.U.D. Cements Limited (Best Cement) is under a Corporate Insolvency Resolution Process, and what that means for them.
* **Core Values:** Familiar, trustworthy, corporate, industrial, accessible.
* **Voice & Tone:** Professional, plain-language, neutral. State what the order says without taking sides, and avoid legal jargon where a plain word works.
* **Brand anchor:** The existing Best Cement logo (blue "B", orange "EST" and "CEMENT") and the tagline *"Jaandar cement… Shaandar Jod"*. The logo is never redrawn or recoloured; it sits on white, with a white plate behind it on dark backgrounds.

## 2. Color Palette
| Role | Hex Code | RGB | Usage |
| :--- | :--- | :--- | :--- |
| Primary (logo blue) | `#2B5193` | `rgb(43,81,147)` | Primary buttons, headings on panels, brand section |
| Primary dark | `#1F3D72` | `rgb(31,61,114)` | Pressed states, 3D steel |
| Navy | `#0F1D38` | `rgb(15,29,56)` | Hero, notice bar, footer, headings |
| Secondary (logo orange) | `#E28541` | `rgb(226,133,65)` | Calls to action, claim-forms banner, highlights |
| Orange text | `#B5591B` | `rgb(181,89,27)` | Small orange text on white (meets WCAG AA) |
| Blue tint | `#EAF0F9` | `rgb(234,240,249)` | Finding boxes, icon tiles, date chips |
| Orange tint | `#FCEFE4` | `rgb(252,239,228)` | Status pill, "coming soon" chips |
| Background | `#F5F6F8` | `rgb(245,246,248)` | Page background |
| Surface | `#FFFFFF` | `rgb(255,255,255)` | Cards |
| Text – Dark | `#1F2633` | `rgb(31,38,51)` | Body text |
| Text – Muted | `#6B7484` | `rgb(107,116,132)` | Labels, captions |
| Error (Semantic) | `#D64545` | `rgb(214,69,69)` | Form errors (future claim forms) |
| Success (Semantic) | `#2E8B57` | `rgb(46,139,87)` | Tribunal verdict tags, confirmations |

## 3. Typography
* **Primary Font:** Archivo (headings, numbers, buttons). It's a heavy grotesque that echoes the logo's block letters.
* **Secondary Font:** Public Sans (body copy and UI).
* **Monospace Font:** IBM Plex Mono (case numbers, CIN, IBBI registration only).

### Type Scale
| Element | Mobile | Desktop | Weight | Line Height | Letter Spacing |
| :--- | :--- | :--- | :--- | :--- | :--- |
| H1 (hero) | 30px | 44–48px | 800 | 1.1 | -0.02em |
| H2 (section) | 30px | 36–40px | 700 | 1.2 | -0.015em |
| H3 (card) | 18–19px | 19–20px | 700 | 1.3 | Normal |
| Stat figure | 40px | 44px | 800 | 1.0 | -0.02em |
| Body (Large) | 16px | 18px | 400 | 1.6 | Normal |
| Body (Base) | 15–16px | 17px | 400 | 1.6 | Normal |
| Eyebrow / label | 12–13px | 13px | 600 | 1.4 | 0.06–0.08em, uppercase |

## 4. Spacing & Layout
### Spacing System (Base: 8px)
* `xs`: 4px · `sm`: 8px · `md`: 16px (base padding) · `lg`: 24px · `xl`: 32px · `2xl`: 48px · `3xl`: 64px
* Section padding: 64px mobile, 96px tablet, 120px desktop.
* Separation comes from **space, cards and colour blocks, not rule lines**.

### Breakpoints
| Device | Breakpoint (px) | Layout Behavior |
| :--- | :--- | :--- |
| Mobile (sm) | `< 768px` | 1 column, 20px gutters, full-screen menu, bottom action bar (Read order / Claim forms) |
| Tablet (md) | `768px` | 2-column card grids, 32px gutters |
| Desktop (lg) | `1024px` | Full navigation, 3–4 column grids, 1200px container |
| Ultrawide (xl) | `1440px`+ | Centered 1200px container, larger hero type |

## 5. UI Components
### Buttons
* **Primary:** Blue `#2B5193`, white text, radius 4px, min height 48px (touch target).
* **Secondary (ghost):** Transparent, 1px blue border, blue text.
* **Call to action:** Orange `#E28541` with navy text (claim forms, notice link).
* **Hover:** brightness −10% (primary/CTA) or blue tint background (ghost).
* **Disabled:** opacity 50%, `cursor: not-allowed`.

### Cards
* White, radius 8px (12px for feature panels), soft shadow, no borders.
* Accordions (Tribunal findings) are cards with a round +/× toggle. Each opens to an "Objection" box (grey) and a "Tribunal's answer" box (blue tint).

### Forms & Inputs (for the forthcoming claim forms)
* **Border:** 1px solid `#CCD3DE`, radius 4px.
* **Focus:** 2px solid Primary, no outline.
* **Label:** semi-bold, base size, above the field.
* **Error:** border `#D64545`, red helper text below.

## 6. Imagery & Iconography
* **Icon set:** Custom inline SVG, 24×24 base, 1.5px stroke, round caps. Shown inside 44px blue-tint tiles.
* **3D:** A schematic Three.js cement plant in brand colours (blue steel, light concrete, orange kiln) on navy. The camera rises and the light cools as the visitor scrolls through the CIRP story.
* **Border radius:** 4px buttons, 8px cards, 12px feature panels.

## 7. Motion & Interaction
* **Base Transition:** `0.2s ease-in-out` (hover, colour).
* **Complex Animation:** `0.4s cubic-bezier(0.25, 0.1, 0.25, 1)` (menu sheet, reveals, story panels, accordions).
* **Accessibility:** All animation, including the 3D camera orbit and kiln rotation, respects `prefers-reduced-motion: reduce`.
