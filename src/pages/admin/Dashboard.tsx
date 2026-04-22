import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Download, FileText, Mail, Shield, Eye, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import type { DashboardData } from '@/lib/api';

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
useEffect(() => {
    api.adminDashboard().then((res) => {
      if (res.success && res.data) setData(res.data);
      else setLoadError(true);
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4"><div className="h-32 bg-slate-800 rounded-lg" /><div className="grid grid-cols-4 gap-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-24 bg-slate-800 rounded-lg" />)}</div></div>;
  }

  if (loadError && !data) {
    return <div className="text-red-400 p-4">Failed to load dashboard data. Please try again.</div>;
  }

  const stats = data?.stats || {
    totalDownloads: 0, totalContentPages: 0, publishedPages: 0,
    draftPages: 0, contactSubmissions: 0, dmcaRequests: 0, pendingDmca: 0,
  };

  const statCards = [
    { label: 'Total Downloads', value: stats.totalDownloads, icon: Download, color: 'cyan' },
    { label: 'Content Pages', value: stats.totalContentPages, icon: FileText, color: 'blue' },
    { label: 'Published', value: stats.publishedPages, icon: Eye, color: 'green' },
    { label: 'Drafts', value: stats.draftPages, icon: FileText, color: 'yellow' },
    { label: 'Contacts', value: stats.contactSubmissions, icon: Mail, color: 'purple' },
    { label: 'DMCA Requests', value: stats.dmcaRequests, icon: Shield, color: 'red' },
  ];

  const colorMap: Record<string, string> = {
    cyan: 'text-cyan-400 bg-cyan-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    green: 'text-green-400 bg-green-500/10',
    yellow: 'text-yellow-400 bg-yellow-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    red: 'text-red-400 bg-red-500/10',
  };

  return (
    <>
      <Helmet><title>Dashboard - DownAir Admin</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {statCards.map((s) => {
            const colors = colorMap[s.color] || colorMap.cyan;
            const [textColor, bgColor] = colors.split(' ');
            return (
              <Card key={s.label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColor}`}>
                    <s.icon className={`w-5 h-5 ${textColor}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data?.recentActivity && data.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {data.recentActivity.slice(0, 15).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-300 flex-1">
                      {a.action} - {a.entity}
                      {a.entityId ? ` #${a.entityId}` : ''}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
