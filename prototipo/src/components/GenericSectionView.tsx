import React from 'react';
import { ViewPath } from '../types';

interface GenericSectionViewProps {
  path: ViewPath;
  onNavigate: (path: ViewPath) => void;
}

export const GenericSectionView: React.FC<GenericSectionViewProps> = ({ path, onNavigate }) => {
  const getMetadata = () => {
    switch (path) {
      case 'helix-platform':
        return {
          title: 'Helix Platform',
          badge: 'v3.8.1',
          subtitle: 'Customer integration gateway, real-time webhooks, and multi-tenant telemetry mesh.',
          team: 'Integration Engineering',
          docs: [
            { title: 'Helix Core Gateway Architecture', tag: 'Architecture', time: '1d ago' },
            { title: 'Webhook Idempotency & Retry Backoff', tag: 'ADR', time: '3d ago' },
            { title: 'PostgreSQL Connection Pooling Guide', tag: 'Runbook', time: '1w ago' },
          ],
        };
      case 'orion-mobile':
        return {
          title: 'Orion Mobile',
          badge: 'v1.12.0',
          subtitle: 'React Native enterprise field client with offline synchronization and biometrics.',
          team: 'Client Engineering',
          docs: [
            { title: 'Offline-First SQLite Cache Replication', tag: 'Architecture', time: '2d ago' },
            { title: 'FCM Notification Payload Schema', tag: 'APIs', time: '5d ago' },
            { title: 'iOS App Store & TestFlight Release Pipeline', tag: 'Runbook', time: '2w ago' },
          ],
        };
      case 'engineering':
        return {
          title: 'Engineering Core',
          badge: 'Standards',
          subtitle: 'Global technical standards, code quality frameworks, CI/CD runners, and security baseline.',
          team: 'Platform Architecture Council',
          docs: [
            { title: 'Backend TypeScript & Node.js Coding Standards', tag: 'Standard', time: '3d ago' },
            { title: 'Kubernetes Production Readiness Checklist', tag: 'Checklist', time: 'Sep 14' },
            { title: 'Global Incident Escalation Matrix', tag: 'Policy', time: 'Aug 20' },
          ],
        };
      case 'talent':
        return {
          title: 'Talent & Developer Experience',
          badge: 'Internal',
          subtitle: 'New hire onboarding workflows, career frameworks, and engineering tooling guides.',
          team: 'People Operations & DevRel',
          docs: [
            { title: 'New Developer Day-1 Workstation Setup', tag: 'Onboarding', time: 'Sep 10' },
            { title: 'Engineering Levels & Performance Framework', tag: 'Career', time: 'Jul 15' },
          ],
        };
      case 'internal-processes':
        return {
          title: 'Internal Processes & RFCs',
          badge: 'Processes',
          subtitle: 'RFC lifecycle guidelines, architectural sign-off requirements, and compliance policies.',
          team: 'Architecture Council',
          docs: [
            { title: 'RFC Submission and Review Workflow', tag: 'Standard', time: 'Aug 04' },
            { title: 'SOC2 Compliance & Secret Auditing Protocols', tag: 'Compliance', time: 'Jul 22' },
          ],
        };
      case 'settings':
        return {
          title: 'Data Hub Settings',
          badge: 'Preferences',
          subtitle: 'Configure local workspace preferences, shortcuts, and synchronization status.',
          team: 'Local Client',
          docs: [
            { title: 'Telemetry Cache & Offline Sync Parameters', tag: 'Config', time: 'Active' },
            { title: 'Theme & Typography Density Controls', tag: 'Display', time: 'Active' },
          ],
        };
      default:
        return {
          title: 'Knowledge Mesh',
          badge: 'Index',
          subtitle: 'Unified organizational knowledge repository for Nova Labs.',
          team: 'Nova Labs Core',
          docs: [
            { title: 'Browse by Technical Domains & Systems', tag: 'Directory', time: 'Active' },
            { title: 'Recent Architecture Decision Records', tag: 'ADRs', time: 'Active' },
          ],
        };
    }
  };

  const info = getMetadata();

  return (
    <div className="max-w-[760px] mx-auto px-space-md py-space-xl">
      <div className="flex flex-col w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline pb-space-sm">
          <button onClick={() => onNavigate('home')} className="hover:text-on-surface transition-colors">
            Data Hub
          </button>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-medium">{info.title}</span>
        </div>

        {/* Header */}
        <header className="flex flex-col gap-space-sm pb-space-lg">
          <div className="flex items-baseline justify-between gap-space-md">
            <h1 className="font-display text-display text-on-surface tracking-tight">{info.title}</h1>
            <span className="font-code-block text-[12px] text-primary px-2 py-0.5 rounded bg-surface-container">
              {info.badge}
            </span>
          </div>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">{info.subtitle}</p>
          <div className="flex items-center gap-2 text-outline font-label-sm text-label-sm">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>{info.team}</span>
            <span>·</span>
            <span>Synchronized</span>
          </div>
        </header>

        {/* Documents */}
        <section className="space-y-space-sm mt-space-md">
          <div className="flex items-center justify-between py-1">
            <h2 className="font-label-sm text-label-sm uppercase tracking-widest text-outline">
              Related Documents
            </h2>
            <span className="font-code-block text-[11px] text-outline">{info.docs.length} items</span>
          </div>

          <div className="space-y-1">
            {info.docs.map((doc, i) => (
              <div
                key={i}
                onClick={() => onNavigate('atlas-architecture')}
                className="p-space-sm rounded bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-on-surface">{doc.title}</span>
                    <span className="px-1.5 py-0.2 rounded bg-surface-container font-label-sm text-[10px] text-outline">
                      {doc.tag}
                    </span>
                  </div>
                </div>
                <span className="font-label-sm text-label-sm text-outline shrink-0">{doc.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Quick return button */}
        <div className="mt-space-xl pt-space-lg flex gap-3">
          <button
            onClick={() => onNavigate('projects-atlas-erp')}
            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
          >
            Go to Atlas ERP
          </button>
          <button
            onClick={() => onNavigate('search')}
            className="px-3 py-1.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
          >
            Search Everything
          </button>
        </div>
      </div>
    </div>
  );
};
