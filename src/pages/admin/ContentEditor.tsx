import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Save, ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { sanitizeHtml } from '@/lib/sanitize';

const CATEGORIES = [
  'Servers', 'Networking', 'Cybersecurity', 'Cloud Computing',
  'AI & Machine Learning', 'Databases', 'Linux', 'Web Development',
  'DevOps', 'Mobile Development', 'Health Tech', 'Hardware', 'Data Science',
];

export default function ContentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  const [form, setForm] = useState({
    slug: '',
    title: '',
    category: CATEGORIES[0],
    metaDescription: '',
    content: '',
    isPublished: false,
  });
  const [preview, setPreview] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      api.adminGetContentPage(parseInt(id, 10)).then((res) => {
        if (res.success && res.data) {
          const page = res.data;
          setForm({
            slug: page.slug,
            title: page.title,
            category: page.category,
            metaDescription: page.metaDescription || '',
            content: page.content,
            isPublished: page.isPublished,
          });
        }
      }).catch(() => setError('Failed to load page')).finally(() => setLoading(false));
    }
  }, [id, isNew]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const res = await api.adminCreateContent(form);
        if (res.success && res.data) {
          navigate(`/admin/content/${res.data.id}/edit`);
        }
      } else if (id) {
        await api.adminUpdateContent(parseInt(id, 10), form);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  if (loading) return <div className="animate-pulse h-96 bg-slate-800 rounded-lg" />;

  return (
    <>
      <Helmet><title>{isNew ? 'New Page' : 'Edit Page'} - DownAir Admin</title></Helmet>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/content')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white">{isNew ? 'New Content Page' : 'Edit Page'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setPreview(!preview)}>
              <Eye className="w-4 h-4 mr-2" /> {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="cyan" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {preview ? (
          <Card className="p-8">
            <h1 className="text-3xl font-bold text-white mb-4">{form.title}</h1>
            <div className="prose-content" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content) }} />
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })}
                  placeholder="Page title"
                />
              </div>
              <div className="space-y-2">
                <Label>HTML Content</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={25}
                  className="font-mono text-sm"
                  placeholder="<h2>Introduction</h2><p>Write your content here...</p>"
                />
              </div>
            </div>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="page-slug" />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100"
                    >
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Textarea
                      value={form.metaDescription}
                      onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                      rows={3}
                      placeholder="SEO description..."
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                      className="rounded border-slate-700 bg-slate-800"
                    />
                    Published
                  </label>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
