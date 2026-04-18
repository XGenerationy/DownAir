import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { DmcaData } from '@/lib/api';

export default function AdminDmca() {
  const [requests, setRequests] = useState<DmcaData[]>([]);
  const [loading, setLoading] = useState(true);
useEffect(() => {
    api.adminGetDmca().then((res) => {
      if (res.success && res.data) setRequests(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: number, status: string) => {
    await api.adminUpdateDmcaStatus(id, status);
    setRequests(requests.map((r) => r.id === id ? { ...r, status } : r));
  };

  const statusColors: Record<string, string> = {
    pending: 'border-yellow-500/30 bg-yellow-500/5',
    resolved: 'border-green-500/30 bg-green-500/5',
    rejected: 'border-red-500/30 bg-red-500/5',
  };

  return (
    <>
      <Helmet><title>DMCA Requests - DownAir Admin</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">DMCA Requests</h1>
        {loading ? (
          <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-32 bg-slate-800 rounded-lg animate-pulse" />)}</div>
        ) : requests.length === 0 ? (
          <p className="text-slate-500">No DMCA requests yet.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Card key={r.id} className={statusColors[r.status] || ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-medium">{r.copyrightOwner}</span>
                        <span className="text-slate-500 text-sm">{r.email}</span>
                        <Badge variant={r.status === 'pending' ? 'cyan' : r.status === 'resolved' ? 'secondary' : 'destructive'}>
                          {r.status}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p className="text-slate-400"><span className="text-slate-500">Infringing:</span> {r.contentUrl}</p>
                        <p className="text-slate-400"><span className="text-slate-500">Original:</span> {r.originalUrl}</p>
                        {r.description && <p className="text-slate-500 italic">{r.description}</p>}
                      </div>
                      <div className="text-xs text-slate-500 mt-2">
                        <Clock className="w-3 h-3 inline mr-1" /> {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {r.status === 'pending' && (
                      <div className="flex gap-2 shrink-0">
                        <Button size="sm" variant="ghost" className="text-green-400" onClick={() => handleStatus(r.id, 'resolved')}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-400" onClick={() => handleStatus(r.id, 'rejected')}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
