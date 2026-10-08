import React from 'react';
import { ViewPath } from '../types';

interface SidebarProps {
  currentPath: ViewPath;
  onNavigate: (path: ViewPath) => void;
  favoritesCount: number;
  themeMode: 'dark' | 'contrast';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPath,
  onNavigate,
  favoritesCount,
  themeMode,
  onToggleTheme,
}) => {
  const [treeExpanded, setTreeExpanded] = React.useState<{ [key: string]: boolean }>({
    atlas: true,
    engineering: false,
    helix: false,
    orion: false,
    processes: false,
    talent: false,
  });

  const [orgOpen, setOrgOpen] = React.useState(false);

  const toggleNode = (node: string) => {
    setTreeExpanded((prev) => ({ ...prev, [node]: !prev[node] }));
  };

  const isCurrent = (path: ViewPath) => currentPath === path;

  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface-container-low border-r border-outline-variant/30 flex flex-col z-30 select-none">
      {/* Brand & Workspace Switcher */}
      <div className="p-space-sm pb-0">
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-space-sm px-space-xs py-space-xs cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="w-6 h-6 rounded bg-secondary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px] text-primary">hub</span>
          </div>
          <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">Data Hub</span>
        </div>

        <div className="mt-space-xs relative">
          <button
            onClick={() => setOrgOpen(!orgOpen)}
            className="w-full flex items-center justify-between px-space-xs py-[5px] rounded bg-surface-container hover:bg-surface-container-high transition-colors"
            type="button"
          >
            <div className="flex items-center gap-space-xs">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span className="font-label-sm text-label-sm text-on-surface truncate">Nova Labs</span>
            </div>
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
              {orgOpen ? 'expand_less' : 'unfold_more'}
            </span>
          </button>

          {orgOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 p-1 bg-surface-container-high border border-outline-variant/40 rounded shadow-xl z-50 space-y-1">
              <div className="px-2 py-1 text-[11px] font-label-sm text-outline uppercase tracking-wider">Organizations</div>
              <button 
                onClick={() => setOrgOpen(false)}
                className="w-full text-left px-2 py-1 rounded bg-surface-container-highest text-primary font-label-sm text-label-sm flex items-center justify-between"
              >
                <span>Nova Labs</span>
                <span className="material-symbols-outlined text-[14px]">check</span>
              </button>
              <button 
                onClick={() => setOrgOpen(false)}
                className="w-full text-left px-2 py-1 rounded text-on-surface-variant hover:bg-surface-container font-label-sm text-label-sm"
              >
                Nova Cloud Infrastructure
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-space-xs py-space-sm space-y-space-md">
        {/* Core Nav */}
        <nav className="space-y-[2px]">
          <button
            onClick={() => onNavigate('home')}
            className={`w-full flex items-center gap-space-xs px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
              isCurrent('home')
                ? 'bg-surface-container-high text-on-surface font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">home</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => onNavigate('search')}
            className={`w-full flex items-center justify-between px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
              isCurrent('search')
                ? 'bg-surface-container-high text-on-surface font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[16px]">search</span>
              <span>Search</span>
            </div>
            <kbd className="font-code-block text-[10px] px-1 py-[1px] rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/40">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={() => onNavigate('knowledge')}
            className={`w-full flex items-center gap-space-xs px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
              isCurrent('knowledge')
                ? 'bg-surface-container-high text-on-surface font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">folder</span>
            <span>Knowledge</span>
          </button>

          <button
            onClick={() => onNavigate('projects-atlas-erp')}
            className={`w-full flex items-center gap-space-xs px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
              isCurrent('projects') || isCurrent('projects-atlas-erp')
                ? 'bg-surface-container-high text-on-surface font-semibold'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">layers</span>
            <span>Projects</span>
          </button>
        </nav>

        {/* Personal */}
        <div>
          <div className="px-space-xs py-[3px] font-label-sm text-[11px] uppercase tracking-wider text-outline">
            Personal
          </div>
          <nav className="mt-[2px] space-y-[2px]">
            <button
              onClick={() => onNavigate('favorites')}
              className={`w-full flex items-center justify-between px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
                isCurrent('favorites')
                  ? 'bg-surface-container-high text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-[16px]">star</span>
                <span>Favorites</span>
              </div>
              <span className="font-label-sm text-[11px] text-on-surface-variant">{favoritesCount}</span>
            </button>

            <button
              onClick={() => onNavigate('recent')}
              className={`w-full flex items-center gap-space-xs px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
                isCurrent('recent')
                  ? 'bg-surface-container-high text-on-surface font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>Recent</span>
            </button>
          </nav>
        </div>

        {/* Workspace Tree */}
        <div>
          <div className="px-space-xs py-[3px] font-label-sm text-[11px] uppercase tracking-wider text-outline">
            Workspace Tree
          </div>
          <nav className="mt-[2px] space-y-[2px]">
            {/* Engineering */}
            <div>
              <button
                onClick={() => {
                  toggleNode('engineering');
                  onNavigate('engineering');
                }}
                className="w-full flex items-center gap-1 px-space-xs py-[5px] rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors font-label-md text-label-md text-left"
              >
                <span className="material-symbols-outlined text-[14px] text-outline">
                  {treeExpanded.engineering ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[16px]">code</span>
                <span>Engineering</span>
              </button>
            </div>

            {/* Atlas ERP */}
            <div className="space-y-[1px]">
              <button
                onClick={() => {
                  toggleNode('atlas');
                  onNavigate('projects-atlas-erp');
                }}
                className={`w-full flex items-center gap-1 px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
                  currentPath.startsWith('atlas') || currentPath === 'projects-atlas-erp'
                    ? 'bg-surface-container-high text-on-surface font-semibold'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-outline">
                  {treeExpanded.atlas ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>Atlas ERP</span>
              </button>

              {treeExpanded.atlas && (
                <div className="ml-4 pl-2 border-l border-outline-variant/30 space-y-[1px]">
                  <button
                    onClick={() => onNavigate('atlas-architecture')}
                    className={`w-full flex items-center px-space-xs py-[4px] rounded transition-colors text-left font-label-sm text-label-sm ${
                      isCurrent('atlas-architecture')
                        ? 'bg-surface-container-high text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    Architecture
                  </button>
                  <button
                    onClick={() => onNavigate('atlas-adrs')}
                    className={`w-full flex items-center px-space-xs py-[4px] rounded transition-colors text-left font-label-sm text-label-sm ${
                      isCurrent('atlas-adrs')
                        ? 'bg-surface-container-high text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    ADRs
                  </button>
                  <button
                    onClick={() => onNavigate('atlas-apis')}
                    className={`w-full flex items-center px-space-xs py-[4px] rounded transition-colors text-left font-label-sm text-label-sm ${
                      isCurrent('atlas-apis')
                        ? 'bg-surface-container-high text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    APIs
                  </button>
                  <button
                    onClick={() => onNavigate('atlas-runbooks')}
                    className={`w-full flex items-center px-space-xs py-[4px] rounded transition-colors text-left font-label-sm text-label-sm ${
                      isCurrent('atlas-runbooks')
                        ? 'bg-surface-container-high text-on-surface font-semibold'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`}
                  >
                    Runbooks
                  </button>
                </div>
              )}
            </div>

            {/* Helix Platform */}
            <div>
              <button
                onClick={() => {
                  toggleNode('helix');
                  onNavigate('helix-platform');
                }}
                className={`w-full flex items-center gap-1 px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
                  isCurrent('helix-platform')
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-outline">
                  {treeExpanded.helix ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[16px]">grid_view</span>
                <span>Helix Platform</span>
              </button>
            </div>

            {/* Orion Mobile */}
            <div>
              <button
                onClick={() => {
                  toggleNode('orion');
                  onNavigate('orion-mobile');
                }}
                className={`w-full flex items-center gap-1 px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
                  isCurrent('orion-mobile')
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-outline">
                  {treeExpanded.orion ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[16px]">smartphone</span>
                <span>Orion Mobile</span>
              </button>
            </div>

            {/* Internal Processes */}
            <div>
              <button
                onClick={() => {
                  toggleNode('processes');
                  onNavigate('internal-processes');
                }}
                className={`w-full flex items-center gap-1 px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
                  isCurrent('internal-processes')
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-outline">
                  {treeExpanded.processes ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                <span>Internal Processes</span>
              </button>
            </div>

            {/* Talent */}
            <div>
              <button
                onClick={() => {
                  toggleNode('talent');
                  onNavigate('talent');
                }}
                className={`w-full flex items-center gap-1 px-space-xs py-[5px] rounded transition-colors font-label-md text-label-md text-left ${
                  isCurrent('talent')
                    ? 'bg-surface-container-high text-on-surface'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-outline">
                  {treeExpanded.talent ? 'expand_more' : 'chevron_right'}
                </span>
                <span className="material-symbols-outlined text-[16px]">badge</span>
                <span>Talent</span>
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-space-xs border-t border-outline-variant/30 space-y-space-xs">
        <nav className="space-y-[2px]">
          <button
            onClick={() => onNavigate('people')}
            className={`w-full flex items-center gap-space-xs px-space-xs py-[4px] rounded transition-colors font-label-md text-label-md text-left ${
              isCurrent('people')
                ? 'bg-surface-container-high text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">group</span>
            <span>People</span>
          </button>
          <button
            onClick={() => onNavigate('templates')}
            className={`w-full flex items-center gap-space-xs px-space-xs py-[4px] rounded transition-colors font-label-md text-label-md text-left ${
              isCurrent('templates')
                ? 'bg-surface-container-high text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Templates</span>
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center gap-space-xs px-space-xs py-[4px] rounded transition-colors font-label-md text-label-md text-left ${
              isCurrent('settings')
                ? 'bg-surface-container-high text-on-surface'
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">settings</span>
            <span>Settings</span>
          </button>
        </nav>

        <div className="pt-space-xs border-t border-outline-variant/20 flex items-center justify-between px-space-xs py-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
            <div className="min-w-0 leading-tight">
              <p className="font-label-md text-label-md text-on-surface truncate font-medium">Alex</p>
              <p className="font-label-sm text-[11px] text-outline truncate">Platform Architect</p>
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className="p-1 rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
            title="Toggle theme contrast"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {themeMode === 'contrast' ? 'brightness_medium' : 'light_mode'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
};
