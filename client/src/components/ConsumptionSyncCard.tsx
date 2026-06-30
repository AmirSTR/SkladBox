import { Link2, RefreshCw, Table2 } from 'lucide-react';
import { useState } from 'react';
import { apiFetch } from '../api';
import type { ConsumptionSyncSummary, Upload } from '../types';

interface ConsumptionSyncCardProps {
  hasUpload: boolean;
  onSynced: (upload: Upload) => void;
}

export function ConsumptionSyncCard({
  hasUpload,
  onSynced,
}: ConsumptionSyncCardProps) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [summary, setSummary] = useState<ConsumptionSyncSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  async function handleSync() {
    const trimmedUrl = sheetUrl.trim();

    if (!trimmedUrl) {
      setError('Добавьте ссылку на Google Sheets.');
      return;
    }

    setIsSyncing(true);
    setError(null);

    try {
      const data = await apiFetch<{
        upload: Upload;
        sync: ConsumptionSyncSummary;
      }>('/consumption/google-sheets/sync', {
        method: 'POST',
        body: JSON.stringify({ sheetUrl: trimmedUrl }),
      });
      setSummary(data.sync);
      onSynced(data.upload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Не удалось синхронизировать расход.',
      );
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end">
        <div className="flex flex-1 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Table2 aria-hidden className="h-6 w-6" strokeWidth={1.9} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted">
              Живой расход
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">
              Google Sheets с барами
            </h2>
            <p className="mt-2 text-base text-muted">
              Система обновит расход за 30 дней по колонкам Товар и Количество.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 lg:w-[520px]">
          <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-teal-500">
            <Link2 aria-hidden className="h-5 w-5 shrink-0 text-muted" />
            <input
              className="min-w-0 flex-1 border-0 bg-transparent py-3 text-base text-ink outline-none placeholder:text-muted"
              onChange={(event) => setSheetUrl(event.target.value)}
              placeholder="https://docs.google.com/spreadsheets/..."
              type="url"
              value={sheetUrl}
            />
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            disabled={!hasUpload || isSyncing}
            onClick={() => void handleSync()}
            type="button"
          >
            <RefreshCw
              aria-hidden
              className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`}
            />
            {isSyncing ? 'Синхронизация...' : 'Обновить расход'}
          </button>
        </div>
      </div>

      {!hasUpload && (
        <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-muted">
          Сначала загрузите Excel с текущими остатками.
        </p>
      )}

      {error && (
        <p className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      {summary && (
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <SummaryPill label="Строк прочитано" value={summary.rowsRead} />
          <SummaryPill label="Взято в расчет" value={summary.rowsUsed} />
          <SummaryPill label="Товаров обновлено" value={summary.productsUpdated} />
          <SummaryPill label="Не совпало" value={summary.unmatchedProductsCount} />
        </div>
      )}
    </section>
  );
}

interface SummaryPillProps {
  label: string;
  value: number;
}

function SummaryPill({ label, value }: SummaryPillProps) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
