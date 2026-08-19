import { toast } from 'sonner';

export function showSuccess(message: string, title?: string) {
  if (title) {
    toast.success(title, { description: message });
    return;
  }
  toast.success(message);
}

export function showError(message: string) {
  toast.error(message);
}
