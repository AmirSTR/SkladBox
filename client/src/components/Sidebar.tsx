import {
  BarChart3,
  ChevronDown,
  FileSpreadsheet,
  Home,
  Settings,
  Truck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth';

const navigation = [
  { label: 'Дашборд', icon: Home, to: '/dashboard' },
  { label: 'Загрузка Excel', icon: FileSpreadsheet, to: '/upload' },
  { label: 'Анализ', icon: BarChart3, to: '/analysis' },
  { label: 'Поставщики', icon: Truck, to: '/suppliers' },
  { label: 'Настройки', icon: Settings, to: '/settings' },
];

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-slate-200/80 bg-white/90 px-5 py-6 backdrop-blur lg:min-h-screen lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-lg font-black text-teal-700">
          A
        </div>
        <span className="text-2xl font-bold tracking-normal text-ink">
          АнтиСтоп
        </span>
      </div>

      <nav className="mt-8 grid gap-2 sm:grid-cols-3 lg:mt-16 lg:block lg:space-y-3">
        {navigation.map(({ label, icon: Icon, to }) => (
          <NavLink
            className={({ isActive }) =>
              `flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left text-base font-medium transition ${
                isActive
                  ? 'bg-teal-50 text-teal-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-ink'
              }`
            }
            key={to}
            to={to}
          >
            <Icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-8 flex items-center gap-3 rounded-2xl border border-teal-100 bg-white px-3 py-3 lg:mt-auto">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-teal-200 bg-teal-50 text-sm font-bold text-teal-700">
          {getInitials(user?.companyName ?? 'АнтиСтоп')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {user?.companyName ?? 'Компания'}
          </p>
          <p className="mt-0.5 text-sm text-muted">{user?.name ?? 'Владелец'}</p>
        </div>
        <ChevronDown aria-hidden className="h-5 w-5 text-slate-500" />
      </div>
    </aside>
  );
}

function getInitials(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
