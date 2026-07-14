import express, { Request, Response } from 'express';
import { db } from '../firebase.js';
const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const snapshot = await db.collection('products').get();
  const products = snapshot.docs.map((doc) => doc.data());
  res.json(products);
});

export { router as productsRouter };