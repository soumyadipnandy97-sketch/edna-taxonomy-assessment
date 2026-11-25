import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, FileText, Trash2, Upload } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { NotificationBanner } from '../components/UI';
import { apiFetch } from '../lib/api';

const ENV_TYPES = ['Marine', 'Freshwater', 'Soil', 'Terrestrial', 'Other'];
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const VALID_EXTS = new Set(['fasta', 'fa', 'fna', 'fastq', 'fq', 'csv']);

interface QueuedFile {
  file: File;
  preview: string;
}

export function UploadDatasetPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [queuedFiles, setQueuedFiles] = useState<QueuedFile[]>([]);
  const [dragging, setDragging] = useState(false);

  const [datasetName, setDatasetName] = useState('');
  const [sampleName, setSampleName] = useState('');
  const [sampleType, setSampleType] = useState('Marine');
  const [collectionLocation, setCollectionLocation] = useState('');
  const [collectionDate, setCollectionDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState('');
  const [runImmediately, setRunImmediately] = useState(true);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    message: string;
    firstDatasetId?: number;
  } | null>(null);

  const addFiles = async (fileList: FileList | File[]) => {
    setError('');
    const incoming = Array.from(fileList);
    const accepted: QueuedFile[] = [];

    for (const file of incoming) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      if (!VALID_EXTS.has(ext)) {
        setError(
          `Unsupported file "${file.name}". Please upload FASTA (.fasta, .fa), FASTQ (.fastq, .fq), or CSV (.csv).`
        );
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`File "${file.name}" exceeds the 15 MB maximum upload limit.`);
        continue;
      }
      const headChunk = await file.slice(0, 1800).text();
      const previewLines = headChunk.split(/\r?\n/).slice(0, 10).join('\n');
      accepted.push({ file, preview: previewLines });
    }

    if (accepted.length > 0) {
      setQueuedFiles((prev) => [...prev, ...accepted].slice(0, 5));
      if (!datasetName) {
        setDatasetName(accepted[0].file.name.replace(/\.[^.]+$/, ''));
      }
      if (!sampleName) {
        setSampleName(`EDNA-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-01`);
      }
    }
  };

  const handleLoadSample = async (profile: 'pelagic' | 'vent', format: 'FASTA' | 'FASTQ' | 'CSV') => {
    setError('');
    try {
      const sample = await apiFetch<{
        filename: string;
        content: string;
        sampleName: string;
        location: string;
        description: string;
      }>(`/api/samples/${profile}/${format}`, { skipAuth: true });

      const file = new File([sample.content], sample.filename, { type: 'text/plain' });
      const preview = sample.content.split('\n').slice(0, 10).join('\n');
      setQueuedFiles([{ file, preview }]);
      setDatasetName(
        profile === 'pelagic'
          ? `North Atlantic Pelagic eDNA (${format})`
          : `Hydrothermal Vent Plume eDNA (${format})`
      );
      setSampleName(sample.sampleName);
      setSampleType('Marine');
      setCollectionLocation(sample.location);
      setDescription(sample.description);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load sample file.');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessInfo(null);

    if (queuedFiles.length === 0) {
      setError('Please select or drop at least one FASTA, FASTQ, or CSV sequence file.');
      return;
    }
    if (!datasetName.trim() || !sampleName.trim()) {
      setError('Dataset name and sample name are required.');
      return;
    }

    setUploading(true);
    setProgress(20);

    try {
      const formData = new FormData();
      for (const q of queuedFiles) {
        formData.append('files', q.file);
      }
      formData.append('datasetName', datasetName.trim());
      formData.append('sampleName', sampleName.trim());
      formData.append('sampleType', sampleType);
      formData.append('collectionLocation', collectionLocation.trim());
      formData.append('collectionDate', collectionDate);
      formData.append('description', description.trim());
      formData.append('runImmediately', String(runImmediately));

      const progressTimer = window.setInterval(() => {
        setProgress((p) => (p < 85 ? p + 12 : p));
      }, 220);

      const res = await apiFetch<{
        message: string;
        uploaded: Array<{ dataset: { id: number } }>;
      }>('/api/datasets/upload', {
        method: 'POST',
        body: formData,
      });

      window.clearInterval(progressTimer);
      setProgress(100);
      const firstId = res.uploaded?.[0]?.dataset?.id;
      setSuccessInfo({ message: res.message, firstDatasetId: firstId });
      setQueuedFiles([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Dataset upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout
      title="Upload eDNA Dataset"
      subtitle="Ingest FASTA, FASTQ, or CSV environmental DNA sequence files into your private edna-datasets storage bucket and run automated taxonomic & biodiversity analysis."
    >
      {error && <NotificationBanner type="error" message={error} onDismiss={() => setError('')} />}
      {successInfo && (
        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-teal-900 dark:text-teal-200 text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successInfo.message}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {successInfo.firstDatasetId && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/dashboard/analysis?datasetId=${successInfo.firstDatasetId}`)
                }
                className="px-4 py-2 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-xs font-semibold"
              >
                Inspect Taxonomic Results
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard/biodiversity')}
              className="px-4 py-2 rounded-lg border border-teal-300 dark:border-teal-700 text-teal-900 dark:text-teal-200 text-xs font-medium"
            >
              View Biodiversity Metrics
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleUpload} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dropzone, File Preview & Quick Sample Loader */}
        <div className="lg:col-span-7 space-y-5">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
            }}
            className={`bg-white dark:bg-[#0C2342] border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragging
                ? 'border-[#21D4FD] bg-cyan-50/40 dark:bg-[#11315A]'
                : 'border-slate-300 dark:border-[#1B3A63]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".fasta,.fa,.fna,.fastq,.fq,.csv"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-[#133058] text-[#0A4C7A] dark:text-[#21D4FD] flex items-center justify-center mx-auto mb-4">
              <Upload className="h-6 w-6" />
            </div>
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              Drag and drop sequence files here
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">
              Supported formats: FASTA (.fasta, .fa), FASTQ (.fastq, .fq), CSV (.csv) · Up to 5
              files, 15 MB each
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 px-4 py-2 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Browse Local Files
            </button>
          </div>

          {/* Ready-to-test Scientific Reference Sample Files */}
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#071B35] dark:text-white">
                Test with Curated Marine eDNA Sample Files
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Real amplicon sequences
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Load a verified marine eDNA amplicon dataset into the uploader or download it to your
              machine to test multi-format parsing, taxonomic matching, and unknown OTU clustering.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="border border-slate-200 dark:border-[#1B3A63] rounded-lg p-3.5 space-y-2">
                <p className="text-xs font-semibold text-[#071B35] dark:text-white">
                  North Atlantic Pelagic (200m)
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['FASTA', 'FASTQ', 'CSV'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleLoadSample('pelagic', fmt)}
                      className="px-2.5 py-1 rounded-md text-xs font-mono border border-slate-300 dark:border-[#244878] text-[#0A4C7A] dark:text-[#21D4FD] hover:bg-slate-100 dark:hover:bg-[#133058] transition-colors"
                    >
                      Load {fmt}
                    </button>
                  ))}
                  <a
                    href="/api/samples/pelagic/FASTA?download=1"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-600 dark:text-slate-300 hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    <span>Save</span>
                  </a>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-[#1B3A63] rounded-lg p-3.5 space-y-2">
                <p className="text-xs font-semibold text-[#071B35] dark:text-white">
                  Hydrothermal Vent Plume (2,450m)
                </p>
                <div className="flex flex-wrap gap-2">
                  {(['FASTA', 'FASTQ', 'CSV'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => handleLoadSample('vent', fmt)}
                      className="px-2.5 py-1 rounded-md text-xs font-mono border border-slate-300 dark:border-[#244878] text-[#0A4C7A] dark:text-[#21D4FD] hover:bg-slate-100 dark:hover:bg-[#133058] transition-colors"
                    >
                      Load {fmt}
                    </button>
                  ))}
                  <a
                    href="/api/samples/vent/FASTQ?download=1"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs text-slate-600 dark:text-slate-300 hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    <span>Save</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Files Preview */}
          {queuedFiles.length > 0 && (
            <div className="space-y-3">
              {queuedFiles.map((q, idx) => (
                <div
                  key={`${q.file.name}-${idx}`}
                  className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-4 w-4 text-[#0A4C7A] dark:text-[#21D4FD] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#071B35] dark:text-white truncate">
                          {q.file.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                          {(q.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setQueuedFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      aria-label={`Remove ${q.file.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono bg-slate-50 dark:bg-[#071B35] border border-slate-200 dark:border-[#17345A] rounded-lg p-3 overflow-x-auto text-slate-700 dark:text-slate-300 max-h-40">
                    {q.preview}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Dataset Metadata Form */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              Sample & Collection Metadata
            </h2>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Dataset Name
              </label>
              <input
                type="text"
                required
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
                placeholder="e.g., Mariana Trench Water Column Survey"
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sample Identifier
                </label>
                <input
                  type="text"
                  required
                  value={sampleName}
                  onChange={(e) => setSampleName(e.target.value)}
                  placeholder="e.g., MT-ST04-500M"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm font-mono bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Environmental Type
                </label>
                <select
                  value={sampleType}
                  onChange={(e) => setSampleType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {ENV_TYPES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Collection Location
                </label>
                <input
                  type="text"
                  value={collectionLocation}
                  onChange={(e) => setCollectionLocation(e.target.value)}
                  placeholder="Coordinates or Marine Basin"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Collection Date
                </label>
                <input
                  type="date"
                  value={collectionDate}
                  onChange={(e) => setCollectionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sampling Notes / Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Filtration volume, target marker gene (COI/16S/18S), depth profile..."
                className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={runImmediately}
                onChange={(e) => setRunImmediately(e.target.checked)}
                className="rounded border-slate-300 text-[#0A4C7A] focus:ring-cyan-500"
              />
              <span>Run taxonomic identification & biodiversity assessment immediately</span>
            </label>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono text-slate-500">
                  <span>Uploading & parsing sequences...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-[#133058] overflow-hidden">
                  <div
                    className="h-full bg-[#13B8A6] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || queuedFiles.length === 0}
              className="w-full py-2.5 px-4 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {uploading
                ? 'Processing Dataset...'
                : runImmediately
                  ? 'Upload & Run eDNA Analysis'
                  : 'Upload Dataset to Library'}
            </button>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
