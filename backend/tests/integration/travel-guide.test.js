import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET ||= 'test-access-secret-not-for-production';
process.env.JWT_REFRESH_SECRET ||= 'test-refresh-secret-not-for-production';

import assert from 'node:assert';
import { before, after, test } from 'node:test';
import { createServer } from 'node:http';
import app from '../../src/app.js';
import { getSequelize } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { migrateUp } from '../../src/db/runner.js';

let server;
let baseUrl;
let db;

async function api(method, path) {
  const res = await fetch(`${baseUrl}${path}`, { method });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

test('Travel Guide CMS → DB → Public API Pipeline Test Suite', async (t) => {
  before(async () => {
    db = getSequelize();
    await migrateUp(db);
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test('CMS Creation and Public API Delivery', async () => {
    const models = initModels();
    const suffix = Date.now().toString(36);

    const region = await models.TravelGuideRegion.create({
      name: `Aegean Region ${suffix}`,
      slug: `aegean-region-${suffix}`,
      status: 'published',
    });

    const destination = await models.TravelGuideDestination.create({
      regionId: region.id,
      name: `Bodrum Peninsula ${suffix}`,
      slug: `bodrum-peninsula-${suffix}`,
      description: 'Stunning Aegean coastline with turquoise bays.',
      status: 'published',
    });

    const article = await models.TravelGuideArticle.create({
      destinationId: destination.id,
      title: `Top 5 Hidden Bays in Bodrum ${suffix}`,
      slug: `top-5-hidden-bays-bodrum-${suffix}`,
      excerpt: 'Discover secret coves accessible only by boat.',
      content: 'Detailed guide to Bodrum bays.',
      status: 'published',
    });

    // 1. GET /api/v1/travel-guide/regions
    const resRegions = await api('GET', '/api/v1/travel-guide/regions');
    assert.strictEqual(resRegions.status, 200);
    assert.ok(Array.isArray(resRegions.json.data));
    const foundReg = resRegions.json.data.find((r) => r.slug === region.slug);
    assert.ok(foundReg);

    // 2. GET /api/v1/travel-guide/destinations
    const resDests = await api('GET', '/api/v1/travel-guide/destinations');
    assert.strictEqual(resDests.status, 200);
    assert.ok(Array.isArray(resDests.json.data));
    const foundDest = resDests.json.data.find((d) => d.slug === destination.slug);
    assert.ok(foundDest);

    // 3. GET /api/v1/travel-guide/articles
    const resArticles = await api('GET', '/api/v1/travel-guide/articles');
    assert.strictEqual(resArticles.status, 200);
    assert.ok(Array.isArray(resArticles.json.data));
    const foundArt = resArticles.json.data.find((a) => a.slug === article.slug);
    assert.ok(foundArt);

    // Cleanup created test records
    await article.destroy();
    await destination.destroy();
    await region.destroy();
  });
});
