import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Dna, Play, Search, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  ChartCard,
  EmptyState,
  LoadingSpinner,
  MetricCard,
  NotificationBanner,
  StatusText,
} from '../components/UI';
import { apiFetch } from '../lib/api';

interface DatasetOption {
  id: number;
  datasetName: string;
  sampleName: string;
  status: string;
}

interface TaxonomyRecord {
  id: number;
  sequenceId: string;
  sequenceLength: number;
  gcContent: number | null;
  qualityScore: number | null;
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
  referenceDatabase: string;
  clusterId: string | null;
}

interface DatasetDetailResponse {
  dataset: {
    id: number;
    datasetName: string;
    sampleName: string;
    fileFormat: string;
    sampleType: string;
    collectionLocation: string;
    collectionDate: string;
    status: string;
  };
  sequenceCount: number;
  biodiversity: {
    speciesRichness: number;
    shannonIndex: number;
    simpsonIndex: number;
    simpsonDiversity: number;
    evenness: number;
    totalSequences: number;
    classifiedCount: number;
    unclassifiedCount: number;
    analysisMetadata: {
      clusterSummary?: Array<{
        clusterId: string;
        sequenceCount: number;
        avgLength: number;
        avgSimilarity: number;
        representativeSeqId: string;
        classificationNote: string;
      }>;
      lengthDistribution?: Array<{ range: string; count: number }>;
      referenceDatabase?: string;
      method?: string;
    };
  } | null;
  taxonomyResults: TaxonomyRecord[];
}

