import React from 'react';
import { ViewPath, DocItem } from '../types';

interface SearchViewProps {
  onNavigate: (path: ViewPath) => void;
  searchIndex: DocItem[];
}

export const SearchView: React.FC<SearchViewProps> = ({
  onNavigate,
  searchIndex,
}) => {
  const [query, setQuery] = React.useState('deployment production');
  const [filterProject, setFilterProject] = React.useState<string | null>('Atlas ERP');
  const [filterStatus, setFilterStatus] = React.useState<string | null>('Approved');
  const [showFilterDropdown, setShowFilterDropdown] = React.useState(false);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scopeFilters, setScopeFilters] = React.useState<{ [key: string]: boolean }>({
    Architecture: true,
    Runbooks: true,
    ADRs: true,
    'Post-mortems': false,
  });
  const [clusterFilter, setClusterFilter] = React.useState<string | null>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Filter items
  const filteredItems = searchIndex.filter((item) => {
    // text query match
    if (query.trim()) {
      const qTokens = query.toLowerCase().split(/\s+/).filter(Boolean);
      const text = `${item.title} ${item.excerpt} ${item.project} ${item.section}`.toLowerCase();
      const matchQuery = qTokens.some((t) => text.includes(t));
      if (!matchQuery) return false;
    }
    // project filter
    if (filterProject && item.project !== filterProject) {
      return false;
    }
    // status filter
    if (filterStatus && item.status !== filterStatus) {
      return false;
    }
    // scope filter
    if (scopeFilters[item.section] !== undefined && !scopeFilters[item.section]) {
      return false;
    }
    // cluster filter
    if (clusterFilter && item.cluster !== clusterFilter) {
      return false;
    }
    return true;
  });

  // Highlight matches
  const highlightText = (text: string) => {
    if (!query.trim()) return text;
    const tokens = query.trim().split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-primary font-bold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          onNavigate(filteredItems[selectedIndex].path);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setQuery('');
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setShowFilterDropdown((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredItems, selectedIndex, onNavigate]);

  return (
    <div className="max-w-[760px] mx-auto px-space-md py-space-xl">
      <div className="flex flex-col w-full">
        {/* Command / Search Terminal Bar */}
        <div className="relative w-full rounded-xl bg-surface-container-high shadow-xl p-space-sm mb-space-md">
          <div className="flex items-center gap-space-sm px-space-sm py-space-xs rounded-lg bg-surface-container-lowest">
            <span className="material-symbols-outlined text-primary text-[20px] select-none">search</span>
            <input
              ref={inputRef}
              autoComplete="off"
              className="w-full bg-transparent font-code-inline text-body-lg text-on-surface focus:outline-none placeholder:text-outline"
              id="global-search-input"
              placeholder="Search documentation, ADRs, runbooks, RFCs..."
              spellCheck="false"
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="flex items-center justify-center w-5 h-5 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors cursor-pointer"
                id="clear-query-btn"
                title="Clear query"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">close</span>
              </button>
            )}
            <div className="flex items-center gap-1 pl-space-xs">
              <kbd className="font-code-block text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-outline">
                ESC
              </kbd>
            </div>
          </div>

          {/* Active Filters & Refinement Bar */}
          <div className="flex flex-wrap items-center justify-between gap-space-sm mt-space-sm px-space-xs">
            <div className="flex flex-wrap items-center gap-space-xs">
              {/* Active Filter: Project */}
              {filterProject && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">
                  <span className="text-outline">Project:</span>
                  <span className="text-on-surface font-medium">{filterProject}</span>
                  <button
                    onClick={() => setFilterProject(null)}
                    className="text-outline hover:text-on-surface flex items-center cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </span>
              )}

              {/* Active Filter: Status */}
              {filterStatus && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">
                  <span className="text-outline">Status:</span>
                  <span className="text-on-surface font-medium">{filterStatus}</span>
                  <button
                    onClick={() => setFilterStatus(null)}
                    className="text-outline hover:text-on-surface flex items-center cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </span>
              )}

              {/* Cluster Filter if active */}
              {clusterFilter && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">
                  <span className="text-outline">Cluster:</span>
                  <span className="text-on-surface font-medium">{clusterFilter}</span>
                  <button
                    onClick={() => setClusterFilter(null)}
                    className="text-outline hover:text-on-surface flex items-center cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[13px]">close</span>
                  </button>
                </span>
              )}

              {/* Filter Reveal Popover Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container hover:bg-surface-bright text-outline hover:text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                  id="toggle-filter-panel"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  <span>Filters</span>
                  <span className="material-symbols-outlined text-[12px]">expand_more</span>
                </button>

                {/* Collapsible Popover Panel */}
                {showFilterDropdown && (
                  <div
                    className="absolute left-0 top-full mt-2 w-72 p-space-sm rounded-xl bg-surface-container-high shadow-2xl z-40 space-y-space-sm border border-outline-variant/30"
                    id="filter-dropdown-menu"
                  >
                    <div className="flex items-center justify-between pb-space-xs">
                      <span className="font-label-sm text-label-sm text-on-surface font-medium uppercase tracking-wider">
                        Refine Query
                      </span>
                      <button
                        onClick={() => {
                          setFilterProject(null);
                          setFilterStatus(null);
                          setClusterFilter(null);
                          setScopeFilters({
                            Architecture: true,
                            Runbooks: true,
                            ADRs: true,
                            'Post-mortems': true,
                          });
                        }}
                        className="text-[11px] font-label-sm text-primary hover:underline cursor-pointer"
                        id="reset-filters"
                        type="button"
                      >
                        Reset All
                      </button>
                    </div>

                    <div className="space-y-space-xs">
                      <label className="block font-label-sm text-[11px] text-outline">Document Scope</label>
                      <div className="grid grid-cols-2 gap-1 font-label-sm text-label-sm text-on-surface-variant">
                        {['Architecture', 'Runbooks', 'ADRs', 'Post-mortems'].map((scope) => (
                          <label
                            key={scope}
                            className="flex items-center gap-1.5 p-1 rounded hover:bg-surface-container cursor-pointer select-none"
                          >
                            <input
                              checked={!!scopeFilters[scope]}
                              onChange={(e) =>
                                setScopeFilters({ ...scopeFilters, [scope]: e.target.checked })
                              }
                              className="accent-primary rounded-sm cursor-pointer"
                              type="checkbox"
                            />{' '}
                            {scope}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-space-xs">
                      <label className="block font-label-sm text-[11px] text-outline">Cluster / Target</label>
                      <div className="flex flex-wrap gap-1">
                        {['k8s-prod-east', 'aks-eu-west', 'edge-gateway'].map((cluster) => (
                          <button
                            key={cluster}
                            onClick={() => setClusterFilter(clusterFilter === cluster ? null : cluster)}
                            className={`px-2 py-0.5 rounded font-code-block text-[10px] transition-colors cursor-pointer ${
                              clusterFilter === cluster
                                ? 'bg-primary text-on-primary font-medium'
                                : 'bg-surface-container text-outline hover:text-on-surface'
                            }`}
                            type="button"
                          >
                            {cluster}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => setShowFilterDropdown(false)}
                        className="px-2 py-1 bg-surface-container hover:bg-surface-bright text-on-surface rounded text-label-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Result Count Feedback */}
            <span className="font-label-sm text-label-sm text-outline">
              <span className="font-medium text-on-surface">{filteredItems.length}</span> results found across{' '}
              <span className="text-on-surface font-medium">Nova Labs</span>
            </span>
          </div>
        </div>

        {/* Search Results Stream */}
        <div className="flex flex-col space-y-space-xs" id="results-container">
          {filteredItems.length === 0 ? (
            <div className="p-space-xl text-center text-outline bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-[32px] mb-2 text-outline-variant">search_off</span>
              <p className="font-headline-sm text-on-surface">No documents match your query</p>
              <p className="font-body-sm text-on-surface-variant mt-1">
                Try searching for "architecture", "runbook", or clear active filters.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <div
                  key={item.id}
                  onClick={() => onNavigate(item.path)}
                  className={`group relative flex flex-col p-space-md rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-container-high/90 shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-start justify-between gap-space-md">
                    <div className="min-w-0 flex-1">
                      {/* Monospace Breadcrumb */}
                      <div className="flex items-center gap-1 font-code-inline text-label-sm text-outline mb-1 truncate">
                        <span className="material-symbols-outlined text-[14px] text-primary">domain</span>
                        <span>Projects</span>
                        <span className="text-outline-variant">/</span>
                        <span>{item.project}</span>
                        <span className="text-outline-variant">/</span>
                        <span className="text-primary-fixed-dim">{item.section}</span>
                      </div>

                      {/* Document Title */}
                      <h2 className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                        <span>{highlightText(item.title)}</span>
                        <span className="material-symbols-outlined text-[16px] opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                          arrow_forward
                        </span>
                      </h2>

                      {/* Document Excerpt with Highlighting */}
                      <p className="font-body-md text-body-md text-on-surface-variant mt-1 line-clamp-2">
                        {highlightText(item.excerpt)}
                      </p>
                    </div>

                    {/* Right Side Micro-Telemetry */}
                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {item.status === 'Approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest text-tertiary font-label-sm text-label-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                          Needs Review
                        </span>
                      )}
                      <span className="font-code-block text-[11px] text-outline">{item.updated}</span>
                    </div>
                  </div>

                  {/* Footer Metadata */}
                  <div className="flex items-center gap-space-md mt-space-sm pt-space-xs font-label-sm text-label-sm text-outline">
                    {item.author && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">engineering</span>
                        {item.author}
                      </span>
                    )}
                    {item.rev && (
                      <>
                        <span className="text-outline-variant">•</span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">commit</span>
                          {item.rev}
                        </span>
                      </>
                    )}
                    {item.readTime && (
                      <>
                        <span className="text-outline-variant">•</span>
                        <span className="text-on-surface-variant">{item.readTime}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Telemetry & Keyboard Navigation Guidance Footer */}
        <div className="mt-space-xl pt-space-md pb-space-lg flex items-center justify-between font-label-sm text-label-sm text-outline">
          <div className="flex items-center gap-space-md">
            <span className="flex items-center gap-1">
              <kbd className="font-code-block text-[10px] px-1 py-0.5 rounded bg-surface-container-high text-on-surface">
                ↑
              </kbd>
              <kbd className="font-code-block text-[10px] px-1 py-0.5 rounded bg-surface-container-high text-on-surface">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="text-outline-variant">/</span>
            <span className="flex items-center gap-1">
              <kbd className="font-code-block text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface">
                ↵
              </kbd>
              <span>to select</span>
            </span>
            <span className="text-outline-variant">/</span>
            <span className="flex items-center gap-1">
              <kbd className="font-code-block text-[10px] px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface">
                esc
              </kbd>
              <span>to dismiss</span>
            </span>
            <span className="text-outline-variant">/</span>
            <span className="flex items-center gap-1">
              <kbd className="font-code-block text-[10px] px-1 py-0.5 rounded bg-surface-container-high text-on-surface">
                ⌘F
              </kbd>
              <span>to filter</span>
            </span>
          </div>

          <div className="font-code-block text-[11px] text-outline flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>Engine latency: 12ms</span>
          </div>
        </div>
      </div>
    </div>
  );
};
