import { Package, Users, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface OrderSummaryProps {
  supplierCount: number | null;
  positionsCount: number;
  budget: number | null;
  hasUploadedFile: boolean;
}

export function OrderSummary({
  supplierCount,
  positionsCount,
  budget,
  hasUploadedFile,
}: OrderSummaryProps) {
  const supplierValue = hasUploadedFile
    ? supplierCount === null
      ? '—'
      : supplierCount
    : 0;
  const budgetValue = hasUploadedFile
    ? budget === null
      ? '—'
      : formatCurrency(budget)
    : '0 ₽';
  const canCreateOrder = positionsCount > 0;

  return (
    <aside className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-7">
      <h2 className="text-2xl font-bold tracking-normal text-ink">
        Итог по заказу
      </h2>

      <div className="mt-6 divide-y divide-slate-200">
        <SummaryRow icon={Users} label="Поставщиков" value={supplierValue} />
        <SummaryRow icon={Package} label="Позиций" value={positionsCount} />
        <SummaryRow
          icon={Wallet}
          label="Ориентировочный бюджет"
          value={budgetValue}
        />
      </div>

      <button
        className="mt-7 min-h-14 w-full rounded-2xl bg-teal-600 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
        disabled={!canCreateOrder}
        onClick={() => {
          window.alert('Заказ сформирован для выбранных позиций.');
        }}
        type="button"
      >
        Сформировать заказ
      </button>
    </aside>
  );
}

interface SummaryRowProps {
  icon: typeof Users;
  label: string;
  value: number | string;
}

function SummaryRow({ icon: Icon, label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <Icon aria-hidden className="h-6 w-6" strokeWidth={1.9} />
      </div>
      <p className="flex-1 text-base text-muted">{label}</p>
      <p className="text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
