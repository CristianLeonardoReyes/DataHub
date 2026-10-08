import React from 'react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  React.useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 2800);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-highest border border-outline-variant/50 text-on-surface shadow-2xl animate-in slide-in-from-bottom-2 fade-in duration-200">
      <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
      <span className="font-label-sm text-label-sm">{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-outline hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[14px]">close</span>
      </button>
    </div>
  );
};
