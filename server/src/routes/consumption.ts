import type { Prisma } from '@prisma/client';
import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { calculateInventoryItem } from '../utils/calculations';
import {
  fetchConsumptionSheet,
  normalizeProductName,
} from '../utils/sheetsConsumption';
import { prisma } from '../utils/prisma';

interface SyncInventoryItem {
  id: string;
  productName: string;
  currentStock: number;
  soldLast30Days: number;
  leadTimeDays: number;
  supplierName: string | null;
  costPrice: number | null;
  dailyUsage: number;
  stockDays: number;
  status: string;
  recommendedQty: number;
}

export const consumptionRoutes = Router();

consumptionRoutes.use(requireAuth);

consumptionRoutes.post('/google-sheets/sync', asyncHandler(async (req, res) => {
  const user = (req as unknown as AuthedRequest).user;
  const { sheetUrl } = req.body as { sheetUrl?: string };

  if (!sheetUrl) {
    res.status(400).json({ message: 'Добавьте ссылку на Google Sheets.' });
    return;
  }

  const latestUpload = await prisma.upload.findFirst({
    where: { companyId: user.companyId },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!latestUpload) {
    res.status(404).json({ message: 'Сначала загрузите остатки Excel.' });
    return;
  }

  const consumption = await fetchConsumptionSheet(sheetUrl);
  const matchedProducts = new Set<string>();
  const uploadItems = latestUpload.items as SyncInventoryItem[];
  const recalculatedItems = uploadItems.map((item: SyncInventoryItem) => {
    const normalizedName = normalizeProductName(item.productName);
    const total = consumption.totalsByProduct.get(normalizedName);

    if (!total) {
      return item;
    }

    matchedProducts.add(normalizedName);
    return {
      ...item,
      ...calculateInventoryItem({
        productName: item.productName,
        currentStock: item.currentStock,
        soldLast30Days: total.quantity,
        leadTimeDays: item.leadTimeDays,
        supplierName: item.supplierName ?? undefined,
        costPrice: item.costPrice ?? undefined,
      }),
    };
  });
  const updatedItems = recalculatedItems.filter((item: SyncInventoryItem) =>
    matchedProducts.has(normalizeProductName(item.productName)),
  );
  const unmatchedProducts = Array.from(consumption.totalsByProduct.entries())
    .filter(([productName]) => !matchedProducts.has(productName))
    .map(([, total]) => total.productName);
  const urgentCount = recalculatedItems.filter((item: SyncInventoryItem) => item.status === 'Срочно').length;
  const soonCount = recalculatedItems.filter((item: SyncInventoryItem) => item.status === 'Скоро').length;
  const stopCount = recalculatedItems.filter((item: SyncInventoryItem) => item.status === 'В стопе').length;

  const upload = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await Promise.all(
      updatedItems.map((item: SyncInventoryItem) =>
        tx.inventoryItem.update({
          where: { id: item.id },
          data: {
            soldLast30Days: item.soldLast30Days,
            dailyUsage: item.dailyUsage,
            stockDays: item.stockDays,
            status: item.status,
            recommendedQty: item.recommendedQty,
          },
        }),
      ),
    );

    await tx.upload.update({
      where: { id: latestUpload.id },
      data: {
        urgentCount,
        soonCount,
        stopCount,
      },
    });

    return tx.upload.findUniqueOrThrow({
      where: { id: latestUpload.id },
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  });

  res.json({
    upload,
    sync: {
      rowsRead: consumption.rowsRead,
      rowsUsed: consumption.rowsUsed,
      ignoredRows: consumption.ignoredRows,
      productsUpdated: updatedItems.length,
      unmatchedProducts: unmatchedProducts.slice(0, 10),
      unmatchedProductsCount: unmatchedProducts.length,
      periodDays: 30,
      syncedAt: new Date().toISOString(),
    },
  });
}));
