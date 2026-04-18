import { PLATFORMS } from '../../shared/types';
import { cn } from '@/lib/utils';

interface PlatformGridProps {
  className?: string;
  compact?: boolean;
}

export function PlatformGrid({ className, compact = false }: PlatformGridProps) {
  return (
    <div className={cn('grid gap-3', compact ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6', className)}>
      {PLATFORMS.map((p) => (
        <div
          key={p.name}
          className="flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 border border-slate-700/30 hover:border-cyan-500/30 transition-all group cursor-default"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: p.color + '22', color: p.color }}
          >
            {p.label.charAt(0)}
          </div>
          {!compact && (
            <span className="text-sm text-slate-300 group-hover:text-cyan-400 transition-colors truncate">
              {p.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
