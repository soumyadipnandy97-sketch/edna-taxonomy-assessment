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
import { BarChart3, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  ChartCard,
  EmptyState,
  LoadingSpinner,
  MetricCard,
  NotificationBanner,
} from '../components/UI';
import { apiFetch } from '../lib/api';

interface DatasetWithBio {
  id: number;
  datasetName: string;
  sampleName: string;
  sampleType: string;
  collectionLocation: string;
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
      relativeAbundance?: Array<{
        taxon: string;
        kingdom: string;
        phylum: string;
        count: number;
        relativeAbundancePct: number;
        status: string;
      }>;
    };
  } | null;
}

export function BiodiversityPage() {
  const [datasets, setDatasets] = useState<DatasetWithBio[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ datasets: DatasetWithBio[] }>('/api/datasets')
      .then((res) => {
        const analyzed = res.datasets.filter((d) => d.biodiversity !== null);
        setDatasets(analyzed);
        if (analyzed.length > 0) setSelectedId(analyzed[0].id);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Unable to load biodiversity data.')
      )
      .finally(() => setLoading(false));
  }, []);

  const active = datasets.find((d) => d.id === selectedId) || datasets[0] || null;
  const bio = active?.biodiversity || null;
  const abundance = bio?.analysisMetadata?.relativeAbundance || [];

  const crossSampleChart = datasets.map((d) => ({
    sample: d.sampleName,
    richness: d.biodiversity?.speciesRichness ?? 0,
    shannon: d.biodiversity?.shannonIndex ?? 0,
    simpsonD: d.biodiversity?.simpsonIndex ?? 0,
    giniSimpson: d.biodiversity?.simpsonDiversity ?? 0,
    evenness: d.biodiversity?.evenness ?? 0,
  }));

  return (
    <DashboardLayout
      title="Biodiversity Assessment"
      subtitle="Ecological diversity indices computed directly from your analyzed eDNA datasets, with transparent mathematical definitions and read-abundance caveats."
      action={
        datasets.length > 0 && (
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="px-3.5 py-2 rounded-lg text-sm bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] text-[#071B35] dark:text-white"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.datasetName} ({d.sampleName})
              </option>
            ))}
          </select>
        )
      }
    >
      {error && <NotificationBanner type="error" message={error} />}

      {loading ? (
        <LoadingSpinner label="Computing ecological diversity indices..." />
      ) : !active || !bio ? (
        <EmptyState
          icon={<BarChart3 className="h-6 w-6" />}
          title="No biodiversity assessments available"
          description="Upload and analyze an eDNA dataset to compute Species Richness, Shannon Diversity (H'), Simpson Index (D & 1 - D), Pielou Evenness (J'), and relative abundance profiles."
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
          {/* Ecological Caveat Notice */}
          <NotificationBanner
            type="info"
            message="Scientific Note: eDNA sequence read counts represent relative molecular detection abundance—influenced by PCR primer bias, marker copy number, and DNA shedding rates—rather than exact individual organism population counts."
          />

          {/* Core 5 Indices */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricCard
              label="Species Richness (S)"
              value={bio.speciesRichness}
              unit="OTUs"
              detail="Distinct identified taxa and novel OTUs"
            />
            <MetricCard
              label="Shannon Diversity (H')"
              value={bio.shannonIndex.toFixed(4)}
              detail="H' = -Σ(pi × ln(pi))"
            />
            <MetricCard
              label="Simpson Dominance (D)"
              value={bio.simpsonIndex.toFixed(4)}
              detail="D = Σ(pi²) — lower implies less dominance"
            />
            <MetricCard
              label="Gini-Simpson (1 - D)"
              value={bio.simpsonDiversity.toFixed(4)}
              detail="Probability two reads differ in taxon"
            />
            <MetricCard
              label="Pielou's Evenness (J')"
              value={bio.evenness.toFixed(4)}
              detail="J' = H' / ln(S) (0 to 1 scale)"
            />
          </div>

          {/* Relative Abundance & Cross-Sample Richness */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <ChartCard
              title={`Taxonomic Relative Abundance — ${active.sampleName}`}
              subtitle="Percentage share of valid sequence reads per taxon or OTU cluster."
              className="lg:col-span-7"
            >
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={abundance.slice(0, 12)}
                    layout="vertical"
                    margin={{ top: 4, right: 20, left: 24, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      type="category"
                      dataKey="taxon"
                      width={165}
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
                      dataKey="relativeAbundancePct"
                      name="Relative Read Abundance (%)"
                      fill="#13B8A6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Species Richness Across Samples"
              subtitle="Operational taxonomic richness (S) per analyzed sample."
              className="lg:col-span-5"
            >
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossSampleChart}>
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
                    <Bar dataKey="richness" name="Species Richness (S)" fill="#0A4C7A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Shannon & Simpson Diversity Comparison Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Shannon Diversity Index (H') by Sample"
              subtitle="Combines taxonomic richness and relative read evenness."
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossSampleChart}>
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
                    <Bar dataKey="shannon" name="Shannon (H')" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>

            <ChartCard
              title="Simpson Diversity (1 - D) & Evenness (J')"
              subtitle="Gini-Simpson probability of inter-taxon encounter alongside Pielou evenness."
            >
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={crossSampleChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                    <XAxis dataKey="sample" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#64748b' }} />
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
                    <Bar dataKey="giniSimpson" name="Gini-Simpson (1 - D)" fill="#13B8A6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="evenness" name="Evenness (J')" fill="#21D4FD" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Metric Interpretation Guide */}
          <section className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              Ecological Metric Interpretation Guide
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <p className="font-semibold text-[#071B35] dark:text-white mb-1">
                  Species Richness (S)
                </p>
                <p>
                  Counts distinct identified species, genus-level partials, and novel OTU clusters
                  detected in the sample. Sensitive to sequencing depth.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#071B35] dark:text-white mb-1">
                  Shannon Index (H&apos;)
                </p>
                <p>
                  Quantifies uncertainty in predicting the taxon of a randomly sampled read.
                  Marine eDNA samples typically fall between 1.0 and 3.5 depending on habitat
                  complexity.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#071B35] dark:text-white mb-1">
                  Simpson (D &amp; 1 - D)
                </p>
                <p>
                  D measures dominance by abundant taxa; 1 - D expresses diversity on a 0 to 1
                  scale where values near 1 indicate low single-taxon dominance.
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#071B35] dark:text-white mb-1">
                  Pielou&apos;s Evenness (J&apos;)
                </p>
                <p>
                  Ratio of observed Shannon diversity to the theoretical maximum ln(S). Values
                  approaching 1.0 denote balanced relative read representation across taxa.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  );
}
