import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  LayoutDashboard, FileText, Mail, Shield, Settings,
  LogOut, Menu, X, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/content', label: 'Content Pages', icon: FileText },
  { to: '/admin/contacts', label: 'Contact Messages', icon: Mail },
  { to: '/admin/dmca-requests', label: 'DMCA Requests', icon: Shield },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    api.adminMe()
      .then((res) => {
        if (cancelled) return;
        if (res.success) setAuthed(true);
        else {
          setAuthed(false);
          navigate('/admin/login');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAuthed(false);
        navigate('/admin/login');
      });
    return () => { cancelled = true; };
  }, [navigate]);

  const handleLogout = async () => {
    try { await api.adminLogout(); } catch { /* ignore */ }
    sessionStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const adminUser = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('admin_user') || '{}');
    } catch {
      return {};
    }
  })();

  if (authed === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Loading...</div>;
  }
  if (!authed) return null;

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen bg-slate-950 flex">
        <aside
          className={cn(
            'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700/50 transform transition-transform lg:transform-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-700/50">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold gradient-text">DownAir Admin</span>
              </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1">
              {sidebarLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    location.pathname === to
                      ? 'text-cyan-400 bg-cyan-500/10'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-slate-700/50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                  {(adminUser.name || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{adminUser.name || 'Admin'}</p>
                  <p className="text-xs text-slate-500 truncate">{adminUser.email || ''}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm flex items-center px-4 gap-4">
            <button
              className="lg:hidden text-slate-400 hover:text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex-1" />
            <Link to="/" className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">
              View Site &rarr;
            </Link>
          </header>

          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
