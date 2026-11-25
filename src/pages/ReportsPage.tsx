import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { Download, FileJson, FileSpreadsheet, FileText, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { EmptyState, LoadingSpinner, NotificationBanner } from '../components/UI';
import { apiFetch } from '../lib/api';

interface DatasetOption {
  id: number;
  datasetName: string;
  sampleName: string;
  status: string;
}

interface ReportPayload {
  generatedAt: string;
  researcher: {
    fullName: string;
    email: string;
    institution: string;
  };
  dataset: {
    id: number;
    datasetName: string;
    sampleName: string;
    fileFormat: string;
    fileSize: number;
    sampleType: string;
    collectionLocation: string;
    collectionDate: string;
    description: string;
    status: string;
    createdAt: string;
  };
  preprocessing: {
    validSequences: number;
    meanSequenceLength: number;
    meanGcContent: number;
    meanQualityScore: number | null;
    referenceDatabase: string;
    method: string;
  };
  biodiversity: {
    speciesRichness: number;
    shannonIndex: number;
    simpsonIndex: number;
    simpsonDiversity: number;
    evenness: number;
    totalSequences: number;
    classifiedCount: number;
    unclassifiedCount: number;
  } | null;
  taxonomyResults: Array<{
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
    referenceDatabase: string;
    clusterId: string | null;
  }>;
  relativeAbundance: Array<{
    taxon: string;
    kingdom: string;
    phylum: string;
    count: number;
    relativeAbundancePct: number;
    status: string;
  }>;
  unclassifiedClusters: Array<{
    clusterId: string;
    sequenceCount: number;
    avgLength: number;
    avgSimilarity: number;
    representativeSeqId: string;
    classificationNote: string;
  }>;
  scientificInterpretation: string;
  limitations: string[];
  conclusion: string;
}

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function ReportsPage() {
  const [datasets, setDatasets] = useState<DatasetOption[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [report, setReport] = useState<ReportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ datasets: DatasetOption[] }>('/api/datasets')
      .then((res) => {
        setDatasets(res.datasets);
        if (res.datasets.length > 0) setSelectedId(res.datasets[0].id);
        else setLoading(false);
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
    apiFetch<ReportPayload>(`/api/datasets/${selectedId}/report`)
      .then((res) => setReport(res))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Unable to compile scientific report.')
      )
      .finally(() => setLoading(false));
  }, [selectedId]);

  const exportJSON = () => {
    if (!report) return;
    const slug = report.dataset.sampleName.replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(
      `DeepSeaBioAI_Report_${slug}.json`,
      JSON.stringify(report, null, 2),
      'application/json'
    );
  };

  const exportCSV = () => {
    if (!report) return;
    const headers = [
      'sequence_id',
      'kingdom',
      'phylum',
      'class',
      'order',
      'family',
      'genus',
      'species',
      'similarity_score',
      'confidence_score',
      'identification_status',
      'cluster_id',
      'reference_database',
    ];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [
      headers.join(','),
      ...report.taxonomyResults.map((r) =>
        [
          r.sequenceId,
          r.kingdom,
          r.phylum,
          r.className,
          r.orderName,
          r.family,
          r.genus,
          r.species,
          r.similarityScore,
          r.confidenceScore,
          r.identificationStatus,
          r.clusterId || '',
          r.referenceDatabase,
        ]
          .map(esc)
          .join(',')
      ),
    ];
    const slug = report.dataset.sampleName.replace(/[^a-zA-Z0-9_-]/g, '_');
    triggerDownload(`DeepSeaBioAI_Taxonomy_${slug}.csv`, lines.join('\n'), 'text/csv;charset=utf-8;');
  };

  const exportPDF = () => {
    if (!report) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 44;
    const maxWidth = 507;
    let y = 50;

    const ensureSpace = (needed: number) => {
      if (y + needed > 780) {
        doc.addPage();
        y = 50;
      }
    };

    const addHeading = (text: string) => {
      ensureSpace(34);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(7, 27, 53);
      doc.text(text, margin, y);
      y += 16;
      doc.setDrawColor(200, 215, 230);
      doc.line(margin, y - 8, margin + maxWidth, y - 8);
    };

    const addBody = (text: string) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(45, 58, 75);
      const lines = doc.splitTextToSize(text, maxWidth) as string[];
      for (const line of lines) {
        ensureSpace(14);
        doc.text(line, margin, y);
        y += 13;
      }
      y += 5;
    };

    // Header Banner
    doc.setFillColor(7, 27, 53);
    doc.rect(0, 0, 595, 84, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('DeepSea BioAI — Scientific eDNA Analysis Report', margin, 38);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(180, 235, 250);
    doc.text(
      `Problem Statement ID 25042 | Generated ${new Date(report.generatedAt).toLocaleString()} | Researcher: ${report.researcher.fullName}`,
      margin,
      60
    );
    y = 108;

    addHeading('1. Dataset Information & 2. Sample Metadata');
    addBody(
      `Dataset Name: ${report.dataset.datasetName}\nSample Identifier: ${report.dataset.sampleName} | Environmental Type: ${report.dataset.sampleType}\nCollection Location: ${report.dataset.collectionLocation || 'Not specified'} | Collection Date: ${report.dataset.collectionDate || 'Not specified'}\nFile Format: ${report.dataset.fileFormat} (${(report.dataset.fileSize / 1024).toFixed(1)} KB) | Researcher Institution: ${report.researcher.institution}\nNotes: ${report.dataset.description || 'None recorded.'}`
    );

    addHeading('3. Preprocessing Results');
    addBody(
      `Valid Sequences Parsed: ${report.preprocessing.validSequences}\nMean Sequence Length: ${report.preprocessing.meanSequenceLength} bp | Mean GC Content: ${report.preprocessing.meanGcContent}%${report.preprocessing.meanQualityScore ? ` | Mean Phred Quality: ${report.preprocessing.meanQualityScore}` : ''}\nReference Database: ${report.preprocessing.referenceDatabase}\nMethod: ${report.preprocessing.method}`
    );

    addHeading('4. Taxonomic Classification & 5. Biodiversity Metrics');
    if (report.biodiversity) {
      addBody(
        `Total Sequences Analyzed: ${report.biodiversity.totalSequences} | Classified: ${report.biodiversity.classifiedCount} | Unclassified / Divergent: ${report.biodiversity.unclassifiedCount}\nSpecies Richness (S): ${report.biodiversity.speciesRichness} operational taxonomic units\nShannon Diversity Index (H'): ${report.biodiversity.shannonIndex.toFixed(4)}\nSimpson Dominance (D): ${report.biodiversity.simpsonIndex.toFixed(4)} | Gini-Simpson Diversity (1 - D): ${report.biodiversity.simpsonDiversity.toFixed(4)}\nPielou's Evenness (J'): ${report.biodiversity.evenness.toFixed(4)}`
      );
    } else {
      addBody('Analysis has not yet been executed on this dataset.');
    }

    addHeading('6. Species Distribution (Relative Read Abundance)');
    if (report.relativeAbundance.length > 0) {
      for (const item of report.relativeAbundance.slice(0, 15)) {
        addBody(
          `• ${item.taxon} (${item.kingdom} / ${item.phylum}) — ${item.count} reads (${item.relativeAbundancePct}%) [${item.status}]`
        );
      }
    } else {
      addBody('No taxonomic abundance records available.');
    }

    addHeading('7. Unclassified Sequences & Candidate OTU Clusters');
    if (report.unclassifiedClusters.length > 0) {
      for (const c of report.unclassifiedClusters) {
        addBody(
          `• ${c.clusterId}: ${c.sequenceCount} reads | Avg Length ${c.avgLength} bp | Mean Similarity ${c.avgSimilarity}% | Rep: ${c.representativeSeqId} — ${c.classificationNote}`
        );
      }
    } else {
      addBody('No unclassified or divergent sequence clusters flagged in this sample.');
    }

    addHeading('8. Scientific Interpretation');
    addBody(report.scientificInterpretation);

    addHeading('9. Methodological Limitations');
    for (const lim of report.limitations) {
      addBody(`• ${lim}`);
    }

    addHeading('10. Conclusion');
    addBody(report.conclusion);

    const slug = report.dataset.sampleName.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`DeepSeaBioAI_Report_${slug}.pdf`);
  };

  return (
    <DashboardLayout
      title="Scientific Report Generation"
      subtitle="Compile reproducible 10-section eDNA biodiversity reports from your PostgreSQL analysis records and export to PDF, CSV, or JSON."
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
        <LoadingSpinner label="Compiling scientific report from PostgreSQL..." />
      ) : !report ? (
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title="No datasets available to report"
          description="Upload and analyze an environmental DNA dataset first to generate downloadable PDF, CSV, and JSON scientific reports."
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
          {/* Export Action Toolbar */}
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Compiled for <strong className="text-[#071B35] dark:text-white">{report.dataset.datasetName}</strong> ·{' '}
              <span className="font-mono">{report.taxonomyResults.length} classified rows</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={exportPDF}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-xs font-semibold hover:opacity-90"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download PDF Report</span>
              </button>
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#1B3A63] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#133058]"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={exportJSON}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-[#1B3A63] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#133058]"
              >
                <FileJson className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>

          {/* 10-Section Structured Scientific Report Preview */}
          <article className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-10 space-y-8 text-sm">
            <header className="pb-6 border-b border-slate-200 dark:border-[#1B3A63] space-y-2">
              <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">
                DeepSea BioAI Scientific Report · Problem Statement ID 25042
              </p>
              <h2 className="text-2xl font-bold text-[#071B35] dark:text-white">
                {report.dataset.datasetName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prepared by {report.researcher.fullName} ({report.researcher.institution}) · Generated{' '}
                {new Date(report.generatedAt).toLocaleString()}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                  1. Dataset Information &amp; 2. Sample Metadata
                </h3>
                <dl className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div><span className="font-medium">Sample ID:</span> <span className="font-mono">{report.dataset.sampleName}</span></div>
                  <div><span className="font-medium">Environment:</span> {report.dataset.sampleType}</div>
                  <div><span className="font-medium">Location:</span> {report.dataset.collectionLocation || 'Not specified'}</div>
                  <div><span className="font-medium">Collection Date:</span> {report.dataset.collectionDate || 'Not specified'}</div>
                  <div><span className="font-medium">Format &amp; Size:</span> {report.dataset.fileFormat} ({(report.dataset.fileSize / 1024).toFixed(1)} KB)</div>
                </dl>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                  3. Preprocessing &amp; Reference Provenance
                </h3>
                <dl className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div><span className="font-medium">Valid Sequences:</span> <span className="font-mono tabular-nums">{report.preprocessing.validSequences}</span></div>
                  <div><span className="font-medium">Mean Length:</span> <span className="font-mono tabular-nums">{report.preprocessing.meanSequenceLength} bp</span></div>
                  <div><span className="font-medium">Mean GC Content:</span> <span className="font-mono tabular-nums">{report.preprocessing.meanGcContent}%</span></div>
                  <div><span className="font-medium">Reference DB:</span> {report.preprocessing.referenceDatabase}</div>
                </dl>
              </section>
            </div>

            {report.biodiversity && (
              <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#1B3A63]">
                <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                  4. Taxonomic Summary &amp; 5. Biodiversity Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#17345A]">
                    <div className="text-[11px] text-slate-500">Richness (S)</div>
                    <div className="text-lg font-mono font-semibold tabular-nums text-[#071B35] dark:text-white">
                      {report.biodiversity.speciesRichness}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#17345A]">
                    <div className="text-[11px] text-slate-500">Shannon (H&apos;)</div>
                    <div className="text-lg font-mono font-semibold tabular-nums text-[#071B35] dark:text-white">
                      {report.biodiversity.shannonIndex.toFixed(4)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#17345A]">
                    <div className="text-[11px] text-slate-500">Simpson (D)</div>
                    <div className="text-lg font-mono font-semibold tabular-nums text-[#071B35] dark:text-white">
                      {report.biodiversity.simpsonIndex.toFixed(4)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#17345A]">
                    <div className="text-[11px] text-slate-500">Gini-Simpson (1-D)</div>
                    <div className="text-lg font-mono font-semibold tabular-nums text-[#071B35] dark:text-white">
                      {report.biodiversity.simpsonDiversity.toFixed(4)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#17345A]">
                    <div className="text-[11px] text-slate-500">Evenness (J&apos;)</div>
                    <div className="text-lg font-mono font-semibold tabular-nums text-[#071B35] dark:text-white">
                      {report.biodiversity.evenness.toFixed(4)}
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-[#1B3A63]">
              <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                6. Species Distribution (Relative Read Abundance)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-slate-500">
                      <th className="py-2 pr-4">Taxon / OTU</th>
                      <th className="py-2 pr-4">Lineage</th>
                      <th className="py-2 pr-4 text-right">Reads</th>
                      <th className="py-2 text-right">Relative Abundance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63]">
                    {report.relativeAbundance.slice(0, 15).map((item) => (
                      <tr key={item.taxon}>
                        <td className="py-2 pr-4 italic font-medium text-[#071B35] dark:text-white">
                          {item.taxon}
                        </td>
                        <td className="py-2 pr-4 text-slate-500">
                          {item.kingdom} · {item.phylum}
                        </td>
                        <td className="py-2 pr-4 text-right font-mono tabular-nums">{item.count}</td>
                        <td className="py-2 text-right font-mono tabular-nums">
                          {item.relativeAbundancePct.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="space-y-2 pt-4 border-t border-slate-200 dark:border-[#1B3A63]">
              <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                7. Unclassified Sequences &amp; Candidate OTU Clusters
              </h3>
              {report.unclassifiedClusters.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No unclassified or divergent sequence clusters flagged in this dataset.
                </p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  {report.unclassifiedClusters.map((c) => (
                    <li key={c.clusterId}>
                      <span className="font-mono font-semibold text-[#0A4C7A] dark:text-[#21D4FD]">
                        {c.clusterId}
                      </span>{' '}
                      ({c.sequenceCount} reads, mean {c.avgLength} bp, similarity {c.avgSimilarity}%) —{' '}
                      {c.classificationNote}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-2 pt-4 border-t border-slate-200 dark:border-[#1B3A63]">
              <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                8. Scientific Interpretation
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.scientificInterpretation}
              </p>
            </section>

            <section className="space-y-2 pt-4 border-t border-slate-200 dark:border-[#1B3A63]">
              <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                9. Limitations
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.limitations.map((lim) => (
                  <li key={lim}>{lim}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-2 pt-4 border-t border-slate-200 dark:border-[#1B3A63]">
              <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                10. Conclusion
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.conclusion}
              </p>
            </section>
          </article>
        </div>
      )}
    </DashboardLayout>
  );
}
