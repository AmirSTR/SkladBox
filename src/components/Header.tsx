import { CheckCircle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import type { UploadedFileInfo } from '../types';

interface HeaderProps {
  fileInfo: UploadedFileInfo | null;
  error: string | null;
  onDownloadTemplate: () => void;
  onUploadClick: () => void;
}

export function Header({
  fileInfo,
  error,
  onDownloadTemplate,
  onUploadClick,
}: HeaderProps) {
  return (
    <header className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-normal text-ink sm:text-5xl">
            Что заказать сегодня
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-muted">
            Загрузите Excel и получите список товаров, которые скоро закончатся
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold text-teal-700 transition hover:bg-teal-50"
            onClick={onDownloadTemplate}
            type="button"
          >
            <Download aria-hidden className="h-5 w-5" />
            Скачать шаблон
          </button>
          <button
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-teal-600 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700"
            onClick={onUploadClick}
            type="button"
          >
            <Upload aria-hidden className="h-5 w-5" />
            Загрузить Excel
          </button>
        </div>
      </div>

      {(fileInfo || error) && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {fileInfo && (
            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-ink shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <FileSpreadsheet aria-hidden className="h-5 w-5" />
              </span>
              <span className="max-w-[260px] truncate text-sm font-semibold sm:max-w-sm">
                {fileInfo.fileName}
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
    </header>
  );
}
