import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth';

export const settingsRoutes = Router();

settingsRoutes.get('/me', requireAuth, (req, res) => {
  res.json({ user: (req as AuthedRequest).user });
});
