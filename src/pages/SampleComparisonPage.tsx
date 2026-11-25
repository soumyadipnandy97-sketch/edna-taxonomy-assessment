import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GitCompare, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ChartCard, EmptyState, LoadingSpinner, NotificationBanner } from '../components/UI';
import { apiFetch } from '../lib/api';

interface DatasetChoice {
  id: number;
  datasetName: string;
  sampleName: string;
  sampleType: string;
  status: string;
}

interface ComparisonResponse {
  samples: Array<{
    id: number;
    datasetName: string;
    sampleName: string;
    sampleType: string;
    collectionLocation: string;
    totalSequences: number;
    speciesRichness: number;
    shannonIndex: number;
    simpsonDiversity: number;
    evenness: number;
  }>;
  taxaMatrix: Array<Record<string, string | number>>;
  similarityPairs: Array<{
    sampleA: string;
    sampleB: string;
    sharedTaxa: number;
    unionTaxa: number;
    jaccardIndex: number;
  }>;
}

export function SampleComparisonPage() {
  const [allDatasets, setAllDatasets] = useState<DatasetChoice[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ datasets: DatasetChoice[] }>('/api/datasets')
      .then((res) => {
        const completed = res.datasets.filter((d) => d.status === 'completed');
        setAllDatasets(completed);
        const initial = completed.slice(0, 4).map((d) => d.id);
        setSelectedIds(initial);
        if (initial.length === 0) setLoading(false);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Unable to load datasets.');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    apiFetch<ComparisonResponse>(`/api/compare?ids=${selectedIds.join(',')}`)
      .then((res) => setComparison(res))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Comparison query failed.')
      )
      .finally(() => setLoading(false));
  }, [selectedIds]);

  const toggleDataset = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((x) => x !== id)
          : prev
        : [...prev, id].slice(0, 6)
    );
  };

  return (
    <DashboardLayout
      title="Sample Comparison"
      subtitle="Compare ecological diversity indices, shared taxa relative abundance, and pairwise Jaccard community overlap across environmental samples."
    >
      {error && <NotificationBanner type="error" message={error} />}

      {!loading && allDatasets.length === 0 ? (
        <EmptyState
          icon={<GitCompare className="h-6 w-6" />}
          title="Upload datasets to compare samples"
          description="Upload and analyze two or more environmental DNA datasets (for example, North Atlantic Pelagic vs. Hydrothermal Vent Plume) to evaluate community turnover and biodiversity shifts."
          action={
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Datasets</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Sample Selector Strip */}
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-4 space-y-2.5">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Select analyzed datasets to compare (up to 6):
            </p>
            <div className="flex flex-wrap gap-2">
              {allDatasets.map((d) => {
                const active = selectedIds.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDataset(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      active
                        ? 'bg-[#071B35] text-white border-[#071B35] dark:bg-[#13B8A6] dark:text-[#061326] dark:border-[#13B8A6]'
                        : 'bg-slate-50 dark:bg-[#071B35] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1B3A63]'
                    }`}
                  >
                    {d.sampleName} · {d.datasetName}
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <LoadingSpinner label="Calculating cross-sample biodiversity matrix..." />
          ) : comparison ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <ChartCard
                  title="Diversity Metrics Across Selected Samples"
                  subtitle="Side-by-side Shannon (H'), Gini-Simpson (1 - D), and Pielou Evenness (J')."
                  className="lg:col-span-7"
                >
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparison.samples}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                        <XAxis dataKey="sampleName" tick={{ fontSize: 11, fill: '#64748b' }} />
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
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="shannonIndex" name="Shannon (H')" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="simpsonDiversity" name="Gini-Simpson (1 - D)" fill="#13B8A6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="evenness" name="Evenness (J')" fill="#21D4FD" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>

                <ChartCard
                  title="Pairwise Jaccard Community Similarity"
                  subtitle="J(A, B) = |A ∩ B| / |A ∪ B| based on shared detected taxa."
                  className="lg:col-span-5"
                >
                  {comparison.similarityPairs.length === 0 ? (
                    <p className="text-xs text-slate-500 py-10 text-center">
                      Select at least 2 analyzed datasets to compute pairwise Jaccard community
                      overlap.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-slate-500">
                            <th className="py-2 pr-3">Sample Pair</th>
                            <th className="py-2 px-2 text-right">Shared</th>
                            <th className="py-2 pl-2 text-right">Jaccard</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63]">
                          {comparison.similarityPairs.map((pair) => (
                            <tr key={`${pair.sampleA}-${pair.sampleB}`}>
                              <td className="py-2.5 pr-3 font-mono text-[#071B35] dark:text-white">
                                {pair.sampleA} ↔ {pair.sampleB}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                                {pair.sharedTaxa} / {pair.unionTaxa}
                              </td>
                              <td className="py-2.5 pl-2 text-right font-mono tabular-nums font-semibold text-[#0A4C7A] dark:text-[#21D4FD]">
                                {pair.jaccardIndex.toFixed(3)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </ChartCard>
              </div>

              {/* Taxa Relative Abundance Matrix */}
              <ChartCard
                title="Cross-Sample Taxonomic Relative Abundance Matrix (%)"
                subtitle="Percentage of valid sequence reads per taxon across selected samples."
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-slate-500 bg-slate-50/70 dark:bg-[#071B35]/60">
                        <th className="py-2.5 px-4">Taxon / OTU</th>
                        {comparison.samples.map((s) => (
                          <th key={s.id} className="py-2.5 px-4 text-right font-mono">
                            {s.sampleName}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63]">
                      {comparison.taxaMatrix.slice(0, 40).map((row) => (
                        <tr key={String(row.taxon)}>
                          <td className="py-2.5 px-4 font-medium italic text-[#071B35] dark:text-white">
                            {String(row.taxon)}
                          </td>
                          {comparison.samples.map((s) => {
                            const val = Number(row[`ds_${s.id}`] || 0);
                            return (
                              <td
                                key={s.id}
                                className="py-2.5 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200"
                              >
                                {val > 0 ? `${val.toFixed(2)}%` : '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </div>
          ) : null}
        </div>
      )}
    </DashboardLayout>
  );
}
