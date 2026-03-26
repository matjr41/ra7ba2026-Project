import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-blue-50 text-blue-600 border border-blue-100',
  success: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border border-amber-100',
  danger: 'bg-rose-50 text-rose-600 border border-rose-100',
  outline: 'bg-white text-gray-700 border border-gray-200',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof badgeVariants;
  icon?: React.ReactNode;
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', icon, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </span>
  )
);

Badge.displayName = 'Badge';

export { Badge };
