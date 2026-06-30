import { FormEvent, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate replace to="/upload" />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/upload');
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Не удалось войти.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      footer={
        <>
          Нет аккаунта?{' '}
          <Link className="font-semibold text-teal-700" to="/register">
            Зарегистрироваться
          </Link>
        </>
      }
      subtitle="Войдите, чтобы продолжить работу со складом"
      title="Вход в АнтиСтоп"
    >
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <TextField
          label="Email"
          onChange={setEmail}
          type="email"
          value={email}
        />
        <TextField
          label="Пароль"
          onChange={setPassword}
          type="password"
          value={password}
        />
        {error && (
          <p className="rounded-2xl border border-danger-100 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
            {error}
          </p>
        )}
        <button
          className="min-h-14 w-full rounded-2xl bg-teal-600 px-5 text-base font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-200"
          disabled={isSubmitting}
          type="submit"
        >
          Войти
        </button>
      </form>
    </AuthShell>
  );
}

interface AuthShellProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-lg font-black text-teal-700">
            A
          </div>
          <span className="text-2xl font-bold text-ink">АнтиСтоп</span>
        </div>
        <h1 className="mt-8 text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-3 text-base leading-7 text-muted">{subtitle}</p>
        {children}
        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </section>
    </main>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}

function TextField({ label, value, type = 'text', onChange }: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-ink outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}
