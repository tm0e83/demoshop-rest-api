import express, { Request, Response } from 'express';
import { db } from '../firebase.js';
const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  const snapshot = await db.collection('categories').get();
  const categories: Category[] = snapshot.docs.map((doc) => doc.data() as Category);
  res.json(categories);
});

export { router as categoriesRouter };