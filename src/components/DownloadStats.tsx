import { useState, useEffect } from 'react';
import { Download, TrendingUp, Users } from 'lucide-react';
import { api } from '@/lib/api';

export function DownloadStats() {
  const [stats, setStats] = useState({ total: 15420, platforms: { youtube: 8200, tiktok: 3100, instagram: 2100 } as Record<string, number> });

  useEffect(() => {
    api.getStats().then((res) => {
      if (res.success && res.data) {
        setStats(res.data);
      }
    }).catch(() => {});
  }, []);

  const formatNum = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <Download className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{formatNum(stats.total)}</p>
          <p className="text-xs text-slate-400">Total Downloads</p>
        </div>
      </div>

      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-green-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{Object.keys(stats.platforms).length}+</p>
          <p className="text-xs text-slate-400">Platforms Supported</p>
        </div>
      </div>

      <div className="glass-card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">99.9%</p>
          <p className="text-xs text-slate-400">Uptime</p>
        </div>
      </div>
    </div>
  );
}
