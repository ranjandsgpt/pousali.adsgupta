# Pousali Dasgupta — Portfolio

Personal portfolio for **Pousali Dasgupta** (Amazon Ads Specialist & Marketplace Growth Strategist) at [pousali.adsgupta.com](https://pousali.adsgupta.com).

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** TailwindCSS
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Content:** Markdown/JSON-ready (data in `src/data/`)
- **Hosting:** Vercel
- **SEO:** Next.js Metadata API, OpenGraph, JSON-LD

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Structure

- `src/app/` — App Router pages (home, about, work, insights, contact)
- `src/components/` — Navbar, Hero, WorkCard, BlogCard, Footer, section components
- `src/data/` — `experience.ts`, `blogs.ts`, `case-studies.ts`, `expertise.ts` (CMS-ready)
- `src/styles/globals.css` — Tailwind + CSS variables (dark mode)

## Features

- Minimal, premium design (Stripe/Linear/Vercel-inspired)
- Dark mode (system preference + navbar toggle)
- Responsive layout
- Framer Motion animations
- Accessibility (ARIA, semantic HTML, focus states)
- SEO metadata and structured data
