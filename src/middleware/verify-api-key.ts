import crypto from 'crypto';
import { RequestHandler } from 'express';
import { db } from '../firebase.js';

export const verifyApiKey: RequestHandler = async (req, res, next) => {
  const rawKey = req.headers['x-api-key'];

  if (!rawKey || typeof rawKey !== 'string') {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const snapshot = await db
    .collection('apiKeys')
    .where('hash', '==', hash)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return res.status(401).json({ message: 'Invalid API key' });
  }

  const keyDoc = snapshot.docs[0];
  const keyData = keyDoc.data();

  if (keyData.revoked) {
    return res.status(401).json({ message: 'API key has been revoked' });
  }

  keyDoc.ref.update({ lastUsedAt: new Date() }).catch((error: Error) => {
    console.error('Error updating lastUsedAt:', error);
  });

  next();
};