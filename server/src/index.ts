import cors from 'cors';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { authRoutes } from './routes/auth';
import { settingsRoutes } from './routes/settings';
import { supplierRoutes } from './routes/suppliers';
import { uploadRoutes } from './routes/uploads';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const clientDistPath = path.join(__dirname, '../../client/dist');

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api', settingsRoutes);

app.use('/api', (error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
});

app.use(express.static(clientDistPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ message: 'API route not found.' });
    return;
  }

  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`АнтиСтоп запущен на порту ${port}`);
});
