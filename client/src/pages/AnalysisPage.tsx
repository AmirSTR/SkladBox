import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Header } from '../components/Header';
import type { Upload } from '../types';
import { formatDateTime } from '../utils/calculations';

export function AnalysisPage() {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUploads() {
      try {
        const data = await apiFetch<{ uploads: Upload[] }>('/uploads');
        setUploads(data.uploads);
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
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm font-medium text-muted">
                  <th className="pb-4 pr-5">Дата</th>
                  <th className="pb-4 pr-5">Файл</th>
                  <th className="pb-4 pr-5">Проанализировано</th>
                  <th className="pb-4 pr-5">Срочно</th>
                  <th className="pb-4 pr-5">Скоро</th>
                  <th className="pb-4">В стопе</th>
                </tr>
              </thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr
                    className="border-b border-slate-100 last:border-b-0"
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
                    <td className="py-4 text-danger-600">
                      {upload.stopCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
