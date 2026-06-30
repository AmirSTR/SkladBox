import bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { prisma } from '../utils/prisma';

export const authRoutes = Router();

authRoutes.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password, companyName } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    companyName?: string;
  };

  if (!name || !email || !password || !companyName) {
    res.status(400).json({ message: 'Заполните все поля.' });
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (existingUser) {
    res.status(409).json({ message: 'Пользователь с таким email уже есть.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { user, company } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdCompany = await tx.company.create({
      data: { name: companyName.trim() },
    });
    const createdUser = await tx.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        companyId: createdCompany.id,
      },
    });

    return {
      user: createdUser,
      company: createdCompany,
    };
  });
  const token = signToken({ userId: user.id, companyId: company.id });

  res.status(201).json({
    token,
    user: toPublicUser(user, company.name),
  });
}));

authRoutes.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ message: 'Введите email и пароль.' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { company: true },
  });

  if (!user) {
    res.status(401).json({ message: 'Неверный email или пароль.' });
    return;
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);

  if (!passwordOk) {
    res.status(401).json({ message: 'Неверный email или пароль.' });
    return;
  }

  const token = signToken({ userId: user.id, companyId: user.companyId });

  res.json({
    token,
    user: toPublicUser(user, user.company.name),
  });
}));

authRoutes.get('/me', requireAuth, (req, res) => {
  const user = (req as AuthedRequest).user;

  res.json({ user });
});

function toPublicUser(
  user: { id: string; name: string; email: string; companyId: string },
  companyName: string,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    companyId: user.companyId,
    companyName,
  };
}
