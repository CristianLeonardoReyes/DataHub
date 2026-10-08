import React from 'react';
import { ViewPath } from '../types';

interface HomeViewProps {
  onNavigate: (path: ViewPath) => void;
  onCopyLink: (text: string) => void;
  favorites: { id: string; title: string; path: ViewPath; sub: string }[];
  onToggleFavorite: (title: string, path: ViewPath) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onCopyLink,
  favorites,
  onToggleFavorite,
}) => {
  return (
    <div className="max-w-[760px] mx-auto px-space-md py-space-xl">
      <div className="flex flex-col w-full">
        {/* Header Block */}
        <div className="relative pb-space-lg">
          <div className="absolute -top-10 -left-12 w-64 h-64 bg-secondary-container/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <div className="flex items-baseline justify-between mb-space-xs">
              <h1 className="font-display text-display text-on-surface tracking-tight">Good morning, Alex</h1>
              <span className="font-code-inline text-code-inline text-outline flex items-center gap-1.5 opacity-70">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                nova-core v4.19
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Continue exploring Nova Labs knowledge.
            </p>
          </div>
        </div>

        {/* Search Input trigger */}
        <div 
          onClick={() => onNavigate('search')}
          className="relative my-space-md group cursor-pointer"
        >
          <div className="relative flex items-center bg-surface-container-low hover:bg-surface-container transition-colors rounded px-space-md py-2.5">
            <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors mr-3">
              search
            </span>
            <input
              className="w-full bg-transparent border-none outline-none font-body-md text-body-md text-on-surface placeholder:text-outline/70 focus:ring-0 p-0 cursor-pointer"
              id="hub-search-input"
              placeholder="Search documents, architecture, ADRs, runbooks (⌘K)"
              readOnly
              type="text"
            />
            <div className="flex items-center gap-1.5 shrink-0 pl-3">
              <kbd className="font-code-block text-[11px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Content Rows */}
        <div className="mt-space-xl flex flex-col space-y-space-xl">
          {/* Recently Viewed */}
          <section>
            <div className="flex items-center justify-between pb-space-xs mb-space-xs">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm tracking-wider uppercase text-outline">Recently Viewed</span>
                <span className="font-code-block text-[11px] text-outline/60">03</span>
              </div>
              <button
                onClick={() => onNavigate('recent')}
                className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>View all history</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

            <div className="flex flex-col">
              {/* Item 1 */}
              <div 
                onClick={() => onNavigate('atlas-architecture')}
                className="group flex items-center justify-between py-space-sm px-space-xs rounded hover:bg-surface-container-low transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant group-hover:text-primary group-hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px]">account_tree</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors truncate font-medium">
                        Production Deployment Architecture
                      </span>
                      <span className="font-code-inline text-[10px] px-1.5 py-0.2 bg-surface-container-highest text-on-surface-variant rounded">
                        ADR-104
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline truncate mt-0.5">
                      Atlas ERP <span className="mx-1 text-outline-variant/60">·</span> Architecture
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-code-inline text-code-inline text-outline text-[12px] tabular-nums">
                    Updated 2h ago
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyLink('https://datahub.novalabs.internal/atlas-erp/architecture/deployment');
                      }}
                      className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Copy Link"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">link</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite('Production Deployment Architecture', 'atlas-architecture');
                      }}
                      className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
                      title="Toggle Favorite"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">star</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div 
                onClick={() => onNavigate('atlas-apis')}
                className="group flex items-center justify-between py-space-sm px-space-xs rounded hover:bg-surface-container-low transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant group-hover:text-primary group-hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px]">key</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors truncate font-medium">
                        API Authentication Standard
                      </span>
                      <span className="font-code-inline text-[10px] px-1.5 py-0.2 bg-surface-container-highest text-on-surface-variant rounded">
                        v2.4
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline truncate mt-0.5">
                      Engineering <span className="mx-1 text-outline-variant/60">·</span> APIs
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-code-inline text-code-inline text-outline text-[12px] tabular-nums">
                    Updated yesterday
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyLink('https://datahub.novalabs.internal/engineering/apis/authentication-standard');
                      }}
                      className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Copy Link"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">link</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite('API Authentication Standard', 'atlas-apis');
                      }}
                      className="p-1 rounded text-outline hover:text-primary hover:bg-surface-container-high transition-colors"
                      title="Toggle Favorite"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">star</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div 
                onClick={() => onNavigate('atlas-runbooks')}
                className="group flex items-center justify-between py-space-sm px-space-xs rounded hover:bg-surface-container-low transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 pr-4">
                  <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center shrink-0 text-on-surface-variant group-hover:text-primary group-hover:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px]">terminal</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors truncate font-medium">
                        Production Incident Runbook
                      </span>
                      <span className="font-code-inline text-[10px] px-1.5 py-0.2 bg-secondary-container/40 text-on-secondary-container rounded">
                        L1-OPS
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline truncate mt-0.5">
                      Atlas ERP <span className="mx-1 text-outline-variant/60">·</span> Runbooks
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-code-inline text-code-inline text-outline text-[12px] tabular-nums">
                    Updated Sep 20
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity pl-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyLink('https://datahub.novalabs.internal/atlas-erp/runbooks/incident-response');
                      }}
                      className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                      title="Copy Link"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]">link</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite('Production Incident Runbook', 'atlas-runbooks');
                      }}
                      className="p-1 rounded text-primary hover:bg-surface-container-high transition-colors"
                      title="Toggle Favorite"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Projects */}
          <section>
            <div className="flex items-center justify-between pb-space-xs mb-space-xs">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm tracking-wider uppercase text-outline">Projects</span>
                <span className="font-code-block text-[11px] text-outline/60">03</span>
              </div>
              <button 
                onClick={() => onNavigate('projects-atlas-erp')}
                className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors flex items-center gap-1"
              >
                <span>All initiatives</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

            <div className="flex flex-col space-y-1">
              <div 
                onClick={() => onNavigate('projects-atlas-erp')}
                className="group block p-space-sm rounded hover:bg-surface-container-low transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                      Atlas ERP
                    </span>
                    <span className="font-code-inline text-[11px] text-outline">atlas-main</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-outline">18 documents</span>
                </div>
                <div className="flex items-center justify-between pl-4.5">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Enterprise resource planning platform</p>
                  <div className="flex items-center gap-2 font-code-inline text-[11px] text-outline/80">
                    <span>React</span>
                    <span className="text-outline-variant/40">/</span>
                    <span>Node.js</span>
                    <span className="text-outline-variant/40">/</span>
                    <span>Azure</span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate('helix-platform')}
                className="group block p-space-sm rounded hover:bg-surface-container-low transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                      Helix Platform
                    </span>
                    <span className="font-code-inline text-[11px] text-outline">helix-api</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-outline">32 documents</span>
                </div>
                <div className="flex items-center justify-between pl-4.5">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Customer integration platform</p>
                  <div className="flex items-center gap-2 font-code-inline text-[11px] text-outline/80">
                    <span>TypeScript</span>
                    <span className="text-outline-variant/40">/</span>
                    <span>PostgreSQL</span>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => onNavigate('orion-mobile')}
                className="group block p-space-sm rounded hover:bg-surface-container-low transition-colors duration-150 cursor-pointer"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                    <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                      Orion Mobile
                    </span>
                    <span className="font-code-inline text-[11px] text-outline">orion-app</span>
                  </div>
                  <span className="font-body-sm text-body-sm text-outline">14 documents</span>
                </div>
                <div className="flex items-center justify-between pl-4.5">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">Mobile operations application</p>
                  <div className="flex items-center gap-2 font-code-inline text-[11px] text-outline/80">
                    <span>React Native</span>
                    <span className="text-outline-variant/40">/</span>
                    <span>Node.js</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bottom Grid: Favorites & Needs Review */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg pt-space-xs">
            {/* Favorites */}
            <section className="flex flex-col">
              <div className="flex items-center justify-between pb-space-xs mb-space-xs">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm tracking-wider uppercase text-outline">Favorites</span>
                  <span className="font-code-block text-[11px] text-outline/60">
                    {String(favorites.length).padStart(2, '0')}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[15px] text-outline">bookmark</span>
              </div>
              <div className="flex flex-col space-y-1">
                {favorites.slice(0, 4).map((fav) => (
                  <div
                    key={fav.id}
                    onClick={() => onNavigate(fav.path)}
                    className="group flex items-center justify-between py-2 px-space-xs rounded hover:bg-surface-container-low transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="material-symbols-outlined text-[15px] text-primary"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors truncate">
                        {fav.title}
                      </span>
                    </div>
                    <span className="font-code-inline text-[11px] text-outline opacity-70 group-hover:opacity-100">
                      {fav.sub}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Needs Review */}
            <section className="flex flex-col">
              <div className="flex items-center justify-between pb-space-xs mb-space-xs">
                <div className="flex items-center gap-2">
                  <span className="font-label-sm text-label-sm tracking-wider uppercase text-outline">Needs Review</span>
                  <span className="font-code-block text-[11px] text-outline/60">02</span>
                </div>
                <span className="material-symbols-outlined text-[15px] text-outline">rate_review</span>
              </div>
              <div className="flex flex-col space-y-1">
                <div
                  onClick={() => onNavigate('search')}
                  className="group flex items-center justify-between py-2 px-space-xs rounded hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary shrink-0"></span>
                    <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors truncate">
                      Kubernetes Production Checklist
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-code-inline text-[11px] text-tertiary">Due Sep 28</span>
                    <span className="font-label-sm text-[11px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                      Needs Review
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => onNavigate('atlas-architecture')}
                  className="group flex items-center justify-between py-2 px-space-xs rounded hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"></span>
                    <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors truncate">
                      Authentication Architecture
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-code-inline text-[11px] text-outline">Due Oct 03</span>
                    <span className="font-label-sm text-[11px] text-on-secondary-container bg-secondary-container/40 px-1.5 py-0.5 rounded">
                      In Review
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="mt-space-xl pt-space-lg flex items-center justify-between font-label-sm text-label-sm text-outline opacity-60">
          <div className="flex items-center gap-4">
            <span>Nova Labs Knowledge Mesh</span>
            <span>·</span>
            <span>Region: us-east-prod</span>
          </div>
          <div className="flex items-center gap-3 font-code-inline text-[11px]">
            <span>Latency: 18ms</span>
            <span>
              Press <kbd className="px-1 py-0.5 bg-surface-container rounded text-on-surface-variant">?</kbd> for shortcuts
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
