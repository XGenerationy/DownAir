import { useState, useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdsConfig } from '@/lib/adsContext';

export function AntiAdblock() {
  const { config } = useAdsConfig();
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!config.enabled || !config.antiAdblockEnabled) return;
    const detectAdblock = async () => {
      try {
        const testAd = document.createElement('div');
        testAd.innerHTML = '&nbsp;';
        testAd.className = 'adsbox ad-placement carbon-ads';
        testAd.style.cssText = 'position:absolute;top:-10px;left:-10px;width:1px;height:1px;';
        document.body.appendChild(testAd);

        await new Promise((r) => setTimeout(r, 100));

        const blocked = testAd.offsetHeight === 0 || testAd.clientHeight === 0;
        document.body.removeChild(testAd);

        if (blocked) {
          setBlocked(true);
        }

        const banners = document.querySelectorAll('[data-ad-slot]');
        let adDetected = false;
        for (const b of banners) {
          if (b.clientHeight > 0) {
            adDetected = true;
            break;
          }
        }

        if (!adDetected && banners.length > 0) {
          setBlocked(true);
        }
      } catch {
        // Detection error
      }
    };

    const timer = setTimeout(detectAdblock, 2000);
    return () => clearTimeout(timer);
  }, [config.enabled, config.antiAdblockEnabled]);

  if (!config.enabled || !config.antiAdblockEnabled) return null;
  if (!blocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <Shield className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Ad Blocker Detected</h2>
        <p className="text-slate-400 mb-6">
          We rely on advertisements to keep our service free and maintain our servers.
          Please disable your ad blocker to continue using DownAir.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            variant="cyan"
            onClick={() => {
              setBlocked(false);
              window.location.reload();
            }}
          >
            I've Disabled My Ad Blocker
          </Button>
          <p className="text-xs text-slate-500 mt-2">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Some features may not work with ad blockers enabled
          </p>
        </div>
      </div>
    </div>
  );
}
