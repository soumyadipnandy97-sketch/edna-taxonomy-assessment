import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Database, Play, Search, Trash2, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  EmptyState,
  LoadingSpinner,
  Modal,
  NotificationBanner,
  StatusText,
} from '../components/UI';
import { apiFetch } from '../lib/api';

interface DatasetListItem {
  id: number;
  datasetName: string;
  sampleName: string;
  fileFormat: string;
  fileSize: number;
  sampleType: string;
  collectionLocation: string;
  collectionDate: string;
  status: string;
  createdAt: string;
  sequenceCount: number;
  biodiversity: {
    speciesRichness: number;
    shannonIndex: number;
    simpsonDiversity: number;
    unclassifiedCount: number;
  } | null;
}

export function DatasetLibraryPage() {
  const [datasets, setDatasets] = useState<DatasetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [envFilter, setEnvFilter] = useState('');
  const [runningId, setRunningId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DatasetListItem | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ datasets: DatasetListItem[] }>('/api/datasets');
      setDatasets(res.datasets);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to fetch datasets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRunAnalysis = async (id: number) => {
    setError('');
    setNotice('');
    setRunningId(id);
    try {
      await apiFetch(`/api/datasets/${id}/analyze`, { method: 'POST' });
      setNotice('Taxonomic identification and biodiversity metrics updated.');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setRunningId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await apiFetch(`/api/datasets/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setNotice('Dataset permanently removed from your private storage and PostgreSQL database.');
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const filtered = datasets.filter((d) => {
    if (envFilter && d.sampleType !== envFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        d.datasetName.toLowerCase().includes(q) ||
        d.sampleName.toLowerCase().includes(q) ||
        (d.collectionLocation || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <DashboardLayout
      title="Dataset Library"
      subtitle="Manage your private environmental DNA datasets, trigger re-analysis runs, and open detailed taxonomic and biodiversity views."
      action={
        <Link
          to="/dashboard/upload"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold whitespace-nowrap"
        >
          <Upload className="h-4 w-4" />
          <span>Upload Dataset</span>
        </Link>
      }
    >
      {error && <NotificationBanner type="error" message={error} onDismiss={() => setError('')} />}
      {notice && <NotificationBanner type="success" message={notice} onDismiss={() => setNotice('')} />}

      {loading ? (
        <LoadingSpinner label="Loading dataset catalog..." />
      ) : datasets.length === 0 ? (
        <EmptyState
          icon={<Database className="h-6 w-6" />}
          title="Your dataset library is empty"
          description="Upload a FASTA, FASTQ, or CSV environmental DNA dataset to start classifying sequences and calculating ecological biodiversity indices."
          action={
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Your First Dataset</span>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Search & Environment Filter */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search dataset, sample ID, or location..."
                className="w-full pl-10 pr-3.5 py-2 rounded-lg text-sm bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-[#0C2342] rounded-lg border border-slate-200 dark:border-[#1B3A63]">
              {['', 'Marine', 'Freshwater', 'Soil', 'Terrestrial'].map((env) => (
                <button
                  key={env || 'all'}
                  type="button"
                  onClick={() => setEnvFilter(env)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    envFilter === env
                      ? 'bg-white dark:bg-[#133058] text-[#071B35] dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#071B35] dark:hover:text-white'
                  }`}
                >
                  {env || 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-xs text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-[#071B35]/60">
                    <th className="py-3 px-4">Dataset & Sample</th>
                    <th className="py-3 px-4">Environment & Location</th>
                    <th className="py-3 px-4 text-right">Sequences</th>
                    <th className="py-3 px-4 text-right">Richness (S)</th>
                    <th className="py-3 px-4 text-right">Shannon (H&apos;)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63]">
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#102B4F]/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#071B35] dark:text-white">
                          {d.datasetName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {d.sampleName} · {d.fileFormat} · {(d.fileSize / 1024).toFixed(1)} KB
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>{d.sampleType}</div>
                        <div className="text-slate-400 truncate max-w-[200px]">
                          {d.collectionLocation || 'Location not recorded'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                        {d.sequenceCount}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                        {d.biodiversity ? d.biodiversity.speciesRichness : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                        {d.biodiversity ? d.biodiversity.shannonIndex.toFixed(3) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusText status={d.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/dashboard/analysis?datasetId=${d.id}`}
                            className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-[#1B3A63] text-[#0A4C7A] dark:text-[#21D4FD] hover:bg-slate-100 dark:hover:bg-[#133058] whitespace-nowrap"
                          >
                            Inspect
                          </Link>
                          <button
                            type="button"
                            disabled={runningId === d.id}
                            onClick={() => handleRunAnalysis(d.id)}
                            title="Run or re-run taxonomic analysis"
                            className="p-1.5 rounded-md border border-slate-200 dark:border-[#1B3A63] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#133058] disabled:opacity-50"
                          >
                            <Play className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(d)}
                            title="Delete dataset"
                            className="p-1.5 rounded-md border border-slate-200 dark:border-[#1B3A63] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete Dataset"
        onClose={() => setDeleteTarget(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Permanently delete <strong className="text-[#071B35] dark:text-white">{deleteTarget?.datasetName}</strong>? This removes the uploaded file, parsed DNA sequences, taxonomic assignments, and biodiversity results from PostgreSQL.
          </p>
          <div className="flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-300 dark:border-[#1B3A63] text-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
