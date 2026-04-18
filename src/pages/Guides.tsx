import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SmartLink } from '@/components/AdBanner';
import { api } from '@/lib/api';
import type { ContentPageData } from '@/lib/api';

const ALL_CATEGORIES = [
  'Servers', 'Networking', 'Cybersecurity', 'Cloud Computing',
  'AI & Machine Learning', 'Databases', 'Linux', 'Web Development',
  'DevOps', 'Mobile Development', 'Health Tech', 'Hardware', 'Data Science',
];

export default function Guides() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pages, setPages] = useState<ContentPageData[]>([]);
  const [categories, setCategories] = useState<string[]>(ALL_CATEGORIES);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const activeCategory = searchParams.get('category') || '';

  useEffect(() => {
    setLoading(true);
    const params: { category?: string; page?: number } = {};
    if (activeCategory) params.category = activeCategory;
    api.getGuides(params).then((res) => {
      if (res.success && res.data) setPages(res.data);
    }).catch(() => {}).finally(() => setLoading(false));

    api.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    }).catch(() => {});
  }, [activeCategory]);

  const filtered = pages.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.metaDescription || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleCategoryClick = (cat: string) => {
    if (activeCategory === cat) {
      setSearchParams({});
    } else {
      setSearchParams({ category: cat });
    }
  };

  return (
    <>
      <Helmet>
        <title>Tech Guides & Tutorials - DownAir</title>
        <meta name="description" content="Browse 150+ in-depth tech guides covering servers, networking, cybersecurity, cloud computing, AI, databases, Linux, and more." />
        <meta property="og:title" content="Tech Guides - DownAir" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Tech Guides & Tutorials',
          description: '150+ in-depth tech guides',
        })}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            <BookOpen className="w-10 h-10 text-cyan-400 inline mr-3" />
            Tech <span className="gradient-text">Guides</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            150+ in-depth guides covering servers, networking, cybersecurity, cloud computing, 
            AI, databases, Linux, web development, and more.
          </p>
        </div>

        <div className="relative max-w-xl mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guides..."
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <Badge
            variant={activeCategory === '' ? 'cyan' : 'outline'}
            className="cursor-pointer"
            onClick={() => setSearchParams({})}
          >
            All
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'cyan' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleCategoryClick(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="p-6 animate-shimmer">
                <div className="h-6 bg-slate-800 rounded mb-3 w-3/4" />
                <div className="h-4 bg-slate-800 rounded mb-2 w-full" />
                <div className="h-4 bg-slate-800 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No guides found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((page) => (
              <Link key={page.id} to={`/guides/${page.slug}`}>
                <Card className="p-6 h-full hover:border-cyan-500/30 transition-all group cursor-pointer">
                  <CardContent className="p-0">
                    <Badge variant="cyan" className="mb-3">{page.category}</Badge>
                    <h3 className="text-white font-semibold mb-2 group-hover:text-cyan-400 transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2">
                      {page.metaDescription || 'Read this comprehensive guide...'}
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-cyan-400 text-sm">
                      Read Guide <ChevronRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <SmartLink>Browse more resources and tools &rarr;</SmartLink>
        </div>
      </div>
    </>
  );
}
