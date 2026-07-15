import express, { Request, Response } from 'express';
import { verifyAdmin } from '../middleware/verify-admin.js';
import crypto from 'crypto';
import { db } from '../firebase.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/list', async (req: Request, res: Response) => {
  const snapshot = await db.collection('apiKeys').get();
  const keys: Omit<ApiKey, 'hash'>[] = snapshot.docs.map((doc) => ({
    id: doc.id,
    label: doc.data().label,
    createdAt: doc.data().createdAt.toDate(),
    lastUsedAt: doc.data().lastUsedAt.toDate(),
    revoked: doc.data().revoked
  }));

  res.json(keys);
});

router.post('/create', async (req: Request, res: Response) => {
  const label = req.body.label;

  if (!label) {
    res.status(400).json({ message: 'Label is required' });
    return;
  }

  const rawKey = `sk_${crypto.randomBytes(32).toString('hex')}`;
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const newKey: Omit<ApiKey, 'id'> = { label, createdAt: new Date(), lastUsedAt: null, revoked: false, hash: hash };
  const docRef = await db.collection('apiKeys').add(newKey);

  res.json({ apiKey: rawKey, id: docRef.id });
});

router.patch('/revoke/:id', async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await db.collection('apiKeys').doc(id).update({ revoked: true });
});

export { router as apiKeysRouter };