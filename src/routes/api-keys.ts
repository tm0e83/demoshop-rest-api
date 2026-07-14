import express, { Request, Response } from 'express';
import { verifyAdmin } from '../middleware/verify-admin.js';
import { db } from '../firebase.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/list', async (req: Request, res: Response) => {
  const snapshot = await db.collection('apiKeys').get();
  const keys = snapshot.docs.map((doc) => ({
    id: doc.id,
    label: doc.data().label,
    createdAt: doc.data().createdAt.toDate(),
    lastUsedAt: doc.data().lastUsedAt.toDate(),
    revoked: doc.data().revoked
  }))

  res.json(keys);
});

export { router as apiKeysRouter };