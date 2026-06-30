import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

export interface AuthedRequest extends Request {
  user: {
    id: string;
    companyId: string;
    name: string;
    email: string;
    companyName: string;
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401).json({ message: 'Нужна авторизация.' });
    return;
  }

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { company: true },
    });

    if (!user || user.companyId !== payload.companyId) {
      res.status(401).json({ message: 'Сессия недействительна.' });
      return;
    }

    (req as AuthedRequest).user = {
      id: user.id,
      companyId: user.companyId,
      name: user.name,
      email: user.email,
      companyName: user.company.name,
    };
    next();
  } catch {
    res.status(401).json({ message: 'Сессия недействительна.' });
  }
}
