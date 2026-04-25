import { useAdsConfig } from '@/lib/adsContext';
import { HeadInjector, BodyInjector } from './HtmlInjector';

export function GlobalAdScripts() {
  const { config } = useAdsConfig();
  if (!config.enabled) return null;
  return (
    <>
      <HeadInjector html={config.headHtml} />
      <BodyInjector html={config.bodyHtml} />
    </>
  );
}
