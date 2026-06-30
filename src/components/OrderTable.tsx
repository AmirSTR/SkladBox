import { ClipboardList } from 'lucide-react';
import type { InventoryItem, StockStatus } from '../types';
import { formatCompactNumber, formatStockDays } from '../utils/calculations';

interface OrderTableProps {
  items: InventoryItem[];
}

const badgeClasses: Record<StockStatus, string> = {
  'В стопе': 'bg-danger-50 text-danger-600',
  Срочно: 'bg-danger-50 text-danger-600',
  Скоро: 'bg-amber-50 text-amber-600',
  Норма: 'bg-emerald-50 text-emerald-700',
};

export function OrderTable({ items }: OrderTableProps) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft sm:p-7">
      <h2 className="text-2xl font-bold tracking-normal text-ink">
        Нужно заказать сегодня
      </h2>

      {items.length === 0 ? (
        <div className="mt-8 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50/70 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <ClipboardList aria-hidden className="h-8 w-8" strokeWidth={1.8} />
          </div>
          <p className="mt-5 text-xl font-semibold text-ink">
            Пока нет товаров для заказа
          </p>
          <p className="mt-2 max-w-md text-base text-muted">
            Загрузите Excel-файл, чтобы увидеть рекомендации
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-medium text-muted">
                <th className="pb-4 pr-5">Товар</th>
                <th className="pb-4 pr-5">Остаток</th>
                <th className="pb-4 pr-5">Хватит на</th>
                <th className="pb-4 pr-5">Поставка</th>
                <th className="pb-4 pr-5">Статус</th>
                <th className="pb-4 text-right">Заказать</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  className="border-b border-slate-100 last:border-b-0"
                  key={item.id}
                >
                  <td className="py-4 pr-5">
                    <div>
                      <p className="font-semibold text-ink">
                        {item.productName}
                      </p>
                      {item.supplier && (
                        <p className="mt-1 text-sm text-muted">
                          {item.supplier}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 pr-5 text-ink">
                    {formatCompactNumber(item.currentStock)}
                  </td>
                  <td className="py-4 pr-5 text-ink">
                    {formatStockDays(item.stockDays)}
                  </td>
                  <td className="py-4 pr-5 text-ink">
                    {formatCompactNumber(item.leadTimeDays)} дн.
                  </td>
                  <td className="py-4 pr-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${badgeClasses[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 text-right text-base font-bold text-teal-700">
                    {formatCompactNumber(item.orderQuantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
