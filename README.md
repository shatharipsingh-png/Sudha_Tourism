# Sudha Tourism

Current: **server/ = Node + Express 4 + JavaScript + mysql2/promise + MySQL 8+**.
Public frontend: **client/ = React + Vite + JavaScript + CSS Modules**. All public routes are implemented through Phase 4; backend contracts remain unchanged.
Reusable draft copy and UI ideas are preserved in [project notes](docs/preserved-project-notes.md); these include unverified placeholders, not approved business facts.

## Public frontend (Phase 4)

Use Node **20.19+ in the Node 20 line, or 22.12+** for Vite 8. The backend remains compatible with Node 20+.
Start the API and frontend in separate terminals:

```sh
cd server
npm install
npm run dev
```

```sh
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. Frontend port: **5173**; backend port: **5000**. Keep the backend's `CLIENT_URL` set to the exact frontend browser origin. Vite forwards relative `/api` requests to `http://localhost:5000`. No frontend environment file is necessary and no server secrets belong in `VITE_*` variables.

```sh
cd client
npm test
npm run build
npm run preview
```

`npm test` uses Node's built-in test runner for API error handling, URL filters/pagination, destination filtering and lead payload validation. Playwright is a development-only dependency for browser verification. With the API and Vite running, install its browser once using `npx playwright install chromium`, then run `npm run test:browser`. Alternatively set `CHROMIUM_PATH` to an existing compatible Chrome executable. The browser check uses the seeded public catalog and intercepts form POST requests: it does not write database records. It covers all public routes at four widths, filters and browser history, pagination, context, keyboard dialogs/itinerary, form payloads and safe error/retry. `VERIFY_URL` optionally selects another local frontend origin. `npm run preview` serves the built files locally; it is not a production server.

Production should serve `client/dist` with SPA fallback to `index.html` for frontend routes, and reverse-proxy `/api` to Express on the same public origin. The Vite development proxy is not part of the production build. Do not route `/api` errors to the SPA fallback. Use HTTPS and set the backend's `CLIENT_URL` to the real public origin.

Update **client/src/config/site.js** with approved phone, email, address, hours, WhatsApp, social URLs, stats and `canonicalOrigin`. Unknown values are explicitly `PLACEHOLDER`; unconfigured contact links, stats and WhatsApp are hidden. Canonical tags are omitted until a real origin is supplied. Replace development Unsplash images with approved imagery before launch, and review seeded package prices/content. No logo, ratings, testimonials or business statistics have been invented.

Home, destination/package lists and details, Experiences, About, Contact, Privacy, Terms, Cancellation and 404 are implemented. Catalog content comes from the existing public APIs. The packages URL is the filter source of truth; filtering resets `page`, pagination preserves active filters, and Back/Forward restores selections. Duration values are `short` (1–4 days), `medium` (5–7 days) and `long` (8+ days). The list requests six packages per page by default; a valid URL `limit` may specify 1–24. Pagination is performed by MySQL through the API.

**Pricing assumption:** the existing schema stores integer prices without currency or pricing-unit columns. The frontend follows the Phase 3/catalog assumption of INR starting prices per person. The business must verify that assumption and all listed prices before launch; no multi-currency or confirmed-quote feature is introduced. Missing prices display an enquiry/contact message.

