import { FileUp, Upload } from 'lucide-react';

interface UploadCardProps {
  onUploadClick: () => void;
}

export function UploadCard({ onUploadClick }: UploadCardProps) {
  return (
    <section className="rounded-2xl border border-dashed border-teal-200 bg-white px-6 py-8 shadow-soft sm:px-10 sm:py-10">
      <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <FileUp aria-hidden className="h-10 w-10" strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-normal text-ink">
              Загрузите Excel-файл, чтобы начать анализ
            </h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Нужны колонки: Товар, Остаток сейчас, Продано за 30 дней, Срок
              поставки, дней
            </p>
          </div>
        </div>

        <button
          className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-teal-600 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 sm:w-auto"
          onClick={onUploadClick}
          type="button"
        >
          <Upload aria-hidden className="h-5 w-5" />
          Выбрать файл
        </button>
      </div>
    </section>
  );
}
