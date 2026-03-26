# Design System: Meetdown Platform

## 1. Overview & General Vibe
- **Vibe:** Warm, welcoming, community-driven.
- **Goal:** To create an environment where strangers want to connect offline.

## 2. Typography
- **Fonts:** DM Sans (for body / UI text) and Plus Jakarta Sans (for headlines).
- Load from Google Fonts.

## 3. Colors
- **Primary Accent:** Coral `#E8614A`
- **Secondary Accent:** Amber `#F59E0B`
- **Background:** Warm off-white `#FAFAF8`
- **Text:** Dark slate `#1E293B` for high contrast readability, muted slate `#64748B` for secondary text.
- **Card Background:** Pure white `#FFFFFF` or very soft grey `#F1F5F9`.
- **Borders:** Very subtle, e.g., `#E2E8F0`

## 4. Spacing & Shape
- **Border Radius:** `16px` (Tailwind `rounded-2xl`) for cards, buttons, un-bordered inputs.
- **Padding/Margin Scale:** 8pt grid (`p-2`, `p-4`, `p-6`, `p-8`).

## 5. Icons
- **Library:** Phosphor Icons (Outline weight) included via CDN.

## 6. Components
- **Frameworks:** No DaisyUI or Flowbite. Use raw Tailwind utility classes.
- **Cards:** White bg, light drop shadow (`shadow-sm` or custom subtle shadow), `rounded-2xl`, with a thumbnail, badge for category, title, date, location. Include host avatar.
- **Buttons:**
  - Primary: bg `#E8614A`, text white, `rounded-2xl`, `transition-all`.
  - Secondary: text `#E8614A` or `#1E293B`, background `#FAFAF8`, `border` subtle.
- **Pills/Badges:**
  - Standard (e.g., categories): `bg-white`, border, `text-sm`, `rounded-full`, padding `px-4 py-1.5`.

## 7. Responsive
- Mobile-first approach. Let cards expand 100% on mobile and form a grid on desktop.