Legal routes are readable **review-required templates**, not approved policies or compliance commitments. Edit `client/src/config/legal.js` with reviewed business policies, privacy handling/retention and contact procedures, and confirmed cancellation/refund terms before launch. No jurisdiction, fees, retention period or refund timing is invented. Business/legal review should consult the official [MeitY data-protection framework](https://www.meity.gov.in/digital-personal-data-protection-act-2023) and [published rules](https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa?pageTitle=Digital-Personal-Data-Protection-Rules-2025) for applicable requirements; these templates do not assert compliance.

Seed photography remains development content and needs editorial approval. Some seeded place entries repeat the destination image, so destination detail renders those as text instead of duplicating a photograph for every place. Verify that each destination/experience photograph depicts the correct location before launch.

Google Fonts load with `display=swap` and local fallbacks. The **frontend host's** CSP must account for styles from `https://fonts.googleapis.com`, fonts from `https://fonts.gstatic.com`, and current imagery from `https://images.unsplash.com`. Keep API `connect-src` same-origin. Framer Motion applies dynamic inline style attributes; configure the frontend style policy accordingly or replace/self-host assets and animations under a stricter policy. Express's API-only Helmet configuration does not automatically configure a separate static frontend host. No backend security settings were weakened.

Newsletter submission includes explicit `consent: true`, as required by the existing backend. The shared enquiry dialog submits `type: enquiry`; experience preferences use a supported travel type and message, without fabricating a package relationship. The booking modal submits `type: booking` with package ID, a future UTC travel date, travelers and supported optional room preference/message. The booking contract does not accept a destination ID, so the package supplies that context. Contact uses `type: contact`, with optional phone and a message of at least ten characters. All submissions capture requests: there is no payment, inventory reservation or booking confirmation. API errors are presented with safe user-facing messages.

## Requirements and local setup

Node 20+, npm and MySQL Community Server 8+; local target MySQL 8.4.11. Database commands reject MySQL <8 and MariaDB. The backend owns its package/lockfile; run commands from server/. On Windows with PowerShell script restrictions, use npm.cmd.

```sh
cd server
npm install
cp .env.example .env
# PowerShell: Copy-Item .env.example .env
```

Edit the ignored server/.env privately. Set DB_HOST, DB_PORT (3306), DB_USER, DB_PASSWORD, DB_NAME (sudha_tourism).
Set CLIENT_URL to an exact browser origin (development http://localhost:5173; no trailing slash).
PORT defaults to 5000. Generate two separate random secrets:
```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Use one for JWT_SECRET (32+ characters), another for IP_SALT (16+). Never commit credentials. ADMIN_EMAIL/ADMIN_PASSWORD are seed-only and are not required to start the API.

## Initialization, migrations and seed

**Initialization != migration != seed.**

Initialization creates the database only:
```sh
npm run db:init
```
This needs database-creation privileges. Alternatively an operator can execute:
```sql
CREATE DATABASE IF NOT EXISTS sudha_tourism CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Use separate restricted runtime/migration accounts in production. Runtime needs SELECT/INSERT/UPDATE on application tables; migration accounts need appropriate DDL and schema_migrations access.

Migrations create/extend schema:
```sh
npm run migrate
npm run migrate
```
Files in server/src/db/migrations execute sequentially under a MySQL advisory lock. Successful files/checksums are stored in schema_migrations; failed files are not marked successful. Repeated successful runs are safe. Changed/missing applied files or out-of-order additions fail. Migration 001 adopts the original five-table schema with CREATE TABLE IF NOT EXISTS, preserving records. Existing tables must match that original schema.
SQL files use -- statement-breakpoint between statements. The runner accepts additive CREATE TABLE/ALTER TABLE and rejects obvious destructive operations. Review future migrations and back up production.
[MySQL DDL implicitly commits](https://dev.mysql.com/doc/refman/8.4/en/implicit-commit.html); multi-statement DDL cannot be transactionally rolled back. Initial creation is retryable; 002 is one atomic ALTER. If a connection/process fails after DDL but before tracking, inspect schema and ledger before retrying; do not recover by dropping tables.

Seed inserts missing catalog/admin records:
```sh
npm run seed
npm run seed
```
**Seed is non-destructive**: no table creation/deletion, no lead deletion, no duplicate catalog records, no overwriting owner edits or existing admin passwords. It requires migrations first and uses a transaction.
With neither ADMIN_EMAIL nor ADMIN_PASSWORD, seed is catalog-only. To create an admin supply both; password 12+ characters and <=72 UTF-8 bytes. A partial pair fails. Remove seed credentials after use. Existing catalog prices are demo data; verify before launch.

Migration 002 adds consent_at, unsubscribed_at and a generated normalized newsletter_email unique key. Legacy duplicate emails cause an atomic failure, preserving all records. Find duplicates privately:
```sql
SELECT LOWER(TRIM(email)) AS normalized_email, COUNT(*) AS count
FROM leads WHERE type = 'newsletter'
GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1;
```
Back up and manually review/archive/reconcile duplicates with an explicit retention decision, then retry. No automatic deletion or invented historical consent occurs. Existing consent timestamps remain NULL. This is minimal consent infrastructure, not legal compliance.

## Development and tests

```sh
npm run dev
npm start
npm test
```
Development uses Node watch mode; production uses start.
Tests preload isolated values, skip .env and prohibit real pool query/connection access. In-memory replacements cover HTTP validation/auth/errors, pagination, proxy rate limits, readiness, migration tracking and seed safety. No production credentials or DB writes are needed; these do not replace MySQL integration tests.
With a configured development database, run migrate twice and seed twice; compare lead/catalog counts, start the API and check liveness/readiness. Do not verify against production. Checks without credentials remain UNVERIFIED.

## API

All responses use { success, data, message }; validation errors have data.errors.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | /api/health | Lightweight liveness, no DB query |
| GET | /api/health/ready | SELECT 1; ready/connected or generic 503 |
| GET | /api/destinations | Destination list |
| GET | /api/destinations/:slug | Destination and published packages |
| GET | /api/packages | Filtered/paginated published packages |
| GET | /api/packages/:slug | Detail and related packages |
| GET | /api/experiences | Experiences |
| POST | /api/leads | Unified enquiry/booking/contact/newsletter |
| POST | /api/admin/login | Sign-in |
| POST | /api/admin/logout | Authenticated cookie clearing |
| GET | /api/admin/me | Authenticated administrator |
| GET | /api/admin/leads | Authenticated paginated lead list |
| GET | /api/admin/stats | newLeadsByType, publishedPackages, totalDestinations |
| PATCH | /api/admin/leads/:id | Authenticated status update |

Package filters: destination slug; category family/adventure/honeymoon/spiritual/cultural/wildlife/luxury; duration short (<=4), medium (5–7), long (>=8); minPrice/maxPrice; best_seller/featured true/false; page 1–100000; limit 1–24, default 12.
Admin leads: type; status new/contacted/closed; page 1–100000; limit 1–50, default 20.
Pagination passes bounded integers through mysql2 query() text protocol, avoiding prepared LIMIT binding issues; other SQL uses execute(). [mysql2 documentation](https://sidorares.github.io/node-mysql2/docs/documentation)

Lead input:
- enquiry: name/email/phone; optional package_id, destination_id, travel_date, travelers (1–50), message; details allows duration, budget, travel_type.
- booking: name/email/phone, published package_id, future YYYY-MM-DD date and travelers required; details allows room_preference single/double/triple/family. Dates use UTC calendar days; today is rejected.
- contact: name/email, message 10–2000 characters; optional phone.
- newsletter: email and consent: true. First/duplicate/concurrent submissions return identical id: null responses; no subscriber ID disclosure or resetting unsubscribe history.
- website is a honeypot. Blank optional strings become undefined. Details reject unknown keys. Route slugs, IDs and dates are validated.

No legacy contact/enquiries/newsletter endpoints, confirmed booking or payment functionality exists.

## Authentication, security and production

bcrypt 6 (cost 12) replaces the vulnerable legacy installer dependencies ([release notes](https://github.com/kelektiv/node.bcrypt.js/releases/tag/v6.0.0)); unknown accounts still perform bcrypt work. Login errors: Invalid email or password. JWT signing/verification explicitly uses HS256, eight-hour expiry, HttpOnly/SameSite=Strict cookie, Secure in production. Protected routes recheck the admin in MySQL. Logout clears the cookie; a copied JWT remains valid until expiry. No OAuth, roles, refresh tokens or reset flow.

Set NODE_ENV=production, HTTPS and the exact production CLIENT_URL. Deploy frontend/API on the same site for strict cookies. Other browser origins receive 403. There is no separate CSRF-token system; origin checks, strict cookies and HTTPS must be retained.

TRUST_PROXY defaults to 0. Allow a known hop count 1–10 for a fixed ingress path, or loopback/linklocal/uniquelocal where appropriate. Never use true or trust arbitrary proxies. Restrict direct API access and ensure the proxy overwrites forwarded headers; otherwise clients can spoof IPs or share one rate-limit identity.
Global: 300 requests/15 minutes/IP; leads: 5/10 minutes/IP; failed logins: 5/15 minutes/IP with skipSuccessfulRequests enabled. Health probes bypass global limits. Stores are process-local; shared storage/edge limits are needed before multiple replicas.

Helmet, 20 KB JSON bodies and bounded DB queues are enabled. Expected statuses: 400/401/403/404/413/429; unsupported encodings 415; unexpected failure generic 500. Logs record method, route template, status and duration, excluding queries, bodies, passwords, cookies, JWTs and SQL internals. IPs are salted hashes.
SIGTERM/SIGINT close HTTP/pool with a ten-second bound. Fatal exceptions/rejections safely log event names and shut down.
The pool assumes local/private trusted MySQL networking; remote database TLS is not configured. Configure transport security before an untrusted network, plus secret management, backups and restricted database users.

## Phase 2 admin backend

Create an administrator without running the catalog seed:
```sh
cd server
npm run admin:create
```
Supply ADMIN_EMAIL and ADMIN_PASSWORD through the ignored server/.env or a secure process environment. Email is normalized. Password must have 12+ characters, uppercase, lowercase, a number and a symbol, and be <=72 UTF-8 bytes. Only a bcrypt cost-12 hash is stored. Existing emails fail safely; passwords are never silently reset. API startup does not require these variables. Remove seed/creation credentials from the deployment environment after use. Rotate any real credential previously placed in .env.example or committed to source control.

Authenticated content endpoints for each of destinations/packages/experiences:
- GET /api/admin/{entity}: paginated list (page 1–100000, limit 1–50, default 20).
- GET /api/admin/{entity}/:id: detail.
- POST /api/admin/{entity}: create (201).
- PATCH /api/admin/{entity}/:id: supplied fields only; empty patches fail.
- DELETE /api/admin/{entity}/:id: delete with consistent JSON success.

Use the existing snake_case database fields. Text and arrays are bounded; images and gallery entries must be HTTP(S) URLs. Slugs normalize surrounding whitespace/case and spaces into hyphens. Unknown fields and uncontrolled JSON keys fail validation. Booleans accept true/false or their exact string equivalents; strings such as "yes" are rejected.

Destination JSON: why_visit is a string array; top_places contains name/description and optional image; travel_info contains best_time/how_to_reach/tips. Package JSON: gallery is URL array; highlights/inclusions/exclusions are string arrays; itinerary entries contain unique day/title/description/activities; info contains important/tips arrays. Experience examples is a string array. Keep JSON bodies within the existing 20 KB limit.

Admin package lists additionally filter by destination_id, category and status. Package status is draft/published; new admin-created packages default to draft. Public lists, detail, related packages and destination package lists show published packages only. Duplicate slugs return 409. Missing linked destinations return 400. Destination deletion is blocked when packages or leads reference it; package deletion is blocked when leads reference it. Parent rows are locked during deletion to avoid racing FK-backed writes. Historical leads are never cascade-deleted or silently unlinked by these APIs.

GET /api/admin/leads/:id returns linked content and useful lead fields, excluding IP hashes. Existing list filtering/pagination remains. Status updates allow new -> contacted/closed, contacted -> closed, and closed -> contacted for reopening; identical status is a successful no-op. Other backwards transitions return 409. Concurrent updates use an optimistic status condition and return 409 if the record changed.

Stats include totalLeads/newLeads/contactedLeads/closedLeads, leadsByType (all statuses), newLeadsByType, five recent leads, totalDestinations/totalPackages/publishedPackages/totalExperiences. Existing accurately named keys remain compatible.

Prices and Unsplash imagery are illustrative development content. An owner must verify prices, route availability and business copy, and replace temporary images with owned/licensed production imagery before launch. No verified reviews or guarantees are introduced. Known Phase 1 demo-price warnings are removed from public package responses without overwriting existing database content; new seed content does not contain them.

## Lead notifications

SMTP is **disabled by default**. The API starts and captures leads normally without mail credentials, and startup reports enabled:false rather than pretending delivery. Enable only after configuring server/.env or a secret manager:
```text
SMTP_ENABLED=true
SMTP_HOST=<your SMTP host>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<optional authentication user>
SMTP_PASSWORD=<optional authentication password>
LEAD_NOTIFICATION_TO=<admin recipient email>
MAIL_FROM=<verified sender email>
```
These are configuration concepts, not usable credentials. If authentication is needed, provide both user/password. SMTP_SECURE=true uses implicit TLS (typically port 465); false requires STARTTLS. TLS certificate verification remains enabled. Transport logging/debug is disabled, timeouts are bounded, and file/URL content loading is disabled. See [Nodemailer SMTP documentation](https://nodemailer.com/smtp).

Enquiry, booking and contact leads are stored first; the success response finishes before the notification service runs. Newsletter and honeypot submissions do not notify admins. Notifications contain useful lead/contact/travel information and linked package/destination names, using escaped HTML plus plain text; they omit hashes, cookies and secrets. Transport or enrichment failures log only a generic event and never reverse a saved lead or change its success response. SMTP acceptance is not proof of inbox delivery.

The notification boundary supports adding channels later. This phase is best-effort in-process notification: no durable queue, retry mechanism or delivery guarantee. Process shutdown/crash can lose a pending notification; review saved leads through the admin API. No WhatsApp Business API, Redis, uploads, analytics or payments are implemented. The Phase 3 frontend can use a direct WhatsApp link after a real number is configured.

Automated notification tests use only fake transports and disable environment SMTP. Live temporary CRUD verification also disables mail so test records cannot send real email. Real provider/inbox delivery requires separate operator verification.
