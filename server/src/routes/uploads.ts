import multer from 'multer';
import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { calculateInventoryItem } from '../utils/calculations';
import { EXCEL_READ_ERROR, parseInventoryWorkbook } from '../utils/excel';
import { prisma } from '../utils/prisma';

export const uploadRoutes = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

uploadRoutes.use(requireAuth);

uploadRoutes.post('/excel', upload.single('file'), asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: EXCEL_READ_ERROR });
    return;
  }

  try {
    const parsed = parseInventoryWorkbook(file.buffer);
    const items = parsed.rows.map(calculateInventoryItem);
    const urgentCount = items.filter((item) => item.status === 'Срочно').length;
    const soonCount = items.filter((item) => item.status === 'Скоро').length;
    const stopCount = items.filter((item) => item.status === 'В стопе').length;
    const supplierNames = Array.from(
      new Set(
        items
          .map((item) => item.supplierName?.trim())
          .filter((name): name is string => Boolean(name)),
      ),
    );

    const createdUpload = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await Promise.all(
        supplierNames.map((name) =>
          tx.supplier.upsert({
            where: {
              companyId_name: {
                companyId: user.companyId,
                name,
              },
            },
            update: {},
            create: {
              name,
              companyId: user.companyId,
            },
          }),
        ),
      );

      return tx.upload.create({
        data: {
          fileName: file.originalname,
          totalItems: items.length,
          urgentCount,
          soonCount,
          stopCount,
          hasSupplierColumn: parsed.hasSupplierColumn,
          hasCostColumn: parsed.hasCostColumn,
          companyId: user.companyId,
          userId: user.id,
          items: {
            create: items.map((item) => ({
              productName: item.productName,
              currentStock: item.currentStock,
              soldLast30Days: item.soldLast30Days,
              leadTimeDays: item.leadTimeDays,
              supplierName: item.supplierName,
              costPrice: item.costPrice,
              dailyUsage: item.dailyUsage,
              stockDays: item.stockDays,
              status: item.status,
              recommendedQty: item.recommendedQty,
              companyId: user.companyId,
            })),
          },
        },
        include: {
          items: true,
        },
      });
    });

    res.status(201).json({ upload: createdUpload });
  } catch {
    res.status(400).json({ message: EXCEL_READ_ERROR });
  }
}));

uploadRoutes.get('/latest', asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const latestUpload = await prisma.upload.findFirst({
    where: { companyId: user.companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  res.json({ upload: latestUpload });
}));

uploadRoutes.get('/', asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const uploads = await prisma.upload.findMany({
    where: { companyId: user.companyId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      totalItems: true,
      urgentCount: true,
      soonCount: true,
      stopCount: true,
      createdAt: true,
    },
  });

  res.json({ uploads });
}));

uploadRoutes.get('/:id/items', asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const uploadWithItems = await prisma.upload.findFirst({
    where: {
      id: req.params.id,
      companyId: user.companyId,
    },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!uploadWithItems) {
    res.status(404).json({ message: 'Загрузка не найдена.' });
    return;
  }

  res.json({ items: uploadWithItems.items });
}));
