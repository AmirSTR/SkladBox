import { FormEvent, useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { apiFetch } from '../api';
import { Header } from '../components/Header';
import type { Supplier } from '../types';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadSuppliers() {
    const data = await apiFetch<{ suppliers: Supplier[] }>('/suppliers');
    setSuppliers(data.suppliers);
  }

  useEffect(() => {
    loadSuppliers().catch((caughtError) => {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Не удалось загрузить поставщиков.',
      );
    });
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    try {
      const data = await apiFetch<{ supplier: Supplier }>('/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setSuppliers((current) => {
        const withoutDuplicate = current.filter(
          (supplier) => supplier.id !== data.supplier.id,
        );
        return [...withoutDuplicate, data.supplier].sort((a, b) =>
          a.name.localeCompare(b.name, 'ru'),
        );
      });
      setName('');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Не удалось добавить поставщика.',
      );
    }
  }

  async function handleDelete(id: string) {
    setError(null);

    try {
      await apiFetch(`/suppliers/${id}`, { method: 'DELETE' });
      setSuppliers((current) =>
        current.filter((supplier) => supplier.id !== id),
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Не удалось удалить поставщика.',
      );
    }
  }

  return (
    <>
      <Header
        subtitle="Список поставщиков компании. Поставщики из Excel добавляются автоматически."
        title="Поставщики"
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <input
            className="min-h-12 flex-1 rounded-2xl border border-slate-200 px-4 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
            onChange={(event) => setName(event.target.value)}
            placeholder="Название поставщика"
            value={name}
          />
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-600 px-5 font-semibold text-white transition hover:bg-teal-700"
            type="submit"
          >
            <Plus aria-hidden className="h-5 w-5" />
            Добавить
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
            {error}
          </p>
        )}

        <div className="mt-6 divide-y divide-slate-100">
          {suppliers.length === 0 ? (
            <div className="flex min-h-56 items-center justify-center text-center text-muted">
              Пока нет поставщиков
            </div>
          ) : (
            suppliers.map((supplier) => (
              <div
                className="flex items-center justify-between gap-4 py-4"
                key={supplier.id}
              >
                <p className="font-semibold text-ink">{supplier.name}</p>
                <button
                  aria-label={`Удалить ${supplier.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-danger-50 hover:text-danger-600"
                  onClick={() => void handleDelete(supplier.id)}
                  type="button"
                >
                  <Trash2 aria-hidden className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
