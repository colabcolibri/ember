import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type AppInputProps = ComponentProps<typeof Input> & {
  otp?: boolean;
};

export function AppInput({ otp, className, ...props }: AppInputProps) {
  if (otp) {
    return (
      <input
        className={cn(
          'w-full border-0 border-b-2 border-outline-variant bg-transparent py-4 text-center font-mono text-3xl tracking-[0.35em] text-foreground placeholder:text-outline-variant/50 focus:border-primary focus:ring-0 focus:outline-none',
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <Input
      className={cn(
        'min-h-11 rounded-xl border-outline-variant/60 bg-background px-4 py-3.5 text-base focus:border-primary focus:ring-primary/20',
        className,
      )}
      {...props}
    />
  );
}
