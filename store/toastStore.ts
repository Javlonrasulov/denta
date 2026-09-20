import { create } from 'zustand';

export type ToastTone = 'warning' | 'error' | 'info' | 'success';

export type AppToast = {
  id: string;
  tone: ToastTone;
  title: string;
  message: string;
};

interface ToastState {
  toast: AppToast | null;
  showToast: (input: Omit<AppToast, 'id'> & { id?: string }) => void;
  dismissToast: () => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toast: null,
  showToast: (input) => {
    const message = input.message.trim();
    if (!message) return;
    const current = get().toast;
    if (current && current.message === message && current.title === input.title) return;
    set({
      toast: {
        id: input.id ?? `toast-${Date.now()}`,
        tone: input.tone,
        title: input.title,
        message,
      },
    });
  },
  dismissToast: () => set({ toast: null }),
}));
