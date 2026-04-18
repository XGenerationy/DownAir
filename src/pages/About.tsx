import { Helmet } from 'react-helmet-async';
import { Shield, Zap, Globe, Users, Lock, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SmartLink } from '@/components/AdBanner';

export default function About() {
  const values = [
    { icon: Shield, title: 'Privacy First', desc: 'We never track your downloads, store personal data, or share information with third parties. Every download is encrypted and proxied.' },
    { icon: Zap, title: 'Speed & Reliability', desc: 'Our infrastructure is optimized for fast media analysis and downloads. We maintain 99.9% uptime across all services.' },
    { icon: Globe, title: 'Universal Support', desc: 'Support for 12+ major platforms including YouTube, TikTok, Instagram, Twitter/X, Facebook, and more.' },
    { icon: Users, title: 'User-Centric Design', desc: 'Clean, intuitive interface designed for everyone. No technical knowledge required.' },
    { icon: Lock, title: 'Secure Downloads', desc: 'All download tokens are encrypted with AES-256-GCM and HMAC verification. Tokens expire after 10 minutes.' },
    { icon: Eye, title: 'Transparent Operations', desc: 'We are open about how our service works. No hidden fees, no malware, no deceptive practices.' },
  ];

  return (
    <>
      <Helmet>
        <title>About DownAir - Free Social Media Downloader</title>
        <meta name="description" content="Learn about DownAir, the fastest and most private social media video and audio downloader supporting 12+ platforms." />
        <meta property="og:title" content="About DownAir" />
        <meta property="og:description" content="Learn about DownAir - the free, private social media downloader." />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About DownAir',
          description: 'Learn about DownAir social media downloader',
        })}</script>
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">About <span className="gradient-text">DownAir</span></h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            DownAir is a free, privacy-focused social media downloader that helps you save videos and audio 
            from your favorite platforms without compromising your privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {values.map((v) => (
            <Card key={v.title} className="p-6 hover:border-cyan-500/30 transition-all">
              <CardContent className="p-0">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                  <v.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{v.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{v.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="p-8 border-cyan-500/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">How DownAir Works</h2>
          <div className="space-y-4 text-slate-300">
            <p>
              DownAir uses advanced media analysis technology to detect and extract media from social media platforms. 
              When you paste a URL, our servers analyze the media metadata, detect available formats, and present 
              you with download options.
            </p>
            <p>
              All downloads are proxied through our secure servers, meaning the source platform never sees your IP address. 
              Download tokens are encrypted with AES-256-GCM and automatically expire after 10 minutes for security.
            </p>
            <p>
              We use open-source tools like yt-dlp for media extraction, ensuring transparency and reliability. 
              Our service is designed to respect content creators' rights and we respond promptly to DMCA requests.
            </p>
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-slate-300 mb-4">
            We believe in making the internet more accessible. DownAir exists to help people save content for 
            offline viewing, personal archiving, and fair use purposes. We are committed to:
          </p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">&#x2022;</span> Keeping our service free and accessible to everyone</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">&#x2022;</span> Protecting user privacy at every step</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">&#x2022;</span> Respecting intellectual property rights</li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 mt-1">&#x2022;</span> Maintaining transparency in our operations</li>
          </ul>
          <div className="mt-6">
            <SmartLink>Discover more about our tools &rarr;</SmartLink>
          </div>
        </Card>
      </div>
    </>
  );
}
