import { ClipboardCopy, FileDown, Mail, PackageCheck, TrendingDown, Wallet } from 'lucide-react';
import { useState } from 'react';
import {
  createSupplierOrderEmail,
  formatCompactNumber,
  formatCurrency,
  type SupplierOrderGroup,
} from '../utils/calculations';
import { downloadSupplierOrder } from '../utils/excel';

interface SupplierOrdersProps {
  groups: SupplierOrderGroup[];
}

export function SupplierOrders({ groups }: SupplierOrdersProps) {
  const [copiedSupplier, setCopiedSupplier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (groups.length === 0) {
    return null;
  }

  async function handleCopyEmail(group: SupplierOrderGroup) {
    try {
      await navigator.clipboard.writeText(createSupplierOrderEmail(group));
      setCopiedSupplier(group.supplierName);
      setError(null);
    } catch {
      setError('Не удалось скопировать письмо.');
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Автоматизация закупки
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">
            Черновики заказов по поставщикам
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-sm font-semibold text-teal-700">
          <PackageCheck aria-hidden className="h-4 w-4" />
          {groups.length} {getSupplierLabel(groups.length)}
        </span>
      </div>

      {error && (
        <p className="mt-5 rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {groups.map((group) => (
          <article
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5"
            key={group.supplierName}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-muted ring-1 ring-slate-200">
                  Черновик
                </div>
                <h3 className="mt-3 text-xl font-bold text-ink">
                  {group.supplierName}
                </h3>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted">Позиций</p>
                <p className="mt-1 text-2xl font-bold text-ink">
                  {group.positionsCount}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Metric
                icon={PackageCheck}
                label="Заказать"
                value={`${formatCompactNumber(group.totalQty)} шт.`}
              />
              <Metric
                icon={Wallet}
                label="Бюджет"
                value={group.budget === null ? '—' : formatCurrency(group.budget)}
              />
              <Metric
                icon={TrendingDown}
                label="Риск"
                value={
                  group.lostSalesRisk === null
                    ? `${formatCompactNumber(group.riskUnits)} шт.`
                    : formatCurrency(group.lostSalesRisk)
                }
              />
            </div>

            <div className="mt-5 divide-y divide-slate-200 rounded-2xl bg-white px-4">
              {group.items.slice(0, 4).map((item) => (
                <div
                  className="flex items-center justify-between gap-4 py-3"
                  key={item.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-sm text-muted">{item.status}</p>
                  </div>
                  <p className="shrink-0 font-bold text-teal-700">
                    {formatCompactNumber(item.recommendedQty)} шт.
                  </p>
                </div>
              ))}
              {group.items.length > 4 && (
                <p className="py-3 text-sm font-medium text-muted">
                  Еще {group.items.length - 4} поз.
                </p>
              )}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700"
                onClick={() => void downloadSupplierOrder(group)}
                type="button"
              >
                <FileDown aria-hidden className="h-4 w-4" />
                Excel
              </button>
              <button
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-50"
                onClick={() => void handleCopyEmail(group)}
                type="button"
              >
                {copiedSupplier === group.supplierName ? (
                  <Mail aria-hidden className="h-4 w-4" />
                ) : (
                  <ClipboardCopy aria-hidden className="h-4 w-4" />
                )}
                {copiedSupplier === group.supplierName ? 'Скопировано' : 'Письмо'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

interface MetricProps {
  icon: typeof PackageCheck;
  label: string;
  value: string;
}

function Metric({ icon: Icon, label, value }: MetricProps) {
  return (
    <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200">
      <div className="flex items-center gap-2 text-muted">
        <Icon aria-hidden className="h-4 w-4" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
    </div>
  );
}

function getSupplierLabel(count: number): string {
  const lastTwo = count % 100;
  const lastOne = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return 'поставщиков';
  }

  if (lastOne === 1) {
    return 'поставщик';
  }

  if (lastOne >= 2 && lastOne <= 4) {
    return 'поставщика';
  }

  return 'поставщиков';
}
