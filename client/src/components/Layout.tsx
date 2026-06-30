import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function Layout() {
  return (
    <div className="min-h-screen bg-canvas text-ink lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 xl:px-14">
        <div className="mx-auto flex max-w-[1500px] flex-col gap-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
