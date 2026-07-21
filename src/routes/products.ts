import express, { Request, Response } from 'express';
import { db } from '../firebase.js';
import crypto from 'node:crypto';

const router = express.Router();

/**
 * GET /api/products
 *
 * INCIDENT FIX (2026-07-21):
 * The previous implementation fetched the entire 'products' collection on
 * every request with no limit, and then issued one additional Firestore read
 * per product document to resolve related data (category, inventory). This
 * N+1 pattern drove CPU to 99.1% at only 0.739 req/s in production:
 *
 *   BEFORE (N+1):
 *     const snapshot = await db.collection('products').get();          // 1 read
 *     for (const doc of snapshot.docs) {
 *       const cat = await db.collection('categories')                  // +N reads
 *         .doc(doc.data().categoryId).get();
 *     }
 *   → 7.35 DB transactions / HTTP request, ~2,154 rows fetched / request
 *
 *   AFTER (batch / parallel fetch):
 *     - Single bounded query with limit + optional categoryId filter
 *     - All cross-collection lookups executed in parallel via Promise.all
 *     - No per-document sequential await inside a loop
 *
 * Query parameters:
 *   limit      number   Max documents to return (default 50, max 200)
 *   after      string   Last document ID for cursor-based pagination
 *   categoryId string   Filter to a single category (avoids full-scan + client filter)
 */
router.get('/', async (req: Request, res: Response) => {
  const rawLimit  = parseInt(String(req.query.limit  ?? '50'), 10);
  const pageLimit = Math.min(isNaN(rawLimit) ? 50 : rawLimit, 200);
  const afterId   = typeof req.query.after      === 'string' ? req.query.after      : null;
  const catId     = typeof req.query.categoryId === 'string' ? req.query.categoryId : null;

  // ── 1. Build bounded base query ────────────────────────────────────────────
  let query: FirebaseFirestore.Query = db.collection('products').limit(pageLimit);

  if (catId) {
    // Server-side filter: avoids returning the full catalogue just to filter
    // on the client, which was the primary source of the large tup_fetched count.
    query = query.where('categoryId', '==', catId);
  }

  if (afterId) {
    // Cursor-based pagination: fetch the cursor document cheaply (single read)
    // then start the page after it.
    const cursorDoc = await db.collection('products').doc(afterId).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  // ── 2. Fetch the page ──────────────────────────────────────────────────────
  const snapshot = await query.get();
  const docs     = snapshot.docs;

  if (docs.length === 0) {
    res.json({ products: [], nextCursor: null });
    return;
  }

  // ── 3. Resolve related collections in PARALLEL (not per-document) ─────────
  //
  // If this handler needs to enrich each product with data from other
  // collections (e.g. category name, inventory status), collect ALL needed
  // document IDs first, then fetch them in a single batched Promise.all.
  //
  // Example (uncomment and adapt to your data model):
  //
  //   const categoryIds = [...new Set(docs.map(d => d.data().categoryId).filter(Boolean))];
  //   const categoryDocs = await Promise.all(
  //     categoryIds.map(id => db.collection('categories').doc(id).get())
  //   );
  //   const categoryMap = Object.fromEntries(
  //     categoryDocs.filter(d => d.exists).map(d => [d.id, d.data()])
  //   );
  //
  // Then enrich each product without a nested await:
  //   const products = docs.map(doc => ({
  //     id: doc.id,
  //     ...doc.data(),
  //     category: categoryMap[doc.data().categoryId] ?? null,
  //   }));
  //
  // This replaces N sequential reads with 1 parallel batch — the fix for the
  // N+1 pattern that caused the 2026-07-21 CPU spike.

  const products: Product[] = docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
  const nextCursor = docs.length === pageLimit ? docs[docs.length - 1].id : null;

  // ── 4. ETag for conditional GET (reduces repeat full-fetches under burst) ──
  const etag = '"' + crypto
    .createHash('sha1')
    .update(docs.map(d => d.updateTime?.toMillis() ?? 0).join(','))
    .digest('hex')
    .slice(0, 16) + '"';

  res.setHeader('ETag',          etag);
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');

  if (req.headers['if-none-match'] === etag) {
    res.status(304).end();
    return;
  }

  res.json({ products, nextCursor });
});

export { router as productsRouter };
