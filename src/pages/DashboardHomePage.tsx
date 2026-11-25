import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Database, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  ChartCard,
  EmptyState,
  LoadingSpinner,
  MetricCard,
  NotificationBanner,
  StatusText,
} from '../components/UI';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

interface OverviewResponse {
  isEmpty: boolean;
  stats: {
    totalDatasets: number;
    totalSamples: number;
    totalSequences: number;
    identifiedTaxa: number;
    unclassifiedSequences: number;
    meanSpeciesRichness: number;
    meanShannonIndex: number;
  };
  taxonomicDistribution: Array<{ name: string; value: number }>;
  speciesAbundance: Array<{ species: string; reads: number; relativePct: number }>;
  biodiversityTrends: Array<{
    datasetId: number;
    name: string;
    date: string;
    shannon: number;
    simpsonDiversity: number;
    richness: number;
    evenness: number;
  }>;
  classificationBreakdown: Array<{ name: string; value: number }>;
  sampleComparison: Array<{
    datasetId: number;
    sample: string;
    datasetName: string;
    sampleType: string;
    classified: number;
    unclassified: number;
    richness: number;
    shannon: number;
  }>;
  recentDatasets: Array<{
    id: number;
    datasetName: string;
    sampleName: string;
    fileFormat: string;
    sampleType: string;
    status: string;
    totalSequences: number;
    speciesRichness: number;
    shannonIndex: number;
    createdAt: string;
  }>;
}

const PIE_COLORS = ['#13B8A6', '#0EA5E9', '#F59E0B', '#64748B'];

export function DashboardHomePage() {
  const { profile } = useAuth();
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiFetch<OverviewResponse>('/api/dashboard/overview')
      .then((res) => {
        if (active) setData(res);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load dashboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout
      title={`Welcome back, ${profile?.fullName || 'Researcher'}`}
      subtitle={`${profile?.institution || 'Independent eDNA Lab'} · ${profile?.researchInterest || 'Marine Biodiversity'} · ${profile?.email || ''}`}
      action={
        <Link
          to="/dashboard/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Dataset</span>
        </Link>
      }
    >
      {error && <NotificationBanner type="error" message={error} />}

      {loading ? (
        <LoadingSpinner label="Querying your PostgreSQL eDNA datasets..." />
      ) : !data || data.isEmpty ? (
        <EmptyState
          icon={<Database className="h-6 w-6" />}
          title="No eDNA datasets analyzed yet"
          description="Your workspace metrics come strictly from your actual uploaded datasets. Upload a FASTA, FASTQ, or CSV sequence file to compute taxonomic assignments, Shannon and Simpson biodiversity indices, and unknown sequence clusters."
          action={
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Your First Dataset</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* 7 Real Database Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
            <MetricCard label="Total Datasets" value={data.stats.totalDatasets} />
            <MetricCard label="Total Samples" value={data.stats.totalSamples} />
            <MetricCard
              label="Sequences Analyzed"
              value={data.stats.totalSequences.toLocaleString()}
            />
            <MetricCard label="Identified Taxa" value={data.stats.identifiedTaxa} />
            <MetricCard
              label="Unclassified Reads"
              value={data.stats.unclassifiedSequences.toLocaleString()}
            />
            <MetricCard
              label="Mean Richness (S)"
              value={data.stats.meanSpeciesRichness.toFixed(1)}
              unit="OTUs"
            />
            <MetricCard
              label="Mean Shannon (H')"
              value={data.stats.meanShannonIndex.toFixed(3)}
            />
          </div>

          {/* Row 1 Charts: Taxonomic Distribution + Classified vs Unclassified */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <ChartCard
              title="Taxonomic Distribution by Phylum"
              subtitle="Sequence read distribution across detected phyla from your analyzed datasets."
              className="lg:col-span-7"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.taxonomicDistribution}
                    margin={{ top: 8, right: 16, left: 0, bottom: 28 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      angle={-22}
                      textAnchor="end"
                      interval={0}
                    />
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
                    <Bar dataKey="value" name="Sequences" fill="#0A4C7A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Classified vs Unclassified Sequences"
              subtitle="Resolution breakdown across all analyzed reads."
              className="lg:col-span-5"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.classificationBreakdown.filter((d) => d.value > 0)}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {data.classificationBreakdown.map((entry, idx) => (
                        <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
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
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Row 2 Charts: Species Relative Abundance + Biodiversity Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <ChartCard
              title="Top Taxa by Relative Read Abundance"
              subtitle="Relative molecular read percentage (not direct organism headcounts)."
              className="lg:col-span-6"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.speciesAbundance}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 24, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      type="category"
                      dataKey="species"
                      width={150}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#071B35',
                        borderColor: '#1B3A63',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar
                      dataKey="relativePct"
                      name="Relative Abundance (%)"
                      fill="#13B8A6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Biodiversity Trends Across Samples"
              subtitle="Shannon Index (H') and Gini-Simpson Diversity (1 - D) across analyzed datasets."
              className="lg:col-span-6"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.biodiversityTrends}
                    margin={{ top: 8, right: 20, left: 0, bottom: 16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
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
                    <Line
                      type="monotone"
                      dataKey="shannon"
                      name="Shannon (H')"
                      stroke="#21D4FD"
                      strokeWidth={2.2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="simpsonDiversity"
                      name="Gini-Simpson (1 - D)"
                      stroke="#13B8A6"
                      strokeWidth={2.2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Row 3: Sample Comparison + Recent Datasets Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <ChartCard
              title="Sample Classification Comparison"
              subtitle="Classified versus unclassified reads per sample."
              action={
                <Link
                  to="/dashboard/compare"
                  className="text-xs font-medium text-[#0A4C7A] dark:text-[#21D4FD] hover:underline inline-flex items-center gap-1"
                >
                  <span>Full Comparison</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              }
              className="lg:col-span-5"
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.sampleComparison}
                    margin={{ top: 8, right: 12, left: 0, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="sample" tick={{ fontSize: 11, fill: '#64748b' }} />
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
                    <Bar dataKey="classified" name="Classified" stackId="a" fill="#13B8A6" />
                    <Bar dataKey="unclassified" name="Unclassified" stackId="a" fill="#F59E0B" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Recent Datasets"
              subtitle="Your latest uploaded and analyzed environmental DNA files."
              action={
                <Link
                  to="/dashboard/datasets"
                  className="text-xs font-medium text-[#0A4C7A] dark:text-[#21D4FD] hover:underline"
                >
                  View All
                </Link>
              }
              className="lg:col-span-7"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-xs text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 pr-4">Dataset / Sample</th>
                      <th className="py-2.5 pr-4">Environment</th>
                      <th className="py-2.5 pr-4 text-right">Sequences</th>
                      <th className="py-2.5 pr-4 text-right">Shannon H&apos;</th>
                      <th className="py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63]">
                    {data.recentDatasets.map((ds) => (
                      <tr
                        key={ds.id}
                        className="hover:bg-slate-50 dark:hover:bg-[#102B4F]/60 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            to={`/dashboard/analysis?datasetId=${ds.id}`}
                            className="font-medium text-[#071B35] dark:text-white hover:text-[#0A4C7A] dark:hover:text-[#21D4FD]"
                          >
                            {ds.datasetName}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                            {ds.sampleName} · {ds.fileFormat}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">
                          {ds.sampleType}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums text-xs">
                          {ds.totalSequences}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono tabular-nums text-xs">
                          {ds.shannonIndex.toFixed(3)}
                        </td>
                        <td className="py-3">
                          <StatusText status={ds.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
