import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from './api';
import { DEFAULT_ADS_CONFIG, type AdsConfig } from '../../shared/types';

type AdsContextValue = {
  config: AdsConfig;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AdsContext = createContext<AdsContextValue>({
  config: DEFAULT_ADS_CONFIG,
  loading: true,
  refresh: async () => {},
});

export function AdsConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AdsConfig>(DEFAULT_ADS_CONFIG);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.getAdsConfig();
      if (res.success && res.data) setConfig(res.data);
    } catch {
      setConfig(DEFAULT_ADS_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AdsContext.Provider value={{ config, loading, refresh }}>{children}</AdsContext.Provider>
  );
}

export function useAdsConfig() {
  return useContext(AdsContext);
}
