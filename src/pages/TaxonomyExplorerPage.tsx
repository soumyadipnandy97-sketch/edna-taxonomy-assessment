import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Network, Search, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { EmptyState, LoadingSpinner, NotificationBanner, StatusText } from '../components/UI';
import { apiFetch } from '../lib/api';

interface TreeNode {
  name: string;
  rank: string;
  count: number;
  avgConfidence: number;
  datasets: string[];
  children: TreeNode[];
}

interface TaxonomyExplorerData {
  datasets: Array<{ id: number; datasetName: string; sampleName: string }>;
  records: Array<{
    id: number;
    datasetId: number;
    datasetName: string;
    sequenceId: string;
    kingdom: string;
    phylum: string;
    className: string;
    orderName: string;
    family: string;
    genus: string;
    species: string;
    similarityScore: number;
    confidenceScore: number;
    identificationStatus: string;
    clusterId: string | null;
  }>;
  facets: {
    kingdoms: string[];
    phyla: string[];
    classes: string[];
    genera: string[];
  };
  tree: TreeNode[];
}

function TaxonomyTreeBranch({
  node,
  depth = 0,
  onSelect,
  selectedName,
}: {
  node: TreeNode;
  depth?: number;
  onSelect: (node: TreeNode) => void;
  selectedName: string;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedName === `${node.rank}:${node.name}`;

  return (
    <div className={depth > 0 ? 'ml-4 pl-3 border-l border-slate-200 dark:border-[#1B3A63]' : ''}>
      <div
        className={`flex items-center justify-between gap-2 py-1.5 px-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326]'
            : 'hover:bg-slate-100 dark:hover:bg-[#102B4F] text-slate-700 dark:text-slate-200'
        }`}
        onClick={() => {
          onSelect(node);
          if (hasChildren) setExpanded((v) => !v);
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
            )
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <span
            className={`text-[10px] font-mono uppercase tracking-wider shrink-0 ${
              isSelected ? 'opacity-80' : 'text-slate-400'
            }`}
          >
            {node.rank}
          </span>
          <span
            className={`truncate font-medium ${
              node.rank === 'Species' || node.rank === 'Genus' ? 'italic' : ''
            }`}
          >
            {node.name}
          </span>
        </div>
        <span
          className={`font-mono tabular-nums shrink-0 ${
            isSelected ? 'opacity-90' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          {node.count} reads · {node.avgConfidence}%
        </span>
      </div>

      {hasChildren && expanded && (
        <div className="mt-1 space-y-0.5">
          {node.children.map((child) => (
            <TaxonomyTreeBranch
              key={`${child.rank}-${child.name}`}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selectedName={selectedName}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaxonomyExplorerPage() {
  const [data, setData] = useState<TaxonomyExplorerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [datasetId, setDatasetId] = useState('');
  const [search, setSearch] = useState('');
  const [kingdom, setKingdom] = useState('');
  const [phylum, setPhylum] = useState('');
  const [className, setClassName] = useState('');
  const [genus, setGenus] = useState('');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (datasetId) params.set('datasetId', datasetId);
    if (search.trim()) params.set('search', search.trim());
    if (kingdom) params.set('kingdom', kingdom);
    if (phylum) params.set('phylum', phylum);
    if (className) params.set('className', className);
    if (genus) params.set('genus', genus);

    let active = true;
    setLoading(true);
    apiFetch<TaxonomyExplorerData>(`/api/taxonomy/explorer?${params.toString()}`)
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load taxonomy.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [datasetId, search, kingdom, phylum, className, genus]);

  const resetFilters = () => {
    setDatasetId('');
    setSearch('');
    setKingdom('');
    setPhylum('');
    setClassName('');
    setGenus('');
    setSelectedNode(null);
  };

  return (
    <DashboardLayout
      title="Taxonomy Explorer"
      subtitle="Navigate hierarchical Kingdom-to-Species lineages, filter taxonomic clades, and inspect sequence confidence across your datasets."
    >
      {error && <NotificationBanner type="error" message={error} />}

      {!loading && data && data.datasets.length === 0 ? (
        <EmptyState
          icon={<Network className="h-6 w-6" />}
          title="No taxonomic lineages available yet"
          description="Upload and analyze an eDNA dataset to explore interactive Kingdom-to-Species taxonomic trees and sequence matches."
          action={
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Dataset</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search species, genus, phylum, sequence ID..."
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white"
              />
            </div>

            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-800 dark:text-slate-100"
            >
              <option value="">All Datasets</option>
              {data?.datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.datasetName}
                </option>
              ))}
            </select>

            <select
              value={kingdom}
              onChange={(e) => setKingdom(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-800 dark:text-slate-100"
            >
              <option value="">All Kingdoms</option>
              {data?.facets.kingdoms.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>

            <select
              value={phylum}
              onChange={(e) => setPhylum(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-800 dark:text-slate-100"
            >
              <option value="">All Phyla</option>
              {data?.facets.phyla.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <select
                value={genus}
                onChange={(e) => setGenus(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg text-xs bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-800 dark:text-slate-100"
              >
                <option value="">All Genera</option>
                {data?.facets.genera.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-2 rounded-lg text-xs border border-slate-300 dark:border-[#1B3A63] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#133058]"
              >
                Reset
              </button>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner label="Constructing taxonomic hierarchy tree..." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive Hierarchy Tree */}
              <section className="lg:col-span-6 bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-[#1B3A63]">
                  <h2 className="text-sm font-semibold text-[#071B35] dark:text-white">
                    Hierarchical Taxonomy Tree
                  </h2>
                  <span className="text-xs font-mono text-slate-500">
                    {data?.records.length || 0} matching sequences
                  </span>
                </div>
                {data && data.tree.length > 0 ? (
                  <div className="space-y-1 max-h-[540px] overflow-y-auto pr-1">
                    {data.tree.map((node) => (
                      <TaxonomyTreeBranch
                        key={`${node.rank}-${node.name}`}
                        node={node}
                        onSelect={setSelectedNode}
                        selectedName={
                          selectedNode ? `${selectedNode.rank}:${selectedNode.name}` : ''
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No taxonomic branches match the active filters.
                  </p>
                )}
              </section>

              {/* Node Detail & Sequence Matches */}
              <section className="lg:col-span-6 space-y-4">
                {selectedNode && (
                  <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono uppercase text-[#0A4C7A] dark:text-[#21D4FD]">
                        {selectedNode.rank}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500">
                        Mean Confidence: {selectedNode.avgConfidence}%
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-[#071B35] dark:text-white">
                      {selectedNode.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Detected reads: <strong className="font-mono">{selectedNode.count}</strong> ·
                      Associated datasets: {selectedNode.datasets.join(', ')}
                    </p>
                  </div>
                )}

                <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-200 dark:border-[#1B3A63] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                      Matched Sequences
                    </h3>
                    {className && (
                      <button
                        type="button"
                        onClick={() => setClassName('')}
                        className="text-xs text-cyan-600 hover:underline"
                      >
                        Clear class filter
                      </button>
                    )}
                  </div>
                  <div className="overflow-x-auto max-h-[430px]">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-slate-500 bg-slate-50/70 dark:bg-[#071B35]/60">
                          <th className="py-2.5 px-4">Sequence / Dataset</th>
                          <th className="py-2.5 px-3">Organism</th>
                          <th className="py-2.5 px-3 text-right">Conf.</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63]">
                        {(data?.records || []).slice(0, 100).map((r) => (
                          <tr key={r.id}>
                            <td className="py-2.5 px-4">
                              <div className="font-mono font-medium text-[#071B35] dark:text-white">
                                {r.sequenceId}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate max-w-[160px]">
                                {r.datasetName}
                              </div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="italic font-medium text-slate-800 dark:text-slate-100">
                                {r.species !== 'Unclassified'
                                  ? r.species
                                  : r.genus !== 'Unclassified'
                                    ? `${r.genus} sp.`
                                    : r.clusterId || 'Unclassified'}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {r.kingdom} · {r.phylum}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                              {r.confidenceScore.toFixed(1)}%
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusText status={r.identificationStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
