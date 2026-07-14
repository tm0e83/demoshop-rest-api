import { RequestHandler } from 'express';
import { getAuth } from 'firebase-admin/auth';

export const verifyAdmin: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await getAuth().verifyIdToken(token);

    if (!decodedToken.admin) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (decodedToken.admin) {
      next();
    }
  } catch (error) {
    return res.status(403).json({ error: 'Forbidden' });
  }
};