import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Download, Link2, Shield, Zap, Globe, ChevronRight, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PlatformGrid } from '@/components/PlatformGrid';
import { DownloadStats } from '@/components/DownloadStats';
import { SmartLink } from '@/components/AdBanner';
import { api } from '@/lib/api';
import type { MediaAnalysisData } from '@/lib/api';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.analyze(url.trim());
      if (res.success && res.data) {
        navigate('/download', { state: { analysis: res.data } });
      } else {
        setError(res.error || 'Failed to analyze URL');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Analyze and download media in seconds with our optimized infrastructure.' },
    { icon: Shield, title: 'Privacy First', desc: 'No tracking, no data collection. Your downloads stay private.' },
    { icon: Globe, title: '12+ Platforms', desc: 'Support for YouTube, TikTok, Instagram, Twitter/X, and many more.' },
    { icon: Download, title: 'Multiple Formats', desc: 'Choose from video qualities or extract audio in MP3, M4A formats.' },
  ];

  return (
    <>
      <Helmet>
        <title>DownAir - Free Social Media Video & Audio Downloader</title>
        <meta name="description" content="Download videos and audio from YouTube, TikTok, Instagram, Twitter/X, Facebook, and 12+ platforms. Fast, free, and private." />
        <meta property="og:title" content="DownAir - Free Social Media Downloader" />
        <meta property="og:description" content="Download videos and audio from 12+ social media platforms instantly." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://downair.net" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'DownAir',
          url: 'https://downair.net',
          description: 'Free social media video and audio downloader supporting 12+ platforms',
          applicationCategory: 'MultimediaApplication',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        })}</script>
      </Helmet>

      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

          <div className="max-w-4xl mx-auto relative text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
              <Zap className="w-3.5 h-3.5" />
              Free &bull; Fast &bull; No Registration Required
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Download Videos & Audio from{' '}
              <span className="gradient-text">Any Platform</span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
              Paste any social media URL and download in your preferred format. 
              Supports YouTube, TikTok, Instagram, Twitter/X, and 8 more platforms.
            </p>

            {/* URL Input */}
            <div className="max-w-2xl mx-auto">
              <div className="flex gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 focus-within:border-cyan-500/50 focus-within:shadow-lg focus-within:shadow-cyan-500/10 transition-all">
                <div className="flex-1 relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                    placeholder="Paste your video or audio URL here..."
                    className="pl-10 border-0 bg-transparent focus-visible:ring-0 text-base"
                  />
                </div>
                <Button
                  variant="cyan"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={loading || !url.trim()}
                  className="shrink-0"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Analyze
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <p className="text-red-400 text-sm mt-3 animate-fade-in">{error}</p>
              )}
            </div>

            {/* Quick platform pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['YouTube', 'TikTok', 'Instagram', 'Twitter/X', 'Facebook', 'Reddit'].map((p) => (
                <span key={p} className="px-3 py-1 text-xs text-slate-400 bg-slate-800/50 rounded-full border border-slate-700/30">
                  {p}
                </span>
              ))}
              <span className="px-3 py-1 text-xs text-cyan-400 bg-cyan-500/10 rounded-full border border-cyan-500/20">
                +6 more
              </span>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          <DownloadStats />
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Why Choose DownAir?</h2>
            <p className="text-slate-400 max-w-xl mx-auto">Built for speed, privacy, and reliability. No compromises.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="p-6 hover:border-cyan-500/30 transition-all group">
                <CardContent className="p-0">
                  <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors">
                    <f.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-slate-400">Three simple steps to download any media</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Paste URL', desc: 'Copy the URL from any supported platform and paste it above.' },
              { step: '2', title: 'Choose Format', desc: 'Select your preferred quality and format (video or audio).' },
              { step: '3', title: 'Download', desc: 'Click download and your file will be ready in seconds.' },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white text-xl font-bold mb-4">
                  {s.step}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-slate-400 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Supported Platforms */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Supported Platforms</h2>
            <p className="text-slate-400">Download from all your favorite social media platforms</p>
          </div>
          <PlatformGrid />
        </section>

        {/* Privacy Section */}
        <section className="max-w-4xl mx-auto px-4 py-16">
          <Card className="p-8 border-cyan-500/20">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Privacy-First Design</h3>
                <p className="text-slate-400">
                  We don't track your downloads, store your data, or share information with third parties. 
                  All downloads are proxied through our servers to protect your identity and keep source URLs hidden.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {['No Tracking', 'No Logs', 'Encrypted Tokens', 'Proxy Downloads'].map((f) => (
                    <span key={f} className="flex items-center gap-1 text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">
                      <CheckCircle2 className="w-3 h-3" /> {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Download?</h2>
          <p className="text-slate-400 mb-6">Start downloading videos and audio from any supported platform.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="cyan" size="xl" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Start Downloading <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <SmartLink className="text-sm flex items-center gap-1">
              Explore More Tools <ChevronRight className="w-4 h-4" />
            </SmartLink>
          </div>
        </section>
      </div>
    </>
  );
}
