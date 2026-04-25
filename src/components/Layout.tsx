import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { AntiAdblock } from './AntiAdblock';
import { AdBanner } from './AdBanner';
import { GlobalAdScripts } from './GlobalAdScripts';
import { useAdsConfig } from '@/lib/adsContext';

export function Layout() {
  const { config } = useAdsConfig();
  const showSidebar = config.enabled && config.slots.sidebar.enabled && !!config.slots.sidebar.html.trim();
  const showBanner = config.enabled && config.slots.banner.enabled && !!config.slots.banner.html.trim();

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <GlobalAdScripts />
      <AntiAdblock />
      <Navbar />
      <div className="flex-1 flex">
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
        {showSidebar && (
          <aside className="hidden xl:block w-[180px] shrink-0 p-4">
            <div className="sticky top-20 flex flex-col items-center gap-4">
              <AdBanner type="sidebar" />
            </div>
          </aside>
        )}
      </div>
      {showBanner && (
        <div className="max-w-7xl mx-auto w-full px-4 py-6">
          <div className="flex justify-center">
            <AdBanner type="banner" />
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
