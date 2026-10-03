# Sudha Tourism (foundation scaffold)

Premium Himalayan travel platform — this is **phase 1: foundation**. It wires up
the project so every subsequent feature (packages, booking, dashboards, admin)
can be built on solid, consistent ground.

> The name "Sudha Tourism" is a placeholder. Rebrand by editing
> `src/config/site.ts` and the color tokens in `src/app/globals.css` —
> no other code needs to change.

## What's in this phase

- Next.js 15 (App Router) + React 19 + TypeScript (strict)
- Tailwind CSS v4 design system: brand colors (forest green / emerald / warm
  gold / off-white), typography (Geist + Inter), radii, shadows, motion
  tokens, and a dark mode palette — all as CSS variables in `globals.css`
- Prisma schema covering: auth (Auth.js-compatible User/Account/Session),
  roles & permissions, packages, itineraries, destinations, categories,
  bookings, payments, invoices, coupons, reviews, blog, FAQs, media,
  volunteer events, wishlist, enquiries, notifications, settings, audit logs
- ESLint (flat config) + Prettier (with Tailwind class sorting) + Husky +
  lint-staged pre-commit hook
- `.env.example` covering DB, Auth.js, Cloudinary, Razorpay, Resend
- A minimal home page proving the design tokens render correctly

## Not yet built (next phases)

Home page sections, package listing/detail, booking + payment flow,
destinations, gallery, reviews, blog, volunteer pages, user dashboard, admin
dashboard, auth screens, email templates, animation system (Framer
Motion/GSAP/Lenis/Three.js), and SEO/sitemap wiring. The schema and folder
structure below are designed so each of these slots in without refactoring.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in real values
cp .env.example .env

# 3. Point DATABASE_URL at a running PostgreSQL instance, then:
npm run db:push       # push schema (or use db:migrate for versioned migrations)
npm run db:seed       # seed roles, categories, and a sample package

# 4. Run the dev server
npm run dev
```

Visit `http://localhost:3000` — you should see the branded placeholder home
page rendering with the design system tokens applied.

### Useful scripts

| Command             | Purpose                                   |
| -------------------- | ------------------------------------------ |
| `npm run dev`         | Start dev server (Turbopack)                |
| `npm run build`       | Production build                            |
| `npm run lint`        | Lint the codebase                           |
| `npm run typecheck`   | TypeScript check with no emit               |
| `npm run db:studio`   | Open Prisma Studio to browse data           |
| `npm run db:migrate`  | Create/apply a versioned migration          |

## Folder structure

```
src/
  app/                 # App Router routes (pages, layouts, route handlers)
  components/
    ui/                # shadcn/ui primitives (button, card, dialog, ...)
    layout/             # header, footer, nav — shared shell
    shared/              # cross-feature components (booking card, etc.)
  config/
    site.ts            # brand name, nav, contact info, categories — edit to rebrand
  lib/
    prisma.ts           # Prisma client singleton
    fonts.ts            # Geist + Inter font loading
    utils.ts            # cn(), formatCurrency(), slugify(), etc.
  hooks/                # shared React hooks
  types/                # shared TypeScript types
prisma/
  schema.prisma         # full data model
  seed.ts               # dev seed data
```

As features are added, each domain (packages, bookings, blog, admin, etc.)
gets its own route group under `src/app/` and, where it has enough
domain-specific logic, a matching folder under `src/components/` — keeping
the codebase feature-based rather than one giant shared `components/` bucket.

## Tech stack reference

Frontend: Next.js 15, React 19, TypeScript, Tailwind v4, shadcn/ui, Radix UI,
Framer Motion, GSAP, Lenis, Three.js/React Three Fiber/Drei, Lucide icons.

Backend: Next.js Server Actions, Prisma ORM, PostgreSQL, Auth.js, Cloudinary,
Razorpay, Resend, MDX-based blog, Zod + React Hook Form.

Deployment target: Vercel.
