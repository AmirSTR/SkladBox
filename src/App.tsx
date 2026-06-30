import { useMemo, useRef, useState } from 'react';
import { AlertCircle, Ban, Clock, FileText } from 'lucide-react';
import { Header } from './components/Header';
import { KpiCard } from './components/KpiCard';
import { OrderSummary } from './components/OrderSummary';
import { OrderTable } from './components/OrderTable';
import { Sidebar } from './components/Sidebar';
import { UploadCard } from './components/UploadCard';
import type { InventoryItem, UploadedFileInfo } from './types';
import {
  calculateInventoryItems,
  getOrderItems,
} from './utils/calculations';
import { downloadTemplate, parseInventoryFile } from './utils/excel';

const FILE_ERROR =
  'Не удалось прочитать файл. Проверьте названия колонок.';

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [fileInfo, setFileInfo] = useState<UploadedFileInfo | null>(null);
  const [hasSupplierColumn, setHasSupplierColumn] = useState(false);
  const [hasCostColumn, setHasCostColumn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasUploadedFile = Boolean(fileInfo);
  const orderItems = useMemo(() => getOrderItems(items), [items]);
  const kpis = useMemo(
    () => ({
      analyzed: items.length,
      urgent: items.filter((item) => item.status === 'Срочно').length,
      soon: items.filter((item) => item.status === 'Скоро').length,
      stopped: items.filter((item) => item.status === 'В стопе').length,
    }),
    [items],
  );
  const supplierCount = useMemo(() => {
    if (!hasUploadedFile) {
      return 0;
    }

    if (!hasSupplierColumn) {
      return null;
    }

    return new Set(
      orderItems
        .map((item) => item.supplier?.trim())
        .filter((supplier): supplier is string => Boolean(supplier)),
    ).size;
  }, [hasSupplierColumn, hasUploadedFile, orderItems]);
  const budget = useMemo(() => {
    if (!hasUploadedFile) {
      return 0;
    }

    if (!hasCostColumn) {
      return null;
    }

    return orderItems.reduce(
      (sum, item) => sum + item.orderQuantity * (item.cost ?? 0),
      0,
    );
  }, [hasCostColumn, hasUploadedFile, orderItems]);

  const openFileDialog = () => fileInputRef.current?.click();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setError(FILE_ERROR);
      event.target.value = '';
      return;
    }

    try {
      const parsed = await parseInventoryFile(file);
      const calculatedItems = calculateInventoryItems(parsed.rows);

      setItems(calculatedItems);
      setHasSupplierColumn(parsed.hasSupplierColumn);
      setHasCostColumn(parsed.hasCostColumn);
      setFileInfo({
        fileName: file.name,
        uploadedAt: new Date(),
      });
      setError(null);
    } catch {
      setError(FILE_ERROR);
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <Sidebar />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 xl:px-14">
        <input
          accept=".xlsx,.xls"
          aria-label="Загрузить Excel"
          className="hidden"
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />

        <div className="mx-auto flex max-w-[1500px] flex-col gap-8">
          <Header
            error={error}
            fileInfo={fileInfo}
            onDownloadTemplate={downloadTemplate}
            onUploadClick={openFileDialog}
          />

          {!hasUploadedFile && <UploadCard onUploadClick={openFileDialog} />}

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={FileText}
              title="Проанализировано"
              tone="teal"
              value={kpis.analyzed}
            />
            <KpiCard
              icon={AlertCircle}
              title="Срочно заказать"
              tone="red"
              value={kpis.urgent}
            />
            <KpiCard
              icon={Clock}
              title="Скоро закончатся"
              tone="amber"
              value={kpis.soon}
            />
            <KpiCard
              icon={Ban}
              title="В стопе"
              tone="red"
              value={kpis.stopped}
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
        </div>
      </main>
    </div>
  );
}

export default App;
