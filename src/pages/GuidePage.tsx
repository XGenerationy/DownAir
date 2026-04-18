import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Calendar, Eye, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AdBanner, SmartLink } from '@/components/AdBanner';
import { api } from '@/lib/api';
import type { ContentPageData } from '@/lib/api';

export default function GuidePage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<ContentPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    api.getGuide(slug).then((res) => {
      if (res.success && res.data) {
        setPage(res.data);
      } else {
        setNotFound(true);
      }
    }).catch(() => setNotFound(true)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-shimmer space-y-4">
          <div className="h-8 bg-slate-800 rounded w-3/4" />
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-64 bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Guide Not Found</h1>
        <p className="text-slate-400 mb-6">The guide you're looking for doesn't exist or has been removed.</p>
        <Link to="/guides">
          <Button variant="cyan">Browse All Guides</Button>
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(page.updatedAt || page.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <Helmet>
        <title>{page.title} - DownAir Guides</title>
        <meta name="description" content={page.metaDescription || page.title} />
        <meta property="og:title" content={page.title} />
        <meta property="og:description" content={page.metaDescription || page.title} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://downair.net/guides/${page.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: page.title,
          description: page.metaDescription || page.title,
          datePublished: page.createdAt,
          dateModified: page.updatedAt || page.createdAt,
          author: { '@type': 'Organization', name: 'DownAir' },
          publisher: { '@type': 'Organization', name: 'DownAir', url: 'https://downair.net' },
          mainEntityOfPage: `https://downair.net/guides/${page.slug}`,
        })}</script>
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link
          to="/guides"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> All Guides
        </Link>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <article className="flex-1 min-w-0">
            <Badge variant="cyan" className="mb-4">{page.category}</Badge>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{page.title}</h1>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-8">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" /> {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {page.views} views
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {Math.ceil((page.content.length / 200))} min read
              </span>
            </div>

            <div className="mb-6">
              <AdBanner type="banner" />
            </div>

            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />

            <div className="mt-8">
              <AdBanner type="banner" />
            </div>

            <Card className="mt-8 p-6 border-cyan-500/20">
              <h3 className="text-lg font-semibold text-white mb-3">Ready to Download?</h3>
              <p className="text-slate-400 mb-4">Try our free social media downloader while you're here.</p>
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="cyan">Go to Downloader</Button>
                </Link>
                <SmartLink>Explore More Tools &rarr;</SmartLink>
              </div>
            </Card>
          </article>

          {/* Sidebar */}
          <aside className="lg:w-[300px] shrink-0 space-y-6">
            <div className="lg:sticky lg:top-20 space-y-6">
              <AdBanner type="banner" />
              <Card className="p-4">
                <h3 className="text-white font-semibold mb-3">Related Guides</h3>
                <div className="space-y-2">
                  <Link to="/guides" className="block text-sm text-cyan-400 hover:text-cyan-300">
                    Browse all guides &rarr;
                  </Link>
                  <SmartLink className="block text-sm">Explore more tools &rarr;</SmartLink>
                </div>
              </Card>
              <AdBanner type="banner" />
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
