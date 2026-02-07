import { type ReactNode, useState } from 'react';

interface TooltipProps {
  label: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({
  label,
  children,
  position = 'bottom',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses =
    position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';

  const arrowClasses =
    position === 'top' ? 'top-full -mt-1' : 'bottom-full -mb-1';

  const arrowRotation = position === 'top' ? 'rotate-45' : '-rotate-135';

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      role="tooltip"
    >
      {children}
      <div
        className={`pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 transition-all duration-150 ${positionClasses} ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
        }`}
      >
        <div className="relative whitespace-nowrap rounded-md bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-white shadow-lg dark:bg-zinc-800">
          {label}
          <div
            className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 ${arrowRotation} rounded-sm bg-zinc-900 dark:bg-zinc-800 ${arrowClasses}`}
          />
        </div>
      </div>
    </div>
  );
}
