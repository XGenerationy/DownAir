import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Mail, Eye, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import type { ContactData } from '@/lib/api';

export default function AdminContacts() {
  const [contacts, setContacts] = useState<ContactData[]>([]);
  const [loading, setLoading] = useState(true);
useEffect(() => {
    api.adminGetContacts().then((res) => {
      if (res.success && res.data) setContacts(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id: number) => {
    await api.adminMarkContactRead(id);
    setContacts(contacts.map((c) => c.id === id ? { ...c, isRead: true } : c));
  };

  return (
    <>
      <Helmet><title>Contact Messages - DownAir Admin</title></Helmet>
      <div>
        <h1 className="text-2xl font-bold text-white mb-6">Contact Messages</h1>
        {loading ? (
          <div className="space-y-3">{Array.from({length:3}).map((_,i)=><div key={i} className="h-24 bg-slate-800 rounded-lg animate-pulse" />)}</div>
        ) : contacts.length === 0 ? (
          <p className="text-slate-500">No contact submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <Card key={c.id} className={c.isRead ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-slate-500 text-sm">{c.email}</span>
                        {!c.isRead && <Badge variant="cyan">New</Badge>}
                      </div>
                      <h3 className="text-cyan-300 font-medium mb-1">{c.subject}</h3>
                      <p className="text-slate-400 text-sm line-clamp-2">{c.message}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" /> {new Date(c.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {!c.isRead && (
                      <Button size="sm" variant="ghost" onClick={() => handleMarkRead(c.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
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
