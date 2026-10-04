import bcrypt from 'bcrypt';
import { destinationData, packageData, experienceData } from './seed-data.js';
import { assertMySQL8 } from './version.js';

export async function seedDatabase(connection, admin) {
  if (process.env.NODE_ENV === 'production' && admin) throw new Error('Provision production administrators with admin:create, not seed.');
  await assertMySQL8(connection);
  const [migrations] = await connection.execute('SELECT name FROM schema_migrations WHERE name = ?', ['002_newsletter_consent.sql']);
  if (!migrations.length) throw new Error('Run migrations before seeding.');
  await connection.beginTransaction();
  try {
    const destinationIds = {};
    for (const item of destinationData) {
      await connection.execute(`INSERT INTO destinations (slug, name, region, short_desc, description, image, why_visit, top_places, travel_info, featured, sort)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE slug = slug`,
        [item.slug, item.name, item.region, item.short_desc, item.description, item.image, JSON.stringify(item.why_visit), JSON.stringify(item.top_places.map(([name, description]) => ({ name, description, image: item.image }))), JSON.stringify(item.travel_info), item.featured, item.sort]);
      const [rows] = await connection.execute('SELECT id FROM destinations WHERE slug = ?', [item.slug]);
      destinationIds[item.slug] = rows[0].id;
    }
    for (const item of packageData) {
      await connection.execute(`INSERT INTO packages (slug, title, destination_id, route, category, duration_days, price, rating, image, gallery, short_desc, highlights, itinerary, inclusions, exclusions, info, best_seller, featured, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published') ON DUPLICATE KEY UPDATE slug = slug`,
        [item.slug, item.title, destinationIds[item.destination], item.route, item.category, item.duration_days, item.price, null, item.image, JSON.stringify([item.image]), item.short_desc, JSON.stringify(item.highlights), JSON.stringify(item.itinerary), JSON.stringify(item.inclusions), JSON.stringify(item.exclusions), JSON.stringify(item.info), item.best_seller, item.featured]);
    }
    for (const item of experienceData) {
      await connection.execute(`INSERT INTO experiences (slug, name, image, description, examples, sort) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE slug = slug`,
        [item.slug, item.name, item.image, item.description, JSON.stringify(item.examples), item.sort]);
    }
    if (admin) {
      const passwordHash = await bcrypt.hash(admin.password, 12);
      // Never reset an existing administrator password during a seed.
      await connection.execute('INSERT INTO admins (email, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE email = email', [admin.email, passwordHash]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}
