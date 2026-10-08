import React from 'react';
import { ViewPath, TabId, AdrRecord, RunbookRecord } from '../types';
import { ARCHITECTURE_ITEMS } from '../data/mockData';

interface AtlasErpViewProps {
  onNavigate: (path: ViewPath) => void;
  adrs: AdrRecord[];
  runbooks: RunbookRecord[];
  onOpenDraftAdr: () => void;
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
}

export const AtlasErpView: React.FC<AtlasErpViewProps> = ({
  onNavigate,
  adrs,
  runbooks,
  onOpenDraftAdr,
  activeTab,
  onSelectTab,
}) => {
  return (
    <div className="max-w-[760px] mx-auto px-space-md py-space-xl">
      <div className="flex flex-col w-full">
        {/* Subtle Header Meta Block */}
        <header className="flex flex-col gap-space-sm pb-space-lg">
          <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline">
            <button 
              onClick={() => onNavigate('home')} 
              className="hover:text-on-surface cursor-pointer transition-colors"
            >
              Projects
            </button>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface font-medium">Atlas ERP</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-space-sm mt-1">
            <div className="flex items-baseline gap-space-md">
              <h1 className="font-display text-display tracking-tight text-on-surface">Atlas ERP</h1>
              <span className="font-code-block text-code-block text-outline">v2.4.0-rc3</span>
            </div>
            <div className="flex items-center gap-space-sm text-on-surface-variant font-label-sm text-label-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Platform Engineering
              </span>
              <span className="text-outline-variant">·</span>
              <span className="text-outline">Synced 2h ago</span>
            </div>
          </div>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mt-space-xs">
            Internal enterprise resource planning platform unifying multi-entity ledger balances, procurement pipelines, and supply chain telemetry.
          </p>

          {/* Technical Stack Micro Pills */}
          <div className="flex flex-wrap items-center gap-space-xs mt-space-xs">
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-block text-[11px] text-on-surface tracking-wide">
              React 18
            </span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-block text-[11px] text-on-surface tracking-wide">
              TypeScript
            </span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-block text-[11px] text-on-surface tracking-wide">
              Node.js 20 LTS
            </span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-block text-[11px] text-on-surface tracking-wide">
              MySQL 8.0
            </span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-block text-[11px] text-on-surface tracking-wide">
              Azure AKS
            </span>
            <span className="px-space-xs py-0.5 rounded bg-surface-container font-code-block text-[11px] text-outline">
              Kafka Bus
            </span>
          </div>
        </header>

        {/* Segment Tab Navigation */}
        <nav className="flex items-center gap-space-md overflow-x-auto bg-surface-container-low px-space-sm py-1.5 rounded mb-space-xl text-on-surface-variant select-none">
          <button
            onClick={() => onSelectTab('overview')}
            className={`font-label-md text-label-md px-2 py-1 relative flex items-center gap-1.5 transition-colors ${
              activeTab === 'overview' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            <span>Overview</span>
            {activeTab === 'overview' && (
              <span className="absolute bottom-[-6px] left-2 right-2 h-[2px] bg-primary"></span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectTab('architecture');
              onNavigate('atlas-architecture');
            }}
            className={`font-label-md text-label-md px-2 py-1 transition-colors ${
              activeTab === 'architecture' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            Architecture
          </button>

          <button
            onClick={() => {
              onSelectTab('adrs');
              onNavigate('atlas-adrs');
            }}
            className={`font-label-md text-label-md px-2 py-1 transition-colors flex items-center gap-1 ${
              activeTab === 'adrs' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            <span>ADRs</span>
            <span className="text-[10px] font-code-block text-outline px-1 rounded bg-surface-container-highest">
              {adrs.length}
            </span>
          </button>

          <button
            onClick={() => {
              onSelectTab('apis');
              onNavigate('atlas-apis');
            }}
            className={`font-label-md text-label-md px-2 py-1 transition-colors ${
              activeTab === 'apis' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            APIs
          </button>

          <button
            onClick={() => {
              onSelectTab('runbooks');
              onNavigate('atlas-runbooks');
            }}
            className={`font-label-md text-label-md px-2 py-1 transition-colors ${
              activeTab === 'runbooks' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            Runbooks
          </button>

          <button
            onClick={() => onSelectTab('deployment')}
            className={`font-label-md text-label-md px-2 py-1 transition-colors ${
              activeTab === 'deployment' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            Deployment
          </button>

          <button
            onClick={() => onSelectTab('security')}
            className={`font-label-md text-label-md px-2 py-1 transition-colors ${
              activeTab === 'security' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            Security
          </button>

          <button
            onClick={() => onSelectTab('onboarding')}
            className={`font-label-md text-label-md px-2 py-1 transition-colors ${
              activeTab === 'onboarding' ? 'text-primary font-medium' : 'hover:text-on-surface'
            }`}
            type="button"
          >
            Onboarding
          </button>
        </nav>

        {/* Main Split Architecture View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
          {/* Primary Editorial Index (8 cols) */}
          <div className="lg:col-span-8 space-y-space-xl">
            {/* Section 1: ARCHITECTURE */}
            <section className="space-y-space-xs">
              <div className="flex items-center justify-between py-1">
                <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                  Architecture & Topology
                </h2>
                <span className="font-code-block text-[11px] text-outline">3 items</span>
              </div>

              <div className="space-y-1">
                {ARCHITECTURE_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate(item.path)}
                    className="group block p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                            {item.title}
                          </span>
                          {item.canonical && (
                            <span className="px-1.5 py-0.5 rounded bg-surface-container-high font-label-sm text-[10px] text-outline">
                              Canonical
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      </div>
                      <div className="shrink-0 text-right font-label-sm text-label-sm text-outline">
                        {item.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: ADRs */}
            <section className="space-y-space-xs">
              <div className="flex items-center justify-between py-1">
                <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                  Architecture Decision Records (ADRs)
                </h2>
                <button
                  onClick={() => onNavigate('atlas-adrs')}
                  className="font-label-sm text-[11px] text-primary hover:underline"
                >
                  View archive
                </button>
              </div>

              <div className="space-y-1">
                {adrs.map((adr) => (
                  <div
                    key={adr.id}
                    onClick={() => onNavigate('atlas-architecture')}
                    className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-space-sm">
                      <div className="min-w-0 flex items-center gap-space-sm">
                        <span className="font-code-block text-[11px] text-outline shrink-0">{adr.code}</span>
                        <span className="font-headline-sm text-headline-sm text-on-surface truncate">
                          {adr.title}
                        </span>
                      </div>

                      {adr.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-label-sm text-[11px] shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-label-sm text-[11px] shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Needs Review
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-space-md text-outline font-label-sm text-[11px]">
                      <span>Decision Owner: {adr.owner}</span>
                      <span>·</span>
                      {adr.approvedBy && <span>Approved by {adr.approvedBy}</span>}
                      {adr.reviewRequested && <span>{adr.reviewRequested}</span>}
                      <span>·</span>
                      <span className="font-code-block">{adr.mergedOrPr}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 3: RUNBOOKS */}
            <section className="space-y-space-xs">
              <div className="flex items-center justify-between py-1">
                <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
                  Operational Runbooks
                </h2>
                <span className="font-code-block text-[11px] text-outline">SRE verified</span>
              </div>

              <div className="space-y-1">
                {runbooks.map((rb) => (
                  <div
                    key={rb.id}
                    onClick={() => onNavigate('atlas-runbooks')}
                    className="group block p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-space-sm">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors">
                            {rb.title}
                          </span>
                          {rb.badge && (
                            <span className="px-1.5 py-0.2 rounded bg-error-container/40 text-error font-label-sm text-[10px]">
                              {rb.badge}
                            </span>
                          )}
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {rb.description}
                        </p>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline shrink-0">{rb.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Technical Callout Strip */}
            <div className="p-space-sm rounded bg-surface-container-low border-l-2 border-l-primary flex items-start gap-space-sm">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">info</span>
              <div className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="text-on-surface font-medium">Compliance Constraint:</strong> All schema modifications impacting Ledger accounts require a synchronous sign-off from Finance Platform Lead before ADR approval.
              </div>
            </div>
          </div>

          {/* Contextual Right Rail / Meta Panel (4 cols) */}
          <aside className="lg:col-span-4 space-y-space-lg">
            {/* Metrics & Inventory */}
            <div className="bg-surface-container-low p-space-md rounded space-y-space-md">
              <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Knowledge Assets
              </h3>
              <div className="grid grid-cols-2 gap-space-sm">
                <div className="bg-surface-container p-space-sm rounded">
                  <div className="font-display text-[1.5rem] leading-none text-on-surface">18</div>
                  <div className="font-label-sm text-[11px] text-outline mt-1">Documents</div>
                </div>
                <div className="bg-surface-container p-space-sm rounded">
                  <div className="font-display text-[1.5rem] leading-none text-primary">{adrs.length}</div>
                  <div className="font-label-sm text-[11px] text-outline mt-1">ADRs Active</div>
                </div>
                <div className="bg-surface-container p-space-sm rounded">
                  <div className="font-display text-[1.5rem] leading-none text-on-surface">{runbooks.length}</div>
                  <div className="font-label-sm text-[11px] text-outline mt-1">Runbooks</div>
                </div>
                <div className="bg-surface-container p-space-sm rounded">
                  <div className="font-display text-[1.5rem] leading-none text-on-surface">12</div>
                  <div className="font-label-sm text-[11px] text-outline mt-1">APIs Exposed</div>
                </div>
              </div>
            </div>

            {/* Quick Repository Link */}
            <div className="bg-surface-container-low p-space-md rounded space-y-space-xs">
              <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Primary Source
              </h3>
              <a
                className="flex items-center justify-between p-space-xs rounded bg-surface-container hover:bg-surface-container-high transition-colors group"
                href="#repo"
                onClick={(e) => e.preventDefault()}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-primary">
                    terminal
                  </span>
                  <span className="font-code-block text-[11px] text-on-surface truncate">
                    git.novalabs.internal/atlas-erp
                  </span>
                </div>
                <span className="material-symbols-outlined text-[14px] text-outline">open_in_new</span>
              </a>
            </div>

            {/* Core Contacts / Engineering Leads */}
            <div className="bg-surface-container-low p-space-md rounded space-y-space-md">
              <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-outline">
                Key Ownership
              </h3>
              <div className="space-y-space-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-secondary-container flex items-center justify-center text-primary font-label-md text-label-md shrink-0 font-medium">
                      A
                    </div>
                    <div className="min-w-0 leading-none">
                      <p className="font-label-md text-label-md text-on-surface truncate font-medium">Alex</p>
                      <p className="font-label-sm text-[11px] text-outline truncate mt-1">Lead Platform Architect</p>
                    </div>
                  </div>
                  <span className="font-label-sm text-[10px] text-outline px-1 rounded bg-surface-container">
                    Primary
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center text-on-surface-variant font-label-md text-label-md shrink-0 font-medium">
                      ER
                    </div>
                    <div className="min-w-0 leading-none">
                      <p className="font-label-md text-label-md text-on-surface truncate font-medium">Elena Rostova</p>
                      <p className="font-label-sm text-[11px] text-outline truncate mt-1">DevOps & Infrastructure</p>
                    </div>
                  </div>
                  <span className="font-label-sm text-[10px] text-outline px-1 rounded bg-surface-container">
                    Reviewer
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Utility */}
            <div className="bg-surface-container-low p-space-sm rounded flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">Need architectural sign-off?</span>
              <button
                onClick={onOpenDraftAdr}
                className="px-space-sm py-1 bg-secondary-container hover:bg-secondary-container/80 text-on-secondary-container rounded font-label-sm text-label-sm transition-colors cursor-pointer font-medium"
                type="button"
              >
                Draft ADR
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
