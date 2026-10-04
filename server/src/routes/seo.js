import { Router } from 'express';
import { env } from '../config/env.js';
import { pool } from '../db/pool.js';
import { publicOrigin } from '../utils/publicOrigin.js';
import { fail } from '../utils/response.js';
export const publicPaths = [
  '/',
  '/destinations',
  '/packages',
  '/experiences',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cancellation',
];
export const xmlEscape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[character],
  );
export function sitemapXml(origin, destinations, packages) {
  const paths = [
    ...publicPaths,
    ...destinations.map(
      (row) => `/destinations/${encodeURIComponent(row.slug)}`,
    ),
    ...packages.map((row) => `/packages/${encodeURIComponent(row.slug)}`),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...new Set(paths)].map((path) => `  <url><loc>${xmlEscape(origin + path)}</loc></url>`).join('\n')}\n</urlset>\n`;
}
export function robotsText(origin) {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ''}`;
}
const router = Router();
router.get('/sitemap.xml', async (req, res) => {
  const origin = publicOrigin(env.CLIENT_URL);
  if (!origin)
    return fail(
      res.status(503).set('Cache-Control', 'no-store'),
      503,
      'Sitemap is not configured.',
    );
  try {
    // Use a single connection/consistent snapshot so a concurrent CMS status
    // change does not mix catalog generations. No write or automatic seed.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [destinations] = await connection.query(
        'SELECT slug FROM destinations ORDER BY slug',
      );
      const [packages] = await connection.query(
        "SELECT slug FROM packages WHERE status = 'published' ORDER BY slug",
      );
      await connection.commit();
      return res
        .type('application/xml')
        .set('Cache-Control', 'no-cache')
        .send(sitemapXml(origin, destinations, packages));
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch {
    return fail(
      res.set('Cache-Control', 'no-store'),
      503,
      'Sitemap temporarily unavailable.',
    );
  }
});
router.get('/robots.txt', (req, res) =>
  res
    .type('text/plain')
    .set('Cache-Control', 'no-cache')
    .send(robotsText(publicOrigin(env.CLIENT_URL))),
);
export default router;
