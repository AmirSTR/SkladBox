import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-muted">
        Загрузка...
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
