import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-6',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  cta,
  onClick,
}: {
  name: string;
  className: string;
  background?: ReactNode;
  Icon?: any;
  description: string;
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg cursor-pointer h-full min-h-[22rem]',
        className
      )}
    >
      {background && <div className="absolute inset-0 z-0 w-full h-full">{background}</div>}
      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/40 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-95" />
      
      <div className="z-20 flex transform-gpu flex-col gap-2 p-6 transition-all duration-300 group-hover:-translate-y-4 mt-auto pointer-events-none">
        {Icon && <Icon className="h-7 w-7 text-gold-400 mb-1" />}
        <h3 className="text-xl font-extrabold text-white tracking-tight leading-tight">{name}</h3>
        <p className="max-w-lg text-gray-300 text-sm line-clamp-2 leading-relaxed">{description}</p>
      </div>

      <div
        className={cn(
          'pointer-events-none absolute bottom-0 flex w-full translate-y-6 transform-gpu flex-row items-center px-6 pb-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-20'
        )}
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gold-400 flex items-center gap-1.5">
          {cta || 'View Gallery'}
          <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </div>
    </div>
  );
}
