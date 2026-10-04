# Deployment and recovery

This is preparation, not a deployment. No provider, domain, DNS, account, mail delivery or production database has been provisioned. Complete [the launch checklist](launch-checklist.md) and approve [content/imagery](content-audit.md) before publishing.

## Runtime and reproducibility

The backend retains Node 20+ compatibility; Vite requires Node 20.19+ or 22.12+. `.nvmrc` suggests **22**, without forcing Node 24. Use the latest maintained patch of a supported LTS for production: Node 20 is now end-of-life. See [Node's release status](https://nodejs.org/en/about/previous-releases). Verification here uses the installed Node 24.14.0; other runtimes require your CI checks.

Both active packages have committed lockfiles. Install with `npm ci` in **each** package. Build dependencies are necessary in the frontend build stage; serve only `client/dist`, never its source, `.env` or node_modules. Install backend runtime dependencies with `npm ci --omit=dev`. Run tests in a separate full-dependency CI stage.

## One approved frontend origin

The backend's existing `CLIENT_URL` is the source of the canonical **public frontend origin** for sitemap URLs and credentialed CORS. Set the same approved HTTPS origin as frontend `VITE_SITE_URL` at build time. Do not invent or use localhost as a production origin. Rebuild the client when any public `VITE_*` configuration changes. None of these frontend values may contain passwords, tokens or DB/mail secrets.

| Variable                                      | Location              | Purpose                                                                                               |
| --------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------- |
| `CLIENT_URL`                                  | server runtime        | Exact approved frontend HTTPS origin, no trailing slash; CORS, cookie-write Origin checks and sitemap |
| `VITE_SITE_URL`                               | frontend build        | Same approved public origin; canonical, social URL, JSON-LD, robots sitemap reference                 |
| `VITE_API_ORIGIN`                             | frontend build        | Empty for relative `/api`; otherwise exact same-site HTTPS API origin                                 |
| `VITE_SOCIAL_IMAGE`                           | frontend build        | Owner-approved HTTPS image URL or site-relative `/path`; no invented default                          |
| `VITE_IMAGE_ORIGINS`                          | frontend build        | Comma-separated exact HTTPS origins permitted for images by the frontend CSP                          |
| `NODE_ENV`, `PORT`                            | server runtime        | Production mode and private listener port                                                             |
| `DB_HOST/PORT/USER/PASSWORD/NAME`             | server runtime        | MySQL connection; keep credentials private                                                            |
| `JWT_SECRET`, `IP_SALT`                       | server runtime        | Independently generated secrets; production rejects obvious placeholders                              |
| `TRUST_PROXY`                                 | server runtime        | 0 without proxy, or reviewed hop count/network preset                                                 |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`               | one-time provisioning | Secure `admin:create` process only; remove afterward                                                  |
| `SMTP_*`, `MAIL_FROM`, `LEAD_NOTIFICATION_TO` | server runtime        | Optional notifications; disabled until intentionally configured                                       |

`server/.env.example` and `client/.env.example` contain configuration guidance, not usable credentials. `.env*` is ignored except examples. Secret management is operator-owned. Never pass a server env file to Vite or print secrets in CI.

## Recommended: same-origin reverse proxy

Serve frontend assets/SPA from the approved HTTPS origin. Reverse-proxy **`/api/*` and `/sitemap.xml`** to Express; preserve incoming `Origin`, overwrite forwarding headers, and never send API/XML failures through SPA fallback. `/robots.txt` comes from the build, with the configured sitemap URL. Express also provides `/robots.txt` if the proxy delegates it instead. Do not cache the sitemap blindly: it must reflect published/draft CMS state on the next fetch.

The production frontend host must apply the headers emitted in `client/dist/security-headers.json`. The development proxy and Express's API Helmet policy do not configure the static host. `npm run preview` exercises those frontend headers locally but is not a production service. Set HSTS at the HTTPS frontend ingress after validating certificate renewal; decide subdomain/preload policy deliberately.

Generic reverse-proxy routing concepts (adapt paths/certificates; this is not an active config):

```nginx
server {
    listen 443 ssl;
    server_name YOUR_APPROVED_HOST;
    root /srv/sudha-tourism/client/dist;
    # Configure certificate/key securely; install the generated frontend headers.
    # Overwrite forwarded IP/protocol headers at the single controlled ingress.
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location = /sitemap.xml {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    location / { try_files $uri $uri/ /index.html; }
}
```

Apply `Cache-Control: no-store` and `X-Robots-Tag: noindex, nofollow` to `/admin` HTML at the frontend host, without dropping the other security headers (some proxy header directives replace inherited headers). Cache fingerprinted `/assets/*` immutably; keep HTML revalidatable. Retain SPA fallback for direct admin/detail URLs. Unknown SPA URLs can return an HTML 200 from static hosting: confirm the crawler handles the rendered noindex/not-found page, or configure a real 404 strategy before SEO sign-off.

## Separate frontend/backend origins

Physical hosting may be separate while the browser uses a same-origin proxy. If the browser instead calls another origin, use **same-site HTTPS names** under the same registrable domain; set `VITE_API_ORIGIN` to the API origin and keep `CLIENT_URL` set to the frontend origin. Admin requests include credentials; the API returns only that exact origin with credentials and limited methods/headers. API `Set-Cookie` is host-only, HttpOnly, Secure in production, SameSite=Strict, Path=/, eight-hour lifetime. Public requests do not need an admin cookie.

Different origins are not necessarily different sites. Across unrelated sites, Strict cookies will not support this admin flow. Prefer a same-origin proxy or same-site names; do **not** weaken SameSite, store JWTs in browser storage or add wildcard CORS to compensate. See [cookie behavior](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie). Keep `/sitemap.xml` reachable on the public frontend origin through a route rewrite/proxy even when API calls use another origin. Never redirect sitemap requests into SPA HTML.

## Database provisioning and releases

1. Create an empty, named MySQL 8+ database through your DBA/provider; choose restricted migration and runtime users. Do not use the local development database as production.
2. Configure private runtime environment and independent secrets; configure the actual frontend HTTPS origin, ingress and proxy trust.
3. Install locked backend dependencies (`npm ci --omit=dev`). Back up before changing an existing schema.
4. From `server/`, run `npm run migrate` once as a controlled release job, before switching application traffic. Run again to confirm the no-op if desired. The application does not migrate/reset automatically.
5. Run `npm run seed` **only if intentionally loading illustrative catalog content**. It is non-destructive and does not overwrite existing catalog/admin rows, but it adds published example packages; do not casually seed production. Production seeding refuses an admin payload. Clear provisioning credentials before an intentional seed; use CMS for ongoing content.
6. Provision the first permanent admin with `npm run admin:create`, supplying credentials privately via the ignored environment or secret-managed process, then remove provisioning variables. No permanent admin was created by verification.
7. Build the frontend with its public configuration using `npm ci` then `npm run build`; deploy its complete `dist` artifact and matching header/routing configuration.
8. Start the backend with `NODE_ENV=production npm start` (set the environment through your service manager; PowerShell: `$env:NODE_ENV='production'; npm.cmd start`). Use a process supervisor, private listener/firewall, logs and graceful termination. Never use `npm run dev`, Vite dev or Vite preview as a production service.
9. Verify `/api/health`, `/api/health/ready`, protected auth, live sitemap/robots, actual DNS/TLS, CORS/Origin and published/draft visibility before traffic cutover.

The migration runner uses deterministic names, checksums and a MySQL advisory lock, records a migration only after all its statements succeed, and refuses missing/changed/out-of-order applied migrations. Existing migrations are additive. **MySQL DDL implicitly commits**; a multi-statement migration is not transactionally rolled back. On failure inspect the actual schema, restore/fix reviewed state, then retry; never mark a failed migration complete manually. Initial IF NOT EXISTS tables are retryable; later atomic ALTER/recovery must be reviewed. No new schema migration was needed in Phase 6.

The current pool assumes trusted/private DB networking and does **not** configure remote MySQL TLS. Use a private trusted network or add and verify a provider-specific TLS configuration before traversing an untrusted network. Backups, least-privilege users, firewalling, patching and retention are required operator tasks.

## Security and operations

- Keep exact-origin CORS, Strict/Secure cookies, JSON validation and backend authorization. Cookie-bearing admin POST/PATCH/DELETE calls additionally require the approved Origin (including API tools using a Cookie header). These layers mitigate browser CSRF for the chosen same-site architecture; they are not an absolute immunity claim. Compromised allowed origins/XSS remain material risks.
- `TRUST_PROXY=0` is safe without a proxy. Use 1 only behind the single overwritten-header ingress above; review all hop paths for multi-proxy deployments. Named presets must match your controlled network. Restrict direct backend access. Blind `true` is rejected. See [Express proxy guidance](https://expressjs.com/en/guide/behind-proxies/).
- Limits remain global 300/15 min/IP, leads 5/10 min/IP and failed login 5/15 min/IP; successful logins do not consume the failed-login allowance. Health probes bypass the global limiter. Stores are per-process; multi-instance deployments require distributed/edge rate limiting before scaling. Do not assume limits combine across replicas.
- Frontend CSP limits scripts to self, disables inline script handlers/eval, restricts fonts/API/images, forbids frames/objects/base changes. Inline **style attributes** are allowed because React/Motion use them; external stylesheets remain restricted. Configure owned image origins before publishing CMS URLs. [CSP documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy).
- Request IDs are generated server-side, returned in `X-Request-ID` and logged with method/fixed route/status/duration. Untrusted supplied IDs, query strings, full lead bodies, cookies, tokens, phone/email and secrets are not logged. Generic errors include the request ID only in operational logs/headers, not SQL/stacks in responses.
- Private admin/lead/probe responses are no-store; API responses carry noindex. `/api/health` reports process health only; readiness queries MySQL and returns a generic 503 on failure. Monitor both, plus storage capacity and backup age. Readiness includes a query timeout but pool acquisition/connect time can add latency; tune probes for your network.
- SIGTERM/SIGINT stop HTTP and close the pool with a ten-second bound. On Windows the tests emit Node's signal event because native process termination semantics differ. Confirm your actual supervisor's grace period exceeds this bound.
- Logout removes the browser cookie; copied JWTs remain valid until expiration under the existing design. If compromised, rotate JWT_SECRET (invalidates all sessions) and review admin/password/security exposure.

## Backups and restore

Use a restricted backup account and protected MySQL login path/option file supplied out of band. No password belongs in a command line, shell history or this repository. Example concepts for a shell on the database operations host:

```sh
mysql_config_editor set --login-path=sudha-backup --host=YOUR_DB_HOST --user=YOUR_BACKUP_USER --password
mysqldump --login-path=sudha-backup --single-transaction --routines --triggers --events --no-tablespaces --set-gtid-purged=OFF --databases YOUR_DB_NAME > sudha-backup.sql
```

`--password` above prompts; no credential is embedded. Grant only privileges required for the chosen backup flags. For InnoDB, single-transaction gives a consistent data snapshot; avoid concurrent DDL during the dump. Restrict/encrypt dump files: they contain personal leads and password hashes. Choose retention and recovery objectives with the owner. See [MySQL's backup reference](https://dev.mysql.com/doc/refman/8.4/en/mysqldump.html).

Test restore into a **separate isolated database instance** first (a `--databases` dump includes its original database name):

```sh
mysql --login-path=sudha-restore < sudha-backup.sql
```

Validate schema/migration checksums, record counts, admin access, public/draft visibility, readiness and lead preservation before accepting a backup. A backup never counts as reliable solely because its command returned zero. Production restore requires an approved downtime/data-loss plan; newer leads may need recovery/reconciliation.

## Rollback

Retain the previous frontend/backend artifacts, lockfiles, configuration and tested backup. Roll back application artifacts and the matching public build/environment together; restart and verify probes/auth/catalog. Additive schema may remain if compatible with the older application. Never run destructive rollback SQL or change applied migration files/checksums casually. Database restore is a separate deliberate operation with maintenance/downtime and reconciliation of post-backup records. Do not restore over a live production DB automatically. Revert env/topology changes without undoing necessary secret rotations. Record the incident and re-test before reopening traffic.

## SEO and launch limitations

Sitemap includes static public paths, all destination slugs and only published package slugs; no admin/API/filter URLs. If `CLIENT_URL` is local/unconfigured it returns safe 503 instead of misleading URLs. Build robots refers to a sitemap only when `VITE_SITE_URL` is configured. Canonical/OG URLs omit filters. Dynamic titles/descriptions/images, X cards and defensible JSON-LD update after API data loads and clear on route change; no fabricated address/contact/rating/offer is emitted. Missing/error pages set noindex.

This remains a React SPA: metadata is applied by JavaScript, not server-rendered into route-specific initial HTML. Google can render JavaScript, but rendering is a separate crawling step; non-JavaScript social crawlers may miss detail previews. See [Google's JavaScript SEO guide](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics). **Do not declare search/social launch sign-off until actual production URLs pass crawler/social preview checks.** If the chosen host requires initial HTML metadata, arrange reviewed prerender/head rendering as a separate deliberate deployment decision; no framework/backend rebuild was introduced here.

Real domain/default social image, DNS/TLS, external mail delivery, provider backup restore, Firefox/Safari and formal NVDA/VoiceOver verification remain operator checks. Keep the project classified **not production ready** while any required business/legal/deployment approvals are absent.
