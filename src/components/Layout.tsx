import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AntiAdblock } from './AntiAdblock';
import { AdBanner } from './AdBanner';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <AntiAdblock />
      <Navbar />
      <div className="flex-1 flex">
        <aside className="hidden xl:block w-[180px] shrink-0 p-4">
          <div className="sticky top-20 flex flex-col items-center gap-4">
            <AdBanner type="sidebar" />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        <aside className="hidden xl:block w-[180px] shrink-0 p-4">
          <div className="sticky top-20 flex flex-col items-center gap-4">
            <AdBanner type="sidebar" />
          </div>
        </aside>
      </div>
      <div className="max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex justify-center gap-6">
          <AdBanner type="banner" />
          <AdBanner type="banner" />
        </div>
      </div>
      <Footer />
    </div>
  );
}
