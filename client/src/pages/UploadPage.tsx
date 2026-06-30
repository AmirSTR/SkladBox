import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AlertCircle, Ban, CheckCircle, Clock, Download, FileSpreadsheet, FileText, Upload as UploadIcon } from 'lucide-react';
import { apiFetch } from '../api';
import { Header } from '../components/Header';
import { KpiCard } from '../components/KpiCard';
import { OrderSummary } from '../components/OrderSummary';
import { OrderTable } from '../components/OrderTable';
import { UploadCard } from '../components/UploadCard';
import type { Upload } from '../types';
import { getOrderItems } from '../utils/calculations';
import { downloadTemplate } from '../utils/excel';

const FILE_ERROR =
  'Не удалось прочитать файл. Проверьте названия колонок.';

export function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [latestUpload, setLatestUpload] = useState<Upload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    async function loadLatestUpload() {
      try {
        const data = await apiFetch<{ upload: Upload | null }>(
          '/uploads/latest',
        );
        setLatestUpload(data.upload);
      } catch (caughtError) {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Не удалось загрузить данные.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadLatestUpload();
  }, []);

  const items = latestUpload?.items ?? [];
  const orderItems = useMemo(() => getOrderItems(items), [items]);
  const supplierCount = useMemo(() => {
    if (!latestUpload) {
      return 0;
    }

    if (!latestUpload.hasSupplierColumn) {
      return null;
    }

    return new Set(
      orderItems
        .map((item) => item.supplierName?.trim())
        .filter((name): name is string => Boolean(name)),
    ).size;
  }, [latestUpload, orderItems]);
  const budget = useMemo(() => {
    if (!latestUpload) {
      return 0;
    }

    if (!latestUpload.hasCostColumn) {
      return null;
    }

    return orderItems.reduce(
      (sum, item) => sum + item.recommendedQty * (item.costPrice ?? 0),
      0,
    );
  }, [latestUpload, orderItems]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setError(FILE_ERROR);
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    setIsUploading(true);
    setError(null);

    try {
      const data = await apiFetch<{ upload: Upload }>('/uploads/excel', {
        method: 'POST',
        body: formData,
      });
      setLatestUpload(data.upload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : FILE_ERROR,
      );
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  const hasUploadedFile = Boolean(latestUpload);

  return (
    <>
      <input
        accept=".xlsx,.xls"
        aria-label="Загрузить Excel"
        className="hidden"
        onChange={handleFileChange}
        ref={fileInputRef}
        type="file"
      />

      <Header
        actions={
          <>
            <button
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold text-teal-700 transition hover:bg-teal-50"
              onClick={() => void downloadTemplate()}
              type="button"
            >
              <Download aria-hidden className="h-5 w-5" />
              Скачать шаблон
            </button>
            <button
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-teal-600 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <UploadIcon aria-hidden className="h-5 w-5" />
              {isUploading ? 'Загрузка...' : 'Загрузить Excel'}
            </button>
          </>
        }
        subtitle="Загрузите Excel и получите список товаров, которые скоро закончатся"
        title="Что заказать сегодня"
      />

      {(latestUpload || error) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {latestUpload && (
            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <FileSpreadsheet aria-hidden className="h-5 w-5" />
              </span>
              <span className="max-w-[260px] truncate text-sm font-semibold sm:max-w-sm">
                {latestUpload.fileName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle aria-hidden className="h-4 w-4" />
                Загружен
              </span>
            </div>
          )}

          {error && (
            <p className="rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
              {error}
            </p>
          )}
        </div>
      )}

      {!hasUploadedFile && !isLoading && (
        <UploadCard onUploadClick={() => fileInputRef.current?.click()} />
      )}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={FileText}
          title="Проанализировано"
          tone="teal"
          value={latestUpload?.totalItems ?? 0}
        />
        <KpiCard
          icon={AlertCircle}
          title="Срочно заказать"
          tone="red"
          value={latestUpload?.urgentCount ?? 0}
        />
        <KpiCard
          icon={Clock}
          title="Скоро закончатся"
          tone="amber"
          value={latestUpload?.soonCount ?? 0}
        />
        <KpiCard
          icon={Ban}
          title="В стопе"
          tone="red"
          value={latestUpload?.stopCount ?? 0}
        />
      </section>

      <section className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_390px]">
        <OrderTable items={orderItems} />
        <OrderSummary
          budget={budget}
          hasUploadedFile={hasUploadedFile}
          positionsCount={orderItems.length}
          supplierCount={supplierCount}
        />
      </section>
    </>
  );
}
