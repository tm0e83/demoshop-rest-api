import chalk from 'chalk';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { categoriesRouter } from './routes/categories.js';
import { productsRouter } from './routes/products.js';

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
app.use(limiter);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API works' });
});

app.use('/categories', categoriesRouter);
app.use('/products', productsRouter);

app.listen(PORT, () => {
  console.log(chalk.green('✓ Server running'));
  console.log(chalk.cyan(`  → http://localhost:${PORT}/`));
});