export function AnalysisPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [datasetList, setDatasetList] = useState<DatasetOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(
    searchParams.get('datasetId') ? Number(searchParams.get('datasetId')) : null
  );
  const [detail, setDetail] = useState<DatasetDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unknown'>('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    apiFetch<{ datasets: DatasetOption[] }>('/api/datasets')
      .then((res) => {
        setDatasetList(res.datasets);
        if (!selectedId && res.datasets.length > 0) {
          setSelectedId(res.datasets[0].id);
        } else if (res.datasets.length === 0) {
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to fetch datasets.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    apiFetch<DatasetDetailResponse>(`/api/datasets/${selectedId}`)
      .then((res) => setDetail(res))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load dataset analysis.')
      )
      .finally(() => setLoading(false));
  }, [selectedId]);

  const handleSelectDataset = (id: number) => {
    setSelectedId(id);
    setSearchParams({ datasetId: String(id) });
  };

  const handleRunAnalysis = async () => {
    if (!selectedId) return;
    setAnalyzing(true);
    setError('');
    setNotice('');
    try {
      await apiFetch(`/api/datasets/${selectedId}/analyze`, { method: 'POST' });
      const refreshed = await apiFetch<DatasetDetailResponse>(`/api/datasets/${selectedId}`);
      setDetail(refreshed);
      setNotice('Sequence classification and unknown OTU clustering completed.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const allRecords = detail?.taxonomyResults || [];
  const unknownRecords = allRecords.filter(
    (r) =>
      r.identificationStatus === 'Unclassified' ||
      r.identificationStatus === 'Potentially novel sequence'
  );

  const visibleRecords = (activeTab === 'unknown' ? unknownRecords : allRecords).filter((r) => {
    if (statusFilter && r.identificationStatus !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.sequenceId.toLowerCase().includes(q) ||
        r.species.toLowerCase().includes(q) ||
        r.genus.toLowerCase().includes(q) ||
        r.phylum.toLowerCase().includes(q) ||
        (r.clusterId || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const clusters = detail?.biodiversity?.analysisMetadata?.clusterSummary || [];
  const lengthDist = detail?.biodiversity?.analysisMetadata?.lengthDistribution || [];

  return (
    <DashboardLayout
      title="Taxonomic Identification & Unknown Sequence Detection"
      subtitle="Inspect sequence-level Kingdom-to-Species assignments, similarity and confidence scores, and clustered unknown or divergent sequences."
      action={
        datasetList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={selectedId || ''}
              onChange={(e) => handleSelectDataset(Number(e.target.value))}
              className="px-3.5 py-2 rounded-lg text-sm bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] text-[#071B35] dark:text-white"
            >
              {datasetList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.datasetName} ({d.sampleName})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={analyzing || !selectedId}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
            >
              <Play className="h-4 w-4" />
              <span>{analyzing ? 'Analyzing...' : 'Run Analysis'}</span>
            </button>
          </div>
        )
      }
    >
      {error && <NotificationBanner type="error" message={error} onDismiss={() => setError('')} />}
      {notice && <NotificationBanner type="success" message={notice} onDismiss={() => setNotice('')} />}

      {loading ? (
        <LoadingSpinner label="Loading sequence classifications..." />
      ) : datasetList.length === 0 ? (
        <EmptyState
          icon={<Dna className="h-6 w-6" />}
          title="No datasets available for analysis"
          description="Upload a FASTA, FASTQ, or CSV environmental DNA dataset first to run taxonomic identification and unknown sequence detection."
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
      ) : detail ? (
        <div className="space-y-6">
          {/* Reference Method Transparency Banner */}
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="font-semibold text-[#071B35] dark:text-white">
                Reference Method:
              </span>{' '}
              {detail.biodiversity?.analysisMetadata?.referenceDatabase ||
                'DeepSea Local Reference DB v1.0 (Curated Marine COI/16S/18S)'}
              {' · '}Local k-mer similarity scoring (no external NCBI BLAST call simulated)
            </div>
            <div className="font-mono text-slate-500 dark:text-slate-400">
              {detail.dataset.sampleName} · {detail.dataset.fileFormat} · {detail.dataset.sampleType}
            </div>
          </div>

          {/* Summary KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <MetricCard label="Total Sequences" value={detail.sequenceCount} />
            <MetricCard
              label="Classified Reads"
              value={detail.biodiversity?.classifiedCount ?? 0}
            />
            <MetricCard
              label="Unclassified / Divergent"
              value={detail.biodiversity?.unclassifiedCount ?? 0}
            />
            <MetricCard
              label="Novel OTU Clusters"
              value={clusters.length}
              unit="OTUs"
            />
            <MetricCard
              label="Operational Richness"
              value={detail.biodiversity?.speciesRichness ?? 0}
            />
          </div>

          {/* Interactive View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-[#0C2342] rounded-lg border border-slate-200 dark:border-[#1B3A63]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white dark:bg-[#133058] text-[#071B35] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Taxonomic Matches ({allRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('unknown')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  activeTab === 'unknown'
                    ? 'bg-white dark:bg-[#133058] text-[#071B35] dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Unknown & Divergent Sequences ({unknownRecords.length})
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter sequence, species, OTU..."
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] text-slate-900 dark:text-white"
                />
              </div>
              {activeTab === 'all' && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] text-slate-700 dark:text-slate-200"
                >
                  <option value="">All Statuses</option>
                  <option value="Identified">Identified</option>
                  <option value="Partially identified">Partially identified</option>
                  <option value="Potentially novel sequence">Potentially novel sequence</option>
                  <option value="Unclassified">Unclassified</option>
                </select>
              )}
            </div>
          </div>

          {/* Unknown Sequence Clustering Panel when Unknown tab selected */}
          {activeTab === 'unknown' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <ChartCard
                title="Unclassified & Divergent OTU Clusters"
                subtitle="Greedy 5-mer centroid clusters among reads without species-level matches. Computational divergence alone does not establish a new species."
                className="lg:col-span-7"
              >
                {clusters.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center">
                    No unclassified or potentially novel sequence clusters detected in this dataset.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {clusters.map((c) => (
                      <div
                        key={c.clusterId}
                        className="border border-slate-200 dark:border-[#1B3A63] rounded-lg p-4 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold text-[#0A4C7A] dark:text-[#21D4FD]">
                            {c.clusterId}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                            {c.sequenceCount} reads · Avg {c.avgLength} bp · Similarity {c.avgSimilarity}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {c.classificationNote}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400">
                          Representative sequence: {c.representativeSeqId}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ChartCard>

              <ChartCard
                title="Sequence Length Distribution"
                subtitle="Base-pair (bp) length distribution across all reads in the selected dataset."
                className="lg:col-span-5"
              >
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lengthDist}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                      <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#071B35',
                          borderColor: '#1B3A63',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" name="Sequences" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
          )}

          {/* Detailed Sequence-by-Sequence Taxonomy Table */}
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#071B35]/60">
                    <th className="py-3 px-4">Sequence ID</th>
                    <th className="py-3 px-3 text-right">Length</th>
                    <th className="py-3 px-4">Best Match / Organism</th>
                    <th className="py-3 px-4">Taxonomic Hierarchy (K → G)</th>
                    <th className="py-3 px-3 text-right">Similarity</th>
                    <th className="py-3 px-3 text-right">Confidence</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63]">
                  {visibleRecords.slice(0, 200).map((r) => (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#102B4F]/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-[#071B35] dark:text-white whitespace-nowrap">
                        {r.sequenceId}
                        {r.clusterId && (
                          <div className="text-[11px] text-amber-600 dark:text-amber-400">
                            {r.clusterId}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {r.sequenceLength} bp
                      </td>
                      <td className="py-3 px-4 font-medium text-[#071B35] dark:text-slate-100">
                        {r.species !== 'Unclassified' ? (
                          <span className="italic">{r.species}</span>
                        ) : r.genus !== 'Unclassified' ? (
                          <span>
                            <em className="italic">{r.genus}</em> sp.
                          </span>
                        ) : (
                          <span className="text-slate-500">Unclassified</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-md truncate">
                        {[r.kingdom, r.phylum, r.className, r.orderName, r.family, r.genus]
                          .filter((x) => x && x !== 'Unclassified')
                          .join(' → ') || 'Unclassified'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {r.similarityScore.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        {r.confidenceScore.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusText status={r.identificationStatus} />
                      </td>
                    </tr>
                  ))}
                  {visibleRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-500">
                        No sequences match the active filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
