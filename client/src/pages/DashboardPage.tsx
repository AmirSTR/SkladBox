import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Ban, Clock, FileText } from 'lucide-react';
import { apiFetch } from '../api';
import { Header } from '../components/Header';
import { KpiCard } from '../components/KpiCard';
import { OrderTable } from '../components/OrderTable';
import type { Upload } from '../types';
import { getOrderItems } from '../utils/calculations';

export function DashboardPage() {
  const [latestUpload, setLatestUpload] = useState<Upload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderItems = useMemo(
    () => getOrderItems(latestUpload?.items ?? []),
    [latestUpload],
  );

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

  return (
    <>
      <Header
        subtitle="Последняя загрузка и быстрый обзор рисков по складу"
        title="Дашборд"
      />

      {error && (
        <p className="rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      {!latestUpload && !isLoading ? (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-soft">
          <p className="text-xl font-semibold text-ink">Пока нет данных</p>
          <p className="mt-2 text-muted">
            Загрузите Excel-файл, чтобы увидеть аналитику склада.
          </p>
        </section>
      ) : (
        <>
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
          <OrderTable items={orderItems} />
        </>
      )}
    </>
  );
}
