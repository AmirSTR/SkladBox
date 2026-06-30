import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { Header } from '../components/Header';

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <>
      <Header
        subtitle="Профиль пользователя и компания"
        title="Настройки"
      />

      <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft sm:p-7">
        <div className="grid gap-4 md:grid-cols-3">
          <Info label="Имя" value={user?.name ?? '—'} />
          <Info label="Email" value={user?.email ?? '—'} />
          <Info label="Компания" value={user?.companyName ?? '—'} />
        </div>

        <button
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 font-semibold text-ink transition hover:bg-slate-50"
          onClick={handleLogout}
          type="button"
        >
          <LogOut aria-hidden className="h-5 w-5" />
          Выйти
        </button>
      </section>
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-semibold text-ink">{value}</p>
    </div>
  );
}
