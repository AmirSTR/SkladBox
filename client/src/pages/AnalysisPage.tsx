import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Header } from '../components/Header';
import type { InventoryItem, StockStatus, Upload } from '../types';
import {
  formatCompactNumber,
  formatDateTime,
  formatStockDays,
} from '../utils/calculations';

const statusClasses: Record<StockStatus, string> = {
  'В стопе': 'bg-danger-50 text-danger-600',
  Срочно: 'bg-danger-50 text-danger-600',
  Скоро: 'bg-amber-50 text-amber-600',
  Норма: 'bg-emerald-50 text-emerald-700',
};

export function AnalysisPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [selectedUpload, setSelectedUpload] = useState<Upload | null>(null);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [isItemsLoading, setIsItemsLoading] = useState(false);

  useEffect(() => {
    async function loadUploads() {
      try {
        const data = await apiFetch<{ uploads: Upload[] }>('/uploads');
        setUploads(data.uploads);

        if (data.uploads.length > 0) {
          void loadUploadItems(data.uploads[0]);
        }
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Не удалось загрузить историю.',
        );
      }
    }

    void loadUploads();
  }, []);

  async function loadUploadItems(upload: Upload) {
    setSelectedUpload(upload);
    setSelectedItems([]);
    setItemsError(null);
    setIsItemsLoading(true);

    try {
      const data = await apiFetch<{ items: InventoryItem[] }>(
        `/uploads/${upload.id}/items`,
      );
      setSelectedItems(data.items);
    } catch (caughtError) {
      setItemsError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Не удалось открыть загруженный файл.',
      );
    } finally {
      setIsItemsLoading(false);
    }
  }

  return (
    <>
      <Header
        subtitle="История Excel-загрузок и рассчитанных складских рисков"
        title="Анализ"
      />

      {error && (
        <p className="rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
        {uploads.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center text-center">
            <p className="text-xl font-semibold text-ink">
              История загрузок пуста
            </p>
            <p className="mt-2 text-muted">
              После первой загрузки Excel здесь появится аналитика.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-medium text-muted">
                  <th className="pb-4 pr-5">Дата</th>
                  <th className="pb-4 pr-5">Файл</th>
                  <th className="pb-4 pr-5">Проанализировано</th>
                  <th className="pb-4 pr-5">Срочно</th>
                  <th className="pb-4 pr-5">Скоро</th>
                  <th className="pb-4 pr-5">В стопе</th>
                  <th className="pb-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => {
                  const isSelected = selectedUpload?.id === upload.id;

                  return (
                    <tr
                      className={`border-b border-slate-100 last:border-b-0 ${
                        isSelected ? 'bg-teal-50/60' : ''
                      }`}
                      key={upload.id}
                    >
                      <td className="py-4 pr-5 text-muted">
                        {formatDateTime(upload.createdAt)}
                      </td>
                      <td className="py-4 pr-5 font-semibold text-ink">
                        {upload.fileName}
                      </td>
                      <td className="py-4 pr-5">{upload.totalItems}</td>
                      <td className="py-4 pr-5 text-danger-600">
                        {upload.urgentCount}
                      </td>
                      <td className="py-4 pr-5 text-amber-600">
                        {upload.soonCount}
                      </td>
                      <td className="py-4 pr-5 text-danger-600">
                        {upload.stopCount}
                      </td>
                      <td className="py-4 text-right">
                        <button
                          className="rounded-xl px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
                          onClick={() => void loadUploadItems(upload)}
                          type="button"
                        >
                          {isSelected ? 'Открыт' : 'Открыть'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedUpload && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-muted">
                Состав загрузки
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">
                {selectedUpload.fileName}
              </h2>
            </div>
            <p className="text-sm text-muted">
              {formatDateTime(selectedUpload.createdAt)}
            </p>
          </div>

          {itemsError && (
            <p className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
              {itemsError}
            </p>
          )}

          {isItemsLoading ? (
            <div className="mt-6 flex min-h-52 items-center justify-center rounded-2xl bg-slate-50 text-muted">
              Загружаем позиции...
            </div>
          ) : selectedItems.length === 0 ? (
            <div className="mt-6 flex min-h-52 items-center justify-center rounded-2xl bg-slate-50 text-center text-muted">
              В этом файле не найдено позиций.
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-sm font-medium text-muted">
                    <th className="pb-4 pr-5">Товар</th>
                    <th className="pb-4 pr-5">Поставщик</th>
                    <th className="pb-4 pr-5">Остаток</th>
                    <th className="pb-4 pr-5">Хватит на</th>
                    <th className="pb-4 pr-5">Статус</th>
                    <th className="pb-4 text-right">Заказать</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItems.map((item) => (
                    <tr
                      className="border-b border-slate-100 last:border-b-0"
                      key={item.id}
                    >
                      <td className="py-4 pr-5 font-semibold text-ink">
                        {item.productName}
                      </td>
                      <td className="py-4 pr-5 text-muted">
                        {item.supplierName || '—'}
                      </td>
                      <td className="py-4 pr-5 text-ink">
                        {formatCompactNumber(item.currentStock)}
                      </td>
                      <td className="py-4 pr-5 text-ink">
                        {formatStockDays(item.stockDays)}
                      </td>
                      <td className="py-4 pr-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusClasses[item.status]}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 text-right text-base font-bold text-teal-700">
                        {formatCompactNumber(item.recommendedQty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
