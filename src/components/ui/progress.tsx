import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
}

function Progress({ value = 0, max = 100, className, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-slate-800', className)}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500 ease-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

interface CountdownProps {
  seconds: number;
  onComplete: () => void;
  className?: string;
}

function Countdown({ seconds, onComplete, className }: CountdownProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);

  const percentage = ((seconds - remaining) / seconds) * 100;

  return (
    <div className={cn('text-center', className)}>
      <div className="relative inline-flex items-center justify-center">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(30,41,59)" strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgb(6,182,212)"
            strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute text-3xl font-bold text-cyan-400">{remaining}</span>
      </div>
      <p className="text-slate-400 text-sm mt-2">Preparing your download...</p>
      <Progress value={percentage} className="mt-3 w-48 mx-auto" />
    </div>
  );
}

export { Progress, Countdown };
