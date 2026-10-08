import React from 'react';
import { ViewPath } from '../types';

interface DocumentReaderViewProps {
  onNavigate: (path: ViewPath) => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenShare: () => void;
  onCopyLink: (text: string) => void;
}

export const DocumentReaderView: React.FC<DocumentReaderViewProps> = ({
  onNavigate,
  isFavorite,
  onToggleFavorite,
  onOpenShare,
  onCopyLink,
}) => {
  const [propertiesOpen, setPropertiesOpen] = React.useState(false);
  const [copiedCode, setCopiedCode] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState('overview');
  const [isEditing, setIsEditing] = React.useState(false);
  const [docSummary, setDocSummary] = React.useState(
    'This document details the production Kubernetes topology, ingress configuration, container orchestration, and automated canary deployment pipelines across Azure East US and West Europe clusters.'
  );

  const k8sCode = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: atlas-core-service
  namespace: production
  labels:
    app.kubernetes.io/name: atlas-core
    app.kubernetes.io/part-of: atlas-erp
spec:
  replicas: 6
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: atlas-server
        image: novalabs.azurecr.io/atlas-core:v2.14.0@sha256:7f08b2...
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        readinessProbe:
          httpGet:
            path: /healthz/ready
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5`;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(k8sCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-space-md py-space-xl">
      <div className="flex flex-col w-full">
        <div className="relative w-full flex justify-center">
          {/* Primary Reading Column */}
          <article className="w-full max-w-[760px] pb-32">
            {/* Overline / Context Hierarchy */}
            <nav className="flex items-center gap-space-xs font-label-sm text-label-sm text-outline pb-space-sm">
              <button
                onClick={() => onNavigate('home')}
                className="hover:text-on-surface cursor-pointer transition-colors"
              >
                Projects
              </button>
              <span className="text-outline-variant">/</span>
              <button
                onClick={() => onNavigate('projects-atlas-erp')}
                className="hover:text-on-surface cursor-pointer transition-colors"
              >
                Atlas ERP
              </button>
              <span className="text-outline-variant">/</span>
              <button
                onClick={() => onNavigate('projects-atlas-erp')}
                className="hover:text-on-surface cursor-pointer transition-colors"
              >
                Architecture
              </button>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface font-medium">Production Deployment</span>
            </nav>

            {/* Document Title Header */}
            <header className="pt-space-xs pb-space-md">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight leading-tight">
                Production Deployment Architecture
              </h1>

              {/* Metadata Row */}
              <div className="mt-space-sm flex flex-wrap items-center gap-x-space-md gap-y-space-xs font-label-sm text-label-sm text-outline">
                <div className="flex items-center gap-space-xs">
                  <span className="text-on-surface-variant font-medium">Atlas ERP</span>
                  <span>·</span>
                  <span>Architecture</span>
                </div>

                {/* Status Indicator Pill */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  <span className="font-label-sm text-label-sm text-on-surface">Approved</span>
                </div>

                <div className="flex items-center gap-space-xs">
                  <span>Updated Sep 21</span>
                  <span>·</span>
                  <span>6 min read</span>
                </div>

                <span className="font-code-block text-[11px] text-outline px-1.5 py-0.5 rounded bg-surface-container">
                  v2.14.0
                </span>
              </div>

              {/* Action Bar & Property Shelf */}
              <div className="mt-space-md pt-space-sm flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors font-label-sm text-label-sm ${
                      isEditing
                        ? 'bg-primary text-on-primary font-medium'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {isEditing ? 'check' : 'edit'}
                    </span>
                    <span>{isEditing ? 'Save' : 'Edit'}</span>
                  </button>

                  <button
                    onClick={onToggleFavorite}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-surface-container transition-colors font-label-sm text-label-sm ${
                      isFavorite ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined text-[15px]"
                      style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      star
                    </span>
                    <span>Favorite</span>
                  </button>

                  <button
                    onClick={onOpenShare}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors font-label-sm text-label-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[15px]">share</span>
                    <span>Share</span>
                  </button>

                  <button
                    onClick={() => onCopyLink(window.location.href)}
                    className="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
                    title="Copy Link"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">link</span>
                  </button>
                </div>

                <button
                  onClick={() => setPropertiesOpen(!propertiesOpen)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-container text-outline hover:text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
                  id="togglePropertiesBtn"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">tune</span>
                  <span>Properties</span>
                  <span
                    className={`material-symbols-outlined text-[14px] transition-transform ${
                      propertiesOpen ? 'rotate-180' : ''
                    }`}
                  >
                    expand_more
                  </span>
                </button>
              </div>

              {/* Collapsible Properties Panel */}
              {propertiesOpen && (
                <div className="mt-space-sm p-space-md rounded bg-surface-container-low space-y-space-sm font-label-sm text-label-sm transition-all">
                  <div className="grid grid-cols-4 gap-2 text-outline">
                    <span>Primary Owner</span>
                    <span className="col-span-3 text-on-surface font-medium flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[10px]">
                        A
                      </span>
                      Alex Rivera &lt;arivera@novalabs.internal&gt;
                    </span>

                    <span>Reviewers</span>
                    <span className="col-span-3 text-on-surface">Platform SRE Core, Security Engineering</span>

                    <span>Impact Surface</span>
                    <span className="col-span-3 text-on-surface">Production Infrastructure (US-East-1, EU-West-1)</span>

                    <span>Classification</span>
                    <span className="col-span-3 text-on-surface">Internal Architecture Specification (Tier 1)</span>
                  </div>
                </div>
              )}
            </header>

            {/* Section: Overview */}
            <section className="mt-space-lg" id="overview">
              {isEditing ? (
                <div className="space-y-2">
                  <label className="text-label-sm text-outline">Edit Document Summary</label>
                  <textarea
                    value={docSummary}
                    onChange={(e) => setDocSummary(e.target.value)}
                    className="w-full p-2 rounded bg-surface-container border border-outline-variant/50 text-body-md text-on-surface focus:outline-none focus:border-primary"
                    rows={3}
                  />
                </div>
              ) : (
                <p className="font-body-lg text-body-lg text-on-surface leading-relaxed text-balance">
                  {docSummary}
                </p>
              )}
            </section>

            {/* Section: Architecture Topology */}
            <section className="mt-space-xl" id="architecture">
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-sm flex items-center gap-space-xs">
                <span>Architecture Topology</span>
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">
                Traffic enters via geo-distributed Anycast edges before terminating through hardened regional ingress gateways directly linked to managed service instances.
              </p>

              {/* Technical Schematic Diagram */}
              <div className="w-full p-space-md rounded-xl bg-surface-container-lowest relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between pb-space-sm mb-space-sm">
                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-outline">
                    Topology Schematic :: US-East &amp; EU-West Mirror
                  </span>
                  <span className="font-code-block text-[11px] text-outline">mTLS 1.3 Strict</span>
                </div>

                {/* Flow Diagram Visual Nodes */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-space-xs py-space-xs">
                  {/* Step 1: Edge */}
                  <div className="flex flex-col justify-between p-space-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-outline mb-space-xs">
                        <span className="font-code-block text-[10px]">INGRESS_01</span>
                        <span className="material-symbols-outlined text-[15px] text-tertiary">cloud_done</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Client Edge</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Cloudflare Magic WAN &amp; DDoS Ingress
                      </p>
                    </div>
                    <div className="mt-space-md pt-space-xs font-code-block text-[10px] text-outline">
                      Geo-routed Anycast
                    </div>
                  </div>

                  {/* Step 2: Regional Gateways */}
                  <div className="flex flex-col justify-between p-space-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-outline mb-space-xs">
                        <span className="font-code-block text-[10px]">GATEWAY_02</span>
                        <span className="material-symbols-outlined text-[15px] text-primary">lan</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Azure App GW</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        WAF v2, SSL Offload, Path routing
                      </p>
                    </div>
                    <div className="mt-space-md pt-space-xs font-code-block text-[10px] text-outline">
                      Multi-AZ Redundant
                    </div>
                  </div>

                  {/* Step 3: Cluster Services */}
                  <div className="flex flex-col justify-between p-space-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-outline mb-space-xs">
                        <span className="font-code-block text-[10px]">COMPUTE_03</span>
                        <span className="material-symbols-outlined text-[15px] text-secondary">grid_view</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">AKS Cluster</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        Cilium Ingress &amp; Core Service Pods
                      </p>
                    </div>
                    <div className="mt-space-md pt-space-xs font-code-block text-[10px] text-outline">
                      v1.29 Node Pools
                    </div>
                  </div>

                  {/* Step 4: Storage & Persistence */}
                  <div className="flex flex-col justify-between p-space-sm rounded bg-surface-container hover:bg-surface-container-high transition-colors">
                    <div>
                      <div className="flex items-center justify-between text-outline mb-space-xs">
                        <span className="font-code-block text-[10px]">DATA_04</span>
                        <span className="material-symbols-outlined text-[15px] text-tertiary">database</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">Data Store</h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        MySQL Flexible + Azure Cache Redis
                      </p>
                    </div>
                    <div className="mt-space-md pt-space-xs font-code-block text-[10px] text-outline">
                      Private Endpoint Link
                    </div>
                  </div>
                </div>

                {/* Flow Summary Indicators */}
                <div className="mt-space-sm pt-space-sm flex items-center justify-between font-label-sm text-[11px] text-outline">
                  <div className="flex items-center gap-space-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                      <span>Cluster Health: Optimal</span>
                    </span>
                    <span>·</span>
                    <span>Regional Latency: 14ms (p95)</span>
                  </div>
                  <span className="font-code-block">East US [Primary] / West Europe [Failover]</span>
                </div>
              </div>
            </section>

            {/* Section: Deployment Flow */}
            <section className="mt-space-xl" id="deployment-flow">
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-sm">
                Deployment Flow
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">
                Our zero-downtime canary deployment utilizes automated release gates with automated rollbacks verified by Prometheus anomaly metrics.
              </p>

              <div className="space-y-space-sm">
                {/* Step 1 */}
                <div className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-start gap-space-md">
                  <span className="font-code-block text-[12px] px-2 py-1 rounded bg-surface-container-highest text-primary font-semibold shrink-0">
                    STEP 01
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Container Verification &amp; Signing
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Automated CI build &amp; container image signing via Cosign. Ephemeral supply-chain provenance attestations are bundled directly with the digest index.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-start gap-space-md">
                  <span className="font-code-block text-[12px] px-2 py-1 rounded bg-surface-container-highest text-primary font-semibold shrink-0">
                    STEP 02
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Static Linting &amp; Smoke Validation
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Helm chart validation and staging environment smoke test. Enforces OPA Gatekeeper constraint checks against production security benchmarks.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-start gap-space-md">
                  <span className="font-code-block text-[12px] px-2 py-1 rounded bg-surface-container-highest text-primary font-semibold shrink-0">
                    STEP 03
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Targeted Canary Partitioning
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Canary deployment to 10% traffic with Prometheus error-rate monitoring. Ingress splits synthetic probes and live customer read traffic.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="p-space-md rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-start gap-space-md">
                  <span className="font-code-block text-[12px] px-2 py-1 rounded bg-surface-container-highest text-primary font-semibold shrink-0">
                    STEP 04
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Progressive Saturation
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Automated progressive rollout to 100% over 20 minutes with zero dropped TCP connections or state desynchronization.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Infrastructure & Configuration */}
            <section className="mt-space-xl" id="infrastructure">
              <div className="flex items-center justify-between mb-space-sm">
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight">
                  Infrastructure &amp; Configuration
                </h2>
                <span className="font-code-block text-[11px] text-outline">k8s/apps/v1/deployment.yaml</span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">
                Base deployment descriptor defining probe parameters, memory-backed volume mounts, and strict resource thresholds.
              </p>

              {/* Code Block Container */}
              <div className="rounded-xl overflow-hidden bg-surface-container-lowest">
                <div className="flex items-center justify-between px-space-md py-space-xs bg-surface-container-high/60">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
                    <span className="ml-2 font-code-block text-[11px] text-outline">
                      atlas-core-service-deployment.yaml
                    </span>
                  </div>

                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 font-label-sm text-label-sm text-outline hover:text-on-surface px-2 py-1 rounded hover:bg-surface-container transition-colors cursor-pointer"
                    id="copyCodeBtn"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedCode ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedCode ? 'Copied!' : 'Copy snippet'}</span>
                  </button>
                </div>

                <pre className="p-space-md overflow-x-auto font-code-block text-code-block text-on-surface leading-relaxed">
                  <code>
                    <span className="text-outline">apiVersion:</span> <span className="text-primary">apps/v1</span>{'\n'}
                    <span className="text-outline">kind:</span> <span className="text-primary">Deployment</span>{'\n'}
                    <span className="text-outline">metadata:</span>{'\n'}
                    {'  '}<span className="text-outline">name:</span> <span className="text-on-surface">atlas-core-service</span>{'\n'}
                    {'  '}<span className="text-outline">namespace:</span> <span className="text-on-surface">production</span>{'\n'}
                    {'  '}<span className="text-outline">labels:</span>{'\n'}
                    {'    '}<span className="text-outline">app.kubernetes.io/name:</span> <span className="text-on-surface">atlas-core</span>{'\n'}
                    {'    '}<span className="text-outline">app.kubernetes.io/part-of:</span> <span className="text-on-surface">atlas-erp</span>{'\n'}
                    <span className="text-outline">spec:</span>{'\n'}
                    {'  '}<span className="text-outline">replicas:</span> <span className="text-tertiary">6</span>{'\n'}
                    {'  '}<span className="text-outline">strategy:</span>{'\n'}
                    {'    '}<span className="text-outline">type:</span> <span className="text-on-surface">RollingUpdate</span>{'\n'}
                    {'    '}<span className="text-outline">rollingUpdate:</span>{'\n'}
                    {'      '}<span className="text-outline">maxSurge:</span> <span className="text-tertiary">25%</span>{'\n'}
                    {'      '}<span className="text-outline">maxUnavailable:</span> <span className="text-tertiary">0</span>{'\n'}
                    {'  '}<span className="text-outline">template:</span>{'\n'}
                    {'    '}<span className="text-outline">spec:</span>{'\n'}
                    {'      '}<span className="text-outline">containers:</span>{'\n'}
                    {'      '}- <span className="text-outline">name:</span> <span className="text-on-surface">atlas-server</span>{'\n'}
                    {'        '}<span className="text-outline">image:</span> <span className="text-on-surface">novalabs.azurecr.io/atlas-core:v2.14.0@sha256:7f08b2...</span>{'\n'}
                    {'        '}<span className="text-outline">resources:</span>{'\n'}
                    {'          '}<span className="text-outline">requests:</span>{'\n'}
                    {'            '}<span className="text-outline">cpu:</span> <span className="text-tertiary">500m</span>{'\n'}
                    {'            '}<span className="text-outline">memory:</span> <span className="text-tertiary">1Gi</span>{'\n'}
                    {'          '}<span className="text-outline">limits:</span>{'\n'}
                    {'            '}<span className="text-outline">cpu:</span> <span className="text-tertiary">2000m</span>{'\n'}
                    {'            '}<span className="text-outline">memory:</span> <span className="text-tertiary">4Gi</span>{'\n'}
                    {'        '}<span className="text-outline">readinessProbe:</span>{'\n'}
                    {'          '}<span className="text-outline">httpGet:</span>{'\n'}
                    {'            '}<span className="text-outline">path:</span> <span className="text-on-surface">/healthz/ready</span>{'\n'}
                    {'            '}<span className="text-outline">port:</span> <span className="text-tertiary">8080</span>{'\n'}
                    {'          '}<span className="text-outline">initialDelaySeconds:</span> <span className="text-tertiary">10</span>{'\n'}
                    {'          '}<span className="text-outline">periodSeconds:</span> <span className="text-tertiary">5</span>
                  </code>
                </pre>
              </div>
            </section>

            {/* Section: Security Architecture */}
            <section className="mt-space-xl" id="security">
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-sm">
                Security &amp; Secret Isolation
              </h2>

              {/* Asymmetric Note Card */}
              <div className="p-space-md rounded-lg bg-surface-container-low relative overflow-hidden mb-space-md">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <p className="font-body-md text-body-md text-on-surface leading-relaxed">
                  Secrets are injected via Azure Key Vault CSI driver into memory-only volumes. Pod-to-pod communication is strictly enforced using Cilium Network Policies with mTLS.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm pt-space-xs">
                <div className="p-space-md rounded-lg bg-surface-container">
                  <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider">
                    Storage Security
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">Memory-Only Tmpfs</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                    Cryptographic keys and JWT signing salts never touch underlying virtual node disk blocks, expiring immediately on pod termination.
                  </p>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container">
                  <span className="font-label-sm text-[11px] text-outline uppercase tracking-wider">
                    Network Boundary
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mt-1">eBPF-Driven WireGuard</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
                    Cilium delivers in-kernel payload encryption with sub-millisecond cryptographic handshake overhead between node pools.
                  </p>
                </div>
              </div>
            </section>

            {/* Section: Operational Considerations */}
            <section className="mt-space-xl" id="operational-considerations">
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-sm">
                Operational Considerations
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed mb-space-md">
                HPA is configured with minimum 6 pods, targeting 70% CPU and 65% memory utilization. Cluster autoscaler spans across 3 availability zones.
              </p>

              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-sm mb-space-md">
                <div className="p-space-md rounded-lg bg-surface-container">
                  <span className="font-label-sm text-label-sm text-outline">Autoscaling Envelope</span>
                  <div className="font-display text-display text-on-surface mt-1">6 – 48</div>
                  <span className="font-body-sm text-body-sm text-outline">Targeting 70% CPU / 65% Mem</span>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container">
                  <span className="font-label-sm text-label-sm text-outline">Zone Redundancy</span>
                  <div className="font-display text-display text-on-surface mt-1">3 AZs</div>
                  <span className="font-body-sm text-body-sm text-outline">Active-active failover mesh</span>
                </div>

                <div className="p-space-md rounded-lg bg-surface-container">
                  <span className="font-label-sm text-label-sm text-outline">Drain Grace Window</span>
                  <div className="font-display text-display text-on-surface mt-1">90s</div>
                  <span className="font-body-sm text-body-sm text-outline">SIGTERM keep-alive drain</span>
                </div>
              </div>
            </section>

            {/* Section: Related Documentation */}
            <section className="mt-space-xl pt-space-md" id="related-documentation">
              <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-space-sm">
                Related Documentation
              </h2>

              <div className="grid grid-cols-1 gap-space-xs">
                <div
                  onClick={() => onNavigate('atlas-adrs')}
                  className="group p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                      description
                    </span>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">
                        ADR-014: Event-Driven Notification Architecture
                      </span>
                      <p className="font-body-sm text-[12px] text-outline">
                        Decoupled pub/sub event schemas and Kafka cluster topology
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface transition-colors">
                    arrow_forward
                  </span>
                </div>

                <div
                  onClick={() => onNavigate('atlas-runbooks')}
                  className="group p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                      quickref
                    </span>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">
                        Production Incident Recovery Runbook
                      </span>
                      <p className="font-body-sm text-[12px] text-outline">
                        Severity-1 triage playbooks, telemetry dashboards, and on-call escalation
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface transition-colors">
                    arrow_forward
                  </span>
                </div>

                <div
                  onClick={() => onNavigate('atlas-runbooks')}
                  className="group p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-primary transition-colors">
                      swap_horiz
                    </span>
                    <div>
                      <span className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors">
                        Database Failover Procedure
                      </span>
                      <p className="font-body-sm text-[12px] text-outline">
                        Replication switchover mechanics for Azure MySQL flexible servers
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-on-surface transition-colors">
                    arrow_forward
                  </span>
                </div>
              </div>
            </section>

            {/* Document Footer Meta */}
            <footer className="mt-space-xl pt-space-lg flex items-center justify-between text-outline font-label-sm text-label-sm">
              <div className="flex items-center gap-space-xs">
                <span>Authored by SRE Core Engineering</span>
                <span>·</span>
                <span>
                  Commit SHA: <code className="font-code-block text-[11px] text-on-surface">d98bf14</code>
                </span>
              </div>
              <button
                onClick={() => alert('Viewing revision history for d98bf14')}
                className="hover:text-on-surface transition-colors flex items-center gap-1"
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">history</span>
                <span>Version History</span>
              </button>
            </footer>
          </article>

          {/* Right Rail: Table of Contents */}
          <aside className="hidden xl:block w-[200px] shrink-0 pl-space-lg">
            <div className="sticky top-20 select-none space-y-space-md">
              <div>
                <h4 className="font-label-sm text-[11px] uppercase tracking-wider text-outline mb-space-sm font-semibold">
                  On This Page
                </h4>
                <nav className="space-y-[4px]" id="tocNav">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'architecture', label: 'Architecture' },
                    { id: 'deployment-flow', label: 'Deployment Flow' },
                    { id: 'infrastructure', label: 'Infrastructure' },
                    { id: 'security', label: 'Security' },
                    { id: 'operational-considerations', label: 'Operational Specs' },
                    { id: 'related-documentation', label: 'Related Docs' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className={`block w-full text-left px-2 py-1 rounded font-label-sm text-label-sm transition-colors ${
                        activeSection === item.id
                          ? 'text-on-surface bg-surface-container font-medium'
                          : 'text-outline hover:text-on-surface hover:bg-surface-container/60'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick Document Context Box */}
              <div className="p-space-sm rounded bg-surface-container-low text-outline space-y-2">
                <div className="flex items-center justify-between text-[11px] font-label-sm">
                  <span>Branch</span>
                  <span className="font-code-block text-on-surface font-medium">main</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-label-sm">
                  <span>Cluster</span>
                  <span className="text-on-surface font-medium">aks-prod-01</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
