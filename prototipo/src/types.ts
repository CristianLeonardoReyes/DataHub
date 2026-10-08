export type ViewPath =
  | 'home'
  | 'search'
  | 'knowledge'
  | 'projects'
  | 'favorites'
  | 'recent'
  | 'projects-atlas-erp'
  | 'atlas-architecture'
  | 'atlas-adrs'
  | 'atlas-apis'
  | 'atlas-runbooks'
  | 'helix-platform'
  | 'orion-mobile'
  | 'engineering'
  | 'internal-processes'
  | 'talent'
  | 'people'
  | 'templates'
  | 'settings';

export type TabId =
  | 'overview'
  | 'architecture'
  | 'adrs'
  | 'apis'
  | 'runbooks'
  | 'deployment'
  | 'security'
  | 'onboarding';

export interface DocItem {
  id: string;
  path: ViewPath;
  title: string;
  project: string;
  section: string;
  excerpt: string;
  updated: string;
  readTime?: string;
  status: 'Approved' | 'Needs Review' | 'Draft' | 'Deprecated';
  rev?: string;
  author?: string;
  code?: string;
  badge?: string;
  isCanonical?: boolean;
  cluster?: string;
}

export interface AdrRecord {
  id: string;
  code: string;
  title: string;
  status: 'Approved' | 'Needs Review' | 'Draft';
  owner: string;
  approvedBy?: string;
  reviewRequested?: string;
  mergedOrPr: string;
  date: string;
}

export interface RunbookRecord {
  id: string;
  title: string;
  badge?: string;
  description: string;
  date: string;
  category: string;
  verified?: boolean;
}

export interface FavoriteItem {
  id: string;
  title: string;
  path: ViewPath;
  sub: string;
}

