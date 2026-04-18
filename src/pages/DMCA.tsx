import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function DMCA() {
  const [form, setForm] = useState({
    copyrightOwner: '',
    email: '',
    contentUrl: '',
    originalUrl: '',
    description: '',
    signature: '',
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.submitDmca(form);
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error || 'Failed to submit request');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>DMCA / Copyright - DownAir</title>
        <meta name="description" content="Submit a DMCA takedown request for copyrighted content on DownAir." />
        <meta property="og:title" content="DMCA - DownAir" />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'DMCA / Copyright Policy',
          description: 'Submit DMCA takedown requests',
        })}</script>
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">DMCA / <span className="gradient-text">Copyright</span></h1>
          <p className="text-slate-400 text-lg">
            We respect intellectual property rights. Submit a DMCA takedown request below.
          </p>
        </div>

        <Card className="p-6 mb-8 border-yellow-500/20 bg-yellow-500/5">
          <p className="text-yellow-200 text-sm">
            <strong>Important:</strong> Please ensure you are the copyright owner or authorized to act on their behalf. 
            All DMCA requests are reviewed within 48 hours. False claims may result in legal consequences.
          </p>
        </Card>

        {sent ? (
          <Card className="p-8 text-center border-green-500/20">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Request Submitted</h2>
            <p className="text-slate-400 mb-6">
              Your DMCA takedown request has been received. We will review it within 48 hours and take appropriate action.
            </p>
            <Button variant="cyan" onClick={() => { setSent(false); setForm({ copyrightOwner: '', email: '', contentUrl: '', originalUrl: '', description: '', signature: '' }); }}>
              Submit Another Request
            </Button>
          </Card>
        ) : (
          <Card className="p-8">
            <CardContent className="p-0">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="copyrightOwner">Copyright Owner Name</Label>
                  <Input
                    id="copyrightOwner"
                    value={form.copyrightOwner}
                    onChange={(e) => setForm({ ...form, copyrightOwner: e.target.value })}
                    placeholder="Your full name or company name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dmca-email">Email Address</Label>
                  <Input
                    id="dmca-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentUrl">URL of Infringing Content</Label>
                  <Input
                    id="contentUrl"
                    type="url"
                    value={form.contentUrl}
                    onChange={(e) => setForm({ ...form, contentUrl: e.target.value })}
                    placeholder="https://downair.net/download/..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="originalUrl">URL of Original Content</Label>
                  <Input
                    id="originalUrl"
                    type="url"
                    value={form.originalUrl}
                    onChange={(e) => setForm({ ...form, originalUrl: e.target.value })}
                    placeholder="https://original-platform.com/content/..."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Additional details about the copyrighted work..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signature">Digital Signature</Label>
                  <Input
                    id="signature"
                    value={form.signature}
                    onChange={(e) => setForm({ ...form, signature: e.target.value })}
                    placeholder="Type your full name as digital signature"
                    required
                  />
                  <p className="text-xs text-slate-500">By typing your name, you confirm this is a valid DMCA request.</p>
                </div>
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button variant="cyan" size="lg" className="w-full" disabled={loading} type="submit">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" /> Submit DMCA Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
