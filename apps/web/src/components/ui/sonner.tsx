import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      position="bottom-center"
      closeButton
      richColors
      offset={{ bottom: 88 }}
      mobileOffset={{ bottom: 96 }}
      toastOptions={{
        classNames: {
          toast:
            'group toast !rounded-2xl !border-outline-variant/40 !bg-paper !text-foreground !shadow-lg',
          title: '!text-sm !font-semibold',
          description: '!text-sm !text-muted-foreground',
          success: '!border-[hsl(var(--success))]/30',
          error: '!border-destructive/30',
          closeButton: '!border-outline-variant/40 !bg-background !text-muted-foreground',
        },
      }}
      {...props}
    />
  );
}
