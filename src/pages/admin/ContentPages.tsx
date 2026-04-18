import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { ContentPageData } from '@/lib/api';

export default function AdminContent() {
  const [pages, setPages] = useState<ContentPageData[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
const loadPages = () => {
    api.adminGetContent().then((res) => {
      if (res.success && res.data) setPages(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { loadPages(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this page?')) return;
    await api.adminDeleteContent(id);
    loadPages();
  };

  const handleTogglePublish = async (page: ContentPageData) => {
    await api.adminUpdateContent(page.id, { isPublished: !page.isPublished });
    loadPages();
  };

  const filtered = pages.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Helmet><title>Content Pages - DownAir Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Content Pages</h1>
          <Link to="/admin/content/new">
            <Button variant="cyan"><Plus className="w-4 h-4 mr-2" /> New Page</Button>
          </Link>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pages..." className="pl-10" />
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-16 bg-slate-800 rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((page) => (
              <Card key={page.id}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium truncate">{page.title}</h3>
                      <Badge variant={page.isPublished ? 'cyan' : 'secondary'}>
                        {page.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <Badge variant="outline" className="text-xs">{page.category}</Badge>
                      <span>/{page.slug}</span>
                      <span>{page.views} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleTogglePublish(page)}>
                      {page.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Link to={`/admin/content/${page.id}/edit`}>
                      <Button size="sm" variant="ghost"><Pencil className="w-4 h-4" /></Button>
                    </Link>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => handleDelete(page.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
