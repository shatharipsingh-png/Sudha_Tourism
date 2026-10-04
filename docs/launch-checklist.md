# Launch checklist

Phase 6 prepares code and operations; it does not authorize publication or deployment. See [deployment/recovery](deployment.md), [content and image inventory](content-audit.md) and [verification/security review](phase6-verification.md).

## Business content

- [ ] Owner confirms the displayed business name and approves the text brand mark/logo.
- [ ] Supply at least one real business contact channel in `site.js`; add phone/email/WhatsApp/address/hours only where the business intends to publish them. Confirm enquiry handling and response ownership.
- [ ] Verify all itineraries, descriptions and package availability assumptions through CMS.
- [ ] Confirm the centralized INR starting-price/per-person assumption and every actual package price/terms. Seed values are illustrative.
- [ ] Optional social profiles/statistics remain hidden unless approved; do not fabricate them.

## Images

- [ ] Review every URL/placement in the live catalog [inventory](content-audit.md), including shared page/section images in `site.js`.
- [ ] Replace/approve temporary Unsplash images; verify rights, location accuracy, permanence, dimensions and descriptive alt text.
- [ ] Supply `VITE_SOCIAL_IMAGE` as an approved HTTPS URL/site-relative asset; verify real sharing previews.
- [ ] Set `VITE_IMAGE_ORIGINS` to approved exact HTTPS origins; deploy matching frontend CSP. Test CMS previews and public imagery without disabling CSP.

## Legal

- [ ] Business/legal approval of `/privacy`, `/terms`, `/cancellation` text and data handling/retention/contact procedures in `legal.js`.
- [ ] Confirm package conditions and cancellation/refund terms; publish only supplied, reviewed commitments.
- [ ] Replace review-required template text/notice only after approval. No compliance certification has been established.

## Database

- [ ] Separate production MySQL 8+ database; restricted runtime/migration/backup users, network and patching reviewed.
- [ ] Verify remote TLS or private trusted DB network; current pool does not supply remote TLS.
- [ ] Tested, protected backups with owner-approved retention/recovery targets before schema changes.
- [ ] Controlled `npm run migrate`; confirm tracking and second-run no-op. No automatic resets.
- [ ] Seed only if intentional, clear provisioning variables, and approve every added example; ongoing CMS ownership established.

## Backend

- [ ] `npm ci --omit=dev` and maintained Node LTS; `NODE_ENV=production npm start` under a supervisor.
- [ ] Exact HTTPS `CLIENT_URL`; private listener, forwarded-header overwrite and explicit `TRUST_PROXY` match the real ingress path.
- [ ] Process health/readiness, safe failure responses, request IDs/log privacy, shutdown grace and monitoring verified.

## Frontend

- [ ] `npm ci`, approved public-only build environment and successful `npm run build`.
- [ ] Serve full `client/dist`, SPA fallback and generated frontend security headers; never serve `.env` or source/node_modules.
- [ ] API and sitemap routing excluded from SPA fallback; immutable hashed assets and revalidated HTML; no-store/noindex admin HTML.
- [ ] Four target widths, route errors, keyboard focus/dialogs/drawers, reduced motion, labels, contrast and image failure tested on deployed build.

## Security

- [ ] Rotate any real DB password previously exposed through tracked `server/.env.example`; its old value remains in Git history. Review access/logs as appropriate. No history rewrite or ignored-env change was performed.
- [ ] Independently generate production JWT_SECRET/IP_SALT; store secrets privately, never in Vite/build output/logs.
- [ ] Exact-origin credentialed CORS, Strict/HttpOnly/Secure cookies and approved-Origin cookie-bearing writes verified over real HTTPS.
- [ ] Single-instance limits verified; distributed/edge enforcement arranged **before** multiple replicas.
- [ ] Dependency audit and redacted secret scan reviewed; authorization remains backend-enforced.

## SEO

- [ ] Real `VITE_SITE_URL` equals server `CLIENT_URL`; no localhost canonical, fake domain or missing default social image.
- [ ] Fetch `/sitemap.xml` through the public origin; includes current public content and excludes draft/admin/API URLs. XML errors must remain XML/JSON 503, not SPA HTML.
- [ ] Fetch `/robots.txt`; allows assets/public routes, discourages `/admin`, uses the correct sitemap URL.
- [ ] Titles/descriptions/canonical/detail social images and safe JSON-LD checked after navigation/loading/not-found.
- [ ] Search/social crawlers verified on actual production URLs; resolve SPA-only head/soft-404 limitations before SEO approval.

## Email

- [ ] SMTP intentionally disabled or supplied through private runtime config; no verification creates real provider emails.
- [ ] If enabled, verify TLS, recipient/sender and actual inbox delivery; transport failures must not undo saved leads. Review saved leads through admin independently of email.

## Admin

- [ ] Initial permanent admin provisioned with `npm run admin:create`; remove provisioning password/env afterward. Verification admins were temporary and removed.
- [ ] Real HTTPS login/me/logout, expired sessions, lead details/status, all CMS CRUD and delete conflicts verified.
- [ ] Published packages visible; drafts absent from public list/detail/sitemap. Historical leads preserved.

## Domain/HTTPS

- [ ] Owner selects a domain/provider deliberately; this phase purchased/provisioned nothing.
- [ ] DNS, certificates/renewal, HTTPS redirect, appropriate HSTS, same-site origin topology and firewall verified.
- [ ] Headers applied at the frontend host; API origin/cookie behavior tested, not inferred from development.

## Final verification and rollback

- [ ] Unit/backend/browser suites pass without decreasing existing coverage; build/audits recorded.
- [ ] Public E2E includes all routes plus enquiry/booking request/contact/newsletter; actual database writes tested only in isolated development with cleanup.
- [ ] NVDA/VoiceOver formal review and Firefox/Safari checks performed, or explicitly accepted as unverified launch risks.
- [ ] Tested restore and previous deploy/environment artifacts available; owner understands rollback and post-backup lead reconciliation.
- [ ] Owner signs off content, legal, SEO and deployment; production deployment is explicitly authorized as a separate action.

Current disposition: **code prepared; content, legal, SEO deployment configuration and production launch remain NOT READY pending these approvals/checks.**
