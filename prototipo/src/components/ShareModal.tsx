import React from 'react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const url = window.location.href;

  const handleCopy = () => {
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl p-space-md space-y-space-md animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">ios_share</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Share Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <div className="space-y-space-sm text-label-sm">
          <div>
            <p className="font-body-sm text-on-surface font-medium truncate">{title}</p>
            <p className="font-body-sm text-outline text-[12px] mt-0.5">
              Anyone within Nova Labs with the link can view and comment.
            </p>
          </div>

          <div className="flex items-center gap-2 p-1.5 rounded bg-surface-container-lowest border border-outline-variant/40">
            <span className="font-code-block text-[11px] text-outline truncate flex-1 px-1">
              {url}
            </span>
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-surface-container hover:bg-surface-container-highest text-on-surface transition-colors shrink-0 font-label-sm text-label-sm flex items-center gap-1 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-outline-variant/30">
            <label className="block text-outline text-[11px] uppercase tracking-wider mb-2 font-medium">
              Quick Share with Collaborators
            </label>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between p-1.5 rounded hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary-container text-primary flex items-center justify-center text-[10px] font-bold">
                    A
                  </div>
                  <div>
                    <p className="text-on-surface leading-none font-medium">Alex Rivera</p>
                    <p className="text-outline text-[10px] leading-none mt-1">Platform Architect (Owner)</p>
                  </div>
                </div>
                <span className="text-[11px] text-outline">Author</span>
              </div>

              <div className="flex items-center justify-between p-1.5 rounded hover:bg-surface-container transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center text-[10px] font-bold">
                    ER
                  </div>
                  <div>
                    <p className="text-on-surface leading-none font-medium">Elena Rostova</p>
                    <p className="text-outline text-[10px] leading-none mt-1">DevOps &amp; Infrastructure</p>
                  </div>
                </div>
                <span className="text-[11px] text-primary">Can edit</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-space-xs flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-bright text-on-surface text-label-sm font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
