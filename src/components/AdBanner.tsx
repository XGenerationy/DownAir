import { useAdsConfig } from '@/lib/adsContext';
import { InlineHtml } from './HtmlInjector';

interface AdBannerProps {
  type: 'sidebar' | 'banner' | 'popup' | 'social';
  className?: string;
}

export function AdBanner({ type, className }: AdBannerProps) {
  const { config } = useAdsConfig();

  if (!config.enabled) return null;
  if (type === 'popup' || type === 'social') return null;

  const slot = config.slots[type];
  if (!slot.enabled || !slot.html.trim()) return null;

  return (
    <InlineHtml
      html={slot.html}
      className={`ad-slot ${className || ''} ${type === 'sidebar' ? 'w-[160px] h-[300px]' : 'w-[300px] h-[250px]'}`}
    />
  );
}

export function SmartLink({ children, className }: { children: React.ReactNode; className?: string }) {
  const { config } = useAdsConfig();

  if (!config.smartLink.enabled || !config.smartLink.url) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={config.smartLink.url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`text-cyan-400 hover:text-cyan-300 underline transition-colors ${className || ''}`}
    >
      {children}
    </a>
  );
}
