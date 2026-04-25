import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle, Megaphone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAdsConfig } from '@/lib/adsContext';
import { DEFAULT_ADS_CONFIG, type AdsConfig } from '../../../shared/types';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={`relative inline-block w-10 h-6 rounded-full transition-colors ring-offset-2 ring-offset-slate-900 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400 ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </span>
      <span className="text-sm text-slate-300">{label}</span>
    </label>
  );
}

export default function AdminAds() {
  const { refresh } = useAdsConfig();
  const [cfg, setCfg] = useState<AdsConfig>(DEFAULT_ADS_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.adminGetAdsConfig()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) setCfg(res.data);
      })
      .catch(() => { /* keep defaults */ })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await api.adminUpdateAdsConfig(cfg);
      if (!res.success) {
        setError(res.error || 'Failed to save');
        return;
      }
      setSuccess(true);
      await refresh();
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-slate-400">Loading...</div>;
  }

  return (
    <>
      <Helmet><title>Ads - DownAir Admin</title></Helmet>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
          <Megaphone className="w-6 h-6" /> Ads Manager
        </h1>
        <p className="text-slate-400 mb-6 text-sm">
          Paste ad snippets from any network (Adsterra, AdSense, PropellerAds, custom HTML).
          Toggle the master switch off to instantly hide every ad on the site.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Master Switch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                checked={cfg.enabled}
                onChange={(v) => setCfg({ ...cfg, enabled: v })}
                label="Enable ads site-wide"
              />
              <Toggle
                checked={cfg.antiAdblockEnabled}
                onChange={(v) => setCfg({ ...cfg, antiAdblockEnabled: v })}
                label="Show 'disable adblocker' overlay"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Global Scripts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ads-head-html">Head HTML (injected into &lt;head&gt;)</Label>
                <Textarea
                  id="ads-head-html"
                  rows={5}
                  value={cfg.headHtml}
                  onChange={(e) => setCfg({ ...cfg, headHtml: e.target.value })}
                  placeholder='<script src="https://example.com/ads.js"></script>'
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ads-body-html">Body HTML (injected at end of &lt;body&gt;)</Label>
                <Textarea
                  id="ads-body-html"
                  rows={5}
                  value={cfg.bodyHtml}
                  onChange={(e) => setCfg({ ...cfg, bodyHtml: e.target.value })}
                  placeholder='<script src="https://example.com/popup.js"></script>'
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sidebar Ad (160×300)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                checked={cfg.slots.sidebar.enabled}
                onChange={(v) => setCfg({
                  ...cfg,
                  slots: { ...cfg.slots, sidebar: { ...cfg.slots.sidebar, enabled: v } },
                })}
                label="Show sidebar ads"
              />
              <div className="space-y-2">
                <Label htmlFor="ads-sidebar-html">Sidebar HTML snippet</Label>
                <Textarea
                  id="ads-sidebar-html"
                  rows={6}
                  value={cfg.slots.sidebar.html}
                  onChange={(e) => setCfg({
                    ...cfg,
                    slots: { ...cfg.slots, sidebar: { ...cfg.slots.sidebar, html: e.target.value } },
                  })}
                  placeholder="<script>...</script>"
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banner Ad (300×250)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                checked={cfg.slots.banner.enabled}
                onChange={(v) => setCfg({
                  ...cfg,
                  slots: { ...cfg.slots, banner: { ...cfg.slots.banner, enabled: v } },
                })}
                label="Show banner ads"
              />
              <div className="space-y-2">
                <Label htmlFor="ads-banner-html">Banner HTML snippet</Label>
                <Textarea
                  id="ads-banner-html"
                  rows={6}
                  value={cfg.slots.banner.html}
                  onChange={(e) => setCfg({
                    ...cfg,
                    slots: { ...cfg.slots, banner: { ...cfg.slots.banner, html: e.target.value } },
                  })}
                  placeholder="<script>...</script>"
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Toggle
                checked={cfg.smartLink.enabled}
                onChange={(v) => setCfg({ ...cfg, smartLink: { ...cfg.smartLink, enabled: v } })}
                label="Enable monetized links in nav/footer"
              />
              <div className="space-y-2">
                <Label htmlFor="ads-smartlink-url">Smart Link URL</Label>
                <Input
                  id="ads-smartlink-url"
                  type="url"
                  value={cfg.smartLink.url}
                  onChange={(e) => setCfg({ ...cfg, smartLink: { ...cfg.smartLink, url: e.target.value } })}
                  placeholder="https://example.com/?key=..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-300 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              The HTML snippets execute scripts in users' browsers. Only paste code from networks you trust.
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" /> Ads configuration saved
            </div>
          )}

          <Button variant="cyan" type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </>
  );
}
