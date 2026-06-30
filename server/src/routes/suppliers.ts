import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../utils/prisma';

export const supplierRoutes = Router();

supplierRoutes.use(requireAuth);

supplierRoutes.get('/', asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const suppliers = await prisma.supplier.findMany({
    where: { companyId: user.companyId },
    orderBy: { name: 'asc' },
  });

  res.json({ suppliers });
}));

supplierRoutes.post('/', asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const { name } = req.body as { name?: string };
  const trimmedName = name?.trim();

  if (!trimmedName) {
    res.status(400).json({ message: 'Введите название поставщика.' });
    return;
  }

  const supplier = await prisma.supplier.upsert({
    where: {
      companyId_name: {
        companyId: user.companyId,
        name: trimmedName,
      },
    },
    update: {},
    create: {
      name: trimmedName,
      companyId: user.companyId,
    },
  });

  res.status(201).json({ supplier });
}));

supplierRoutes.delete('/:id', asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const supplier = await prisma.supplier.findFirst({
    where: {
      id: req.params.id,
      companyId: user.companyId,
    },
  });

  if (!supplier) {
    res.status(404).json({ message: 'Поставщик не найден.' });
    return;
  }

  await prisma.supplier.delete({ where: { id: supplier.id } });
  res.status(204).send();
}));
