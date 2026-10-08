import React from 'react';
import { AdrRecord } from '../types';

interface DraftAdrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (adr: AdrRecord) => void;
  nextAdrNumber: number;
}

export const DraftAdrModal: React.FC<DraftAdrModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  nextAdrNumber,
}) => {
  const [title, setTitle] = React.useState('');
  const [owner, setOwner] = React.useState('Platform Architecture');
  const [status, setStatus] = React.useState<'Approved' | 'Needs Review' | 'Draft'>('Needs Review');
  const [rationale, setRationale] = React.useState('');

  if (!isOpen) return null;

  const adrCode = `ADR-${String(nextAdrNumber).padStart(3, '0')}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSubmit({
      id: `adr-${String(nextAdrNumber).padStart(3, '0')}`,
      code: adrCode,
      title: title.trim(),
      status,
      owner,
      reviewRequested: 'Review requested today',
      mergedOrPr: `PR #${895 + nextAdrNumber}`,
      date: 'Just now',
    });

    setTitle('');
    setRationale('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface-container-high border border-outline-variant/40 shadow-2xl p-space-md space-y-space-md animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-outline-variant/30 pb-space-xs">
          <div className="flex items-center gap-2">
            <span className="font-code-block text-primary text-label-sm font-semibold">{adrCode}</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">Draft Architecture Decision</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-space-sm text-label-sm">
          <div>
            <label className="block text-outline text-[11px] uppercase tracking-wider mb-1 font-medium">
              Decision Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Asynchronous Kafka Stream Partitioning Strategy"
              className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-space-sm">
            <div>
              <label className="block text-outline text-[11px] uppercase tracking-wider mb-1 font-medium">
                Decision Owner
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-body-md text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-outline text-[11px] uppercase tracking-wider mb-1 font-medium">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-body-md text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="Needs Review">Needs Review</option>
                <option value="Approved">Approved</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-outline text-[11px] uppercase tracking-wider mb-1 font-medium">
              Context & Problem Statement
            </label>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Detail technical motivations, constraints, alternative options evaluated, and compliance impact..."
              className="w-full px-3 py-1.5 rounded bg-surface-container-lowest border border-outline-variant/50 text-body-md text-on-surface focus:outline-none focus:border-primary"
            />
          </div>

          <div className="pt-space-xs flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container font-medium transition-colors cursor-pointer"
            >
              Create ADR
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
