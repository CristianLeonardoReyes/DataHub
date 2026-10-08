import React from 'react';
import { ViewPath } from '../types';

interface TopHeaderProps {
  currentPath: ViewPath;
  onNavigate: (path: ViewPath) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenShare: () => void;
  onToggleContrast: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPath,
  onNavigate,
  isFavorite,
  onToggleFavorite,
  onOpenShare,
  onToggleContrast,
}) => {
  const [showMoreMenu, setShowMoreMenu] = React.useState(false);

  // Dynamic breadcrumb generation
  const renderBreadcrumbs = () => {
    switch (currentPath) {
      case 'home':
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <span className="text-on-surface font-medium">Home</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant">Dashboard</span>
          </div>
        );
      case 'search':
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <span className="text-on-surface font-medium">Search</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant">Global Query</span>
          </div>
        );
      case 'atlas-architecture':
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <button
              onClick={() => onNavigate('projects-atlas-erp')}
              className="hover:text-on-surface transition-colors cursor-pointer"
            >
              Projects
            </button>
            <span className="text-outline-variant">/</span>
            <button
              onClick={() => onNavigate('projects-atlas-erp')}
              className="hover:text-on-surface transition-colors cursor-pointer"
            >
              Atlas ERP
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Architecture</span>
          </div>
        );
      case 'atlas-adrs':
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <button onClick={() => onNavigate('projects-atlas-erp')} className="hover:text-on-surface transition-colors">
              Projects
            </button>
            <span className="text-outline-variant">/</span>
            <button onClick={() => onNavigate('projects-atlas-erp')} className="hover:text-on-surface transition-colors">
              Atlas ERP
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">ADRs</span>
          </div>
        );
      case 'atlas-runbooks':
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <button onClick={() => onNavigate('projects-atlas-erp')} className="hover:text-on-surface transition-colors">
              Projects
            </button>
            <span className="text-outline-variant">/</span>
            <button onClick={() => onNavigate('projects-atlas-erp')} className="hover:text-on-surface transition-colors">
              Atlas ERP
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Runbooks</span>
          </div>
        );
      case 'helix-platform':
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <span>Projects</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Helix Platform</span>
          </div>
        );
      case 'orion-mobile':
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <span>Projects</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Orion Mobile</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <button
              onClick={() => onNavigate('projects-atlas-erp')}
              className="hover:text-on-surface transition-colors cursor-pointer"
            >
              Projects
            </button>
            <span className="text-outline-variant">/</span>
            <button
              onClick={() => onNavigate('projects-atlas-erp')}
              className="hover:text-on-surface transition-colors cursor-pointer"
            >
              Atlas ERP
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Architecture</span>
          </div>
        );
    }
  };

  return (
    <header className="fixed top-0 left-[240px] right-0 h-11 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/30 z-20 flex items-center justify-between px-space-md">
      {renderBreadcrumbs()}

      <div className="flex items-center gap-space-xs">
        <button
          onClick={onToggleFavorite}
          className={`p-1 rounded transition-colors ${
            isFavorite
              ? 'text-primary hover:bg-surface-container'
              : 'text-outline hover:bg-surface-container hover:text-on-surface'
          }`}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          type="button"
        >
          <span 
            className="material-symbols-outlined text-[16px]"
            style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}
          >
            star
          </span>
        </button>

        <button
          onClick={onOpenShare}
          className="px-2 py-1 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-sm text-label-sm flex items-center gap-1"
          type="button"
        >
          <span className="material-symbols-outlined text-[14px]">ios_share</span>
          <span>Share</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="p-1 rounded text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">more_horiz</span>
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 p-1 rounded-lg bg-surface-container-high border border-outline-variant/40 shadow-2xl z-50 text-label-sm">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-container text-on-surface transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[15px] text-outline">link</span>
                <span>Copy Page URL</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-container text-on-surface transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[15px] text-outline">print</span>
                <span>Export / Print</span>
              </button>
              <div className="my-1 border-t border-outline-variant/30"></div>
              <button
                onClick={() => {
                  onNavigate('search');
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-surface-container text-on-surface transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[15px] text-outline">search</span>
                <span>Search Knowledge</span>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-3 bg-outline-variant/40 mx-1"></div>

        <button
          onClick={onToggleContrast}
          className="p-1 rounded text-outline hover:bg-surface-container hover:text-on-surface transition-colors"
          title="Toggle UI Contrast"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">contrast</span>
        </button>
      </div>
    </header>
  );
};
