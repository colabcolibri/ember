import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type AppInputProps = ComponentProps<typeof Input> & {
  otp?: boolean;
};

export function AppInput({ otp, className, ...props }: AppInputProps) {
  return (
    <Input
      className={cn(
        'min-h-11 bg-background',
        otp && 'text-center font-mono text-2xl tracking-[0.35em]',
        className,
      )}
      {...props}
    />
  );
}
