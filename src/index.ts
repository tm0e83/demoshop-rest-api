import chalk from 'chalk';
import express, { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { categoriesRouter } from './routes/categories.js';
import { productsRouter } from './routes/products.js';
import { apiKeysRouter } from './routes/api-keys.js';
import { verifyApiKey } from './middleware/verify-api-key.js';
import { errorHandler } from './middleware/error-request-handler.js';

const app = express();
const PORT = Number(process.env.PORT) || 8080;

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

app.use('/apikeys', apiKeysRouter);
app.use(verifyApiKey);
app.use('/categories', categoriesRouter);
app.use('/products', productsRouter);
app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log(chalk.green('✓ Server running'));
  console.log(chalk.cyan(`  → http://localhost:${PORT}/`));
});
