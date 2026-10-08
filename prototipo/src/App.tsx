import React from 'react';
import { ViewPath, TabId, AdrRecord, FavoriteItem } from './types';
import { INITIAL_ADRS, INITIAL_RUNBOOKS, SEARCH_INDEX, INITIAL_FAVORITES } from './data/mockData';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { HomeView } from './components/HomeView';
import { AtlasErpView } from './components/AtlasErpView';
import { DocumentReaderView } from './components/DocumentReaderView';
import { SearchView } from './components/SearchView';
import { GenericSectionView } from './components/GenericSectionView';
import { DraftAdrModal } from './components/DraftAdrModal';
import { ShareModal } from './components/ShareModal';
import { Toast } from './components/Toast';

export default function App() {
  const [currentPath, setCurrentPath] = React.useState<ViewPath>('projects-atlas-erp');
  const [activeTab, setActiveTab] = React.useState<TabId>('overview');
  const [adrs, setAdrs] = React.useState<AdrRecord[]>(INITIAL_ADRS);
  const [runbooks] = React.useState(INITIAL_RUNBOOKS);
  const [searchIndex, setSearchIndex] = React.useState(SEARCH_INDEX);
  const [favorites, setFavorites] = React.useState<FavoriteItem[]>(INITIAL_FAVORITES);

  // Modals & UI states
  const [isDraftAdrOpen, setIsDraftAdrOpen] = React.useState(false);
  const [isShareOpen, setIsShareOpen] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [themeMode, setThemeMode] = React.useState<'dark' | 'contrast'>('dark');

  // Check if current document/screen is favorited
  const isCurrentFavorited = React.useMemo(() => {
    return favorites.some((fav) => fav.path === currentPath);
  }, [favorites, currentPath]);

  const handleToggleFavoriteCurrent = () => {
    if (isCurrentFavorited) {
      setFavorites((prev) => prev.filter((f) => f.path !== currentPath));
      setToastMessage('Removed from favorites');
    } else {
      let title = 'Atlas ERP Architecture';
      let sub = 'atlas/arch';
      if (currentPath === 'atlas-architecture') {
        title = 'Production Deployment Architecture';
        sub = 'atlas/arch';
      } else if (currentPath === 'home') {
        title = 'Home Dashboard';
        sub = 'hub/home';
      } else if (currentPath === 'search') {
        title = 'Global Query Search';
        sub = 'hub/search';
      }
      setFavorites((prev) => [...prev, { id: `fav-${Date.now()}`, title, path: currentPath, sub }]);
      setToastMessage('Added to favorites');
    }
  };

  const handleToggleFavoriteItem = (title: string, path: ViewPath) => {
    const existing = favorites.find((f) => f.path === path || f.title === title);
    if (existing) {
      setFavorites((prev) => prev.filter((f) => f.id !== existing.id));
      setToastMessage(`Removed "${title}" from favorites`);
    } else {
      setFavorites((prev) => [
        ...prev,
        { id: `fav-${Date.now()}`, title, path, sub: 'atlas/docs' },
      ]);
      setToastMessage(`Added "${title}" to favorites`);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard?.writeText(url);
    setToastMessage('Document link copied to clipboard');
  };

  const handleCreateAdr = (newAdr: AdrRecord) => {
    setAdrs((prev) => [newAdr, ...prev]);
    // Also index it into search
    setSearchIndex((prev) => [
      {
        id: `search-${Date.now()}`,
        path: 'atlas-adrs',
        title: `${newAdr.code} — ${newAdr.title}`,
        project: 'Atlas ERP',
        section: 'ADRs',
        excerpt: `Architecture decision record concerning ${newAdr.title}. Status: ${newAdr.status}.`,
        updated: 'Just now',
        status: newAdr.status,
        author: newAdr.owner,
        rev: newAdr.mergedOrPr,
      },
      ...prev,
    ]);
    setToastMessage(`${newAdr.code} drafted successfully`);
  };

  // Global Keyboard shortcuts: ⌘K or Ctrl+K for search
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCurrentPath('search');
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleNavigate = (path: ViewPath) => {
    setCurrentPath(path);
    // synchronize active tab if navigating to specific atlas sub-views
    if (path === 'atlas-adrs') setActiveTab('adrs');
    else if (path === 'atlas-apis') setActiveTab('apis');
    else if (path === 'atlas-runbooks') setActiveTab('runbooks');
    else if (path === 'atlas-architecture') setActiveTab('architecture');
    else if (path === 'projects-atlas-erp') setActiveTab('overview');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className={`min-h-screen ${themeMode === 'contrast' ? 'contrast-125' : ''}`}>
      {/* Fixed Left Sidebar */}
      <Sidebar
        currentPath={currentPath}
        onNavigate={handleNavigate}
        favoritesCount={favorites.length}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode(themeMode === 'dark' ? 'contrast' : 'dark')}
      />

      {/* Main Canvas Area */}
      <div className="pl-[240px]">
        {/* Fixed Top Header */}
        <TopHeader
          currentPath={currentPath}
          onNavigate={handleNavigate}
          isFavorite={isCurrentFavorited}
          onToggleFavorite={handleToggleFavoriteCurrent}
          onOpenShare={() => setIsShareOpen(true)}
          onToggleContrast={() => setThemeMode(themeMode === 'dark' ? 'contrast' : 'dark')}
        />

        {/* Viewport Content */}
        <main className="pt-11 w-full bg-surface min-h-screen">
          {currentPath === 'home' && (
            <HomeView
              onNavigate={handleNavigate}
              onCopyLink={handleCopyLink}
              favorites={favorites}
              onToggleFavorite={handleToggleFavoriteItem}
            />
          )}

          {(currentPath === 'projects-atlas-erp' ||
            currentPath === 'projects' ||
            currentPath === 'atlas-adrs' ||
            currentPath === 'atlas-apis' ||
            currentPath === 'atlas-runbooks') && (
            <AtlasErpView
              onNavigate={handleNavigate}
              adrs={adrs}
              runbooks={runbooks}
              onOpenDraftAdr={() => setIsDraftAdrOpen(true)}
              activeTab={activeTab}
              onSelectTab={setActiveTab}
            />
          )}

          {currentPath === 'atlas-architecture' && (
            <DocumentReaderView
              onNavigate={handleNavigate}
              isFavorite={isCurrentFavorited}
              onToggleFavorite={handleToggleFavoriteCurrent}
              onOpenShare={() => setIsShareOpen(true)}
              onCopyLink={handleCopyLink}
            />
          )}

          {currentPath === 'search' && (
            <SearchView
              onNavigate={handleNavigate}
              searchIndex={searchIndex}
            />
          )}

          {currentPath !== 'home' &&
            currentPath !== 'projects-atlas-erp' &&
            currentPath !== 'projects' &&
            currentPath !== 'atlas-adrs' &&
            currentPath !== 'atlas-apis' &&
            currentPath !== 'atlas-runbooks' &&
            currentPath !== 'atlas-architecture' &&
            currentPath !== 'search' && (
              <GenericSectionView
                path={currentPath}
                onNavigate={handleNavigate}
              />
            )}
        </main>
      </div>

      {/* Modals & Feedback */}
      <DraftAdrModal
        isOpen={isDraftAdrOpen}
        onClose={() => setIsDraftAdrOpen(false)}
        onSubmit={handleCreateAdr}
        nextAdrNumber={adrs.length + 12}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        title={
          currentPath === 'atlas-architecture'
            ? 'Production Deployment Architecture'
            : 'Data Hub - Nova Labs'
        }
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
