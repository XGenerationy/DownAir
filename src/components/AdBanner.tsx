import { useEffect, useRef } from 'react';

interface AdBannerProps {
  type: 'sidebar' | 'banner' | 'popup' | 'social';
  className?: string;
}

declare global {
  interface Window {
    atOptions?: Record<string, unknown>;
  }
}

export function AdBanner({ type, className }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = '';

    try {
      if (type === 'sidebar') {
        const opts = document.createElement('script');
        opts.textContent = `atOptions = { 'key' : '253ef006a43799d85408824a492013ab', 'format' : 'iframe', 'height' : 300, 'width' : 160, 'params' : {} };`;
        container.appendChild(opts);
        const invoke = document.createElement('script');
        invoke.src = 'https://balancedsuppercreed.com/253ef006a43799d85408824a492013ab/invoke.js';
        invoke.async = true;
        container.appendChild(invoke);
      } else if (type === 'banner') {
        const opts = document.createElement('script');
        opts.textContent = `atOptions = { 'key' : '34a7730b7eb5667d2441f499c2108e44', 'format' : 'iframe', 'height' : 250, 'width' : 300, 'params' : {} };`;
        container.appendChild(opts);
        const invoke = document.createElement('script');
        invoke.src = 'https://balancedsuppercreed.com/34a7730b7eb5667d2441f499c2108e44/invoke.js';
        invoke.async = true;
        container.appendChild(invoke);
      }
    } catch {
      // Ad load failure - silent
    }
  }, [type]);

  if (type === 'popup' || type === 'social') return null;

  return (
    <div
      ref={containerRef}
      className={`ad-slot ${className || ''} ${type === 'sidebar' ? 'w-[160px] h-[300px]' : 'w-[300px] h-[250px]'}`}
      data-ad-slot={type}
    />
  );
}

export function SmartLink({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <a
      href="https://balancedsuppercreed.com/kpcmwsk1?key=46809db98a36e595fc1319164b7ec166"
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`text-cyan-400 hover:text-cyan-300 underline transition-colors ${className || ''}`}
    >
      {children}
    </a>
  );
}

export function AdScriptHead() {
  return (
    <script
      src="https://balancedsuppercreed.com/b4/10/2e/b4102e6eef6c80521b74a7bf030f9978.js"
      async
    />
  );
}

export function AdScriptBody() {
  return (
    <script
      src="https://balancedsuppercreed.com/34/63/ff/3463ff4180a3b57053b5e8de3d734dd7.js"
      async
    />
  );
}
