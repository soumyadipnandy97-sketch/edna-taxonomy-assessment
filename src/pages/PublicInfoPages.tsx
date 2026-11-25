import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Send } from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { NotificationBanner, SafeImage } from '../components/UI';
import { apiFetch } from '../lib/api';

const SAMPLING_IMG = '/src/assets/images/workflow_ocean_sampling_1795609531297.jpg';
const SPECIMEN_IMG = '/src/assets/images/specimen_coral_edna_1795609530611.jpg';

export function AboutPage() {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <header className="space-y-4 max-w-3xl">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">
            About DeepSea BioAI · Problem Statement ID 25042
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#071B35] dark:text-white text-balance">
            Advancing biodiversity discovery through environmental DNA bioinformatics
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Environmental DNA (eDNA) metabarcoding allows marine biologists, conservationists, and
            students to survey ecosystems from trace genetic fragments left in water, sediment, or
            soil—minimizing invasive sampling while illuminating cryptic and deep-sea biodiversity.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#1B3A63] aspect-[4/3]">
            <SafeImage
              src={SAMPLING_IMG}
              alt="Oceanographic water column sampling rosette"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8 flex flex-col justify-center space-y-4">
            <h2 className="text-xl font-semibold text-[#071B35] dark:text-white">
              Scientific Principles
            </h2>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                <strong className="text-[#071B35] dark:text-white">Conservative Taxonomic Calls:</strong>{' '}
                Sequences without reliable similarity against reference barcodes are marked
                Partially identified, Potentially novel sequence, or Unclassified—never invented.
              </li>
              <li>
                <strong className="text-[#071B35] dark:text-white">Read Abundance Discipline:</strong>{' '}
                Relative read percentages are presented as molecular detection proxies rather than
                absolute organism headcounts.
              </li>
              <li>
                <strong className="text-[#071B35] dark:text-white">Reproducible Persistence:</strong>{' '}
                Every dataset, sequence, taxonomy assignment, and ecological index is stored in
                PostgreSQL and exportable in PDF, CSV, and JSON.
              </li>
            </ul>
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2">
            <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
              Local Reference Alignment
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Uses multi-scale k-mer containment and Jaccard scoring against curated marine COI,
              16S rRNA, and 18S rRNA marker loci, transparently labeled in every report.
            </p>
          </div>
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2">
            <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
              Divergent Lineage Clustering
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Groups unmatched reads into coherent operational taxonomic units (OTU-UNK clusters) to
              prioritize targets for expanded reference screening and wet-lab follow-up.
            </p>
          </div>
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2">
            <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
              Grounded AI Assistance
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              BioAI Assistant runs securely on the backend using Gemini models supplied with your
              exact database results, assisting interpretation without fabricating measurements.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

export function FeaturesPage() {
  const modules = [
    {
      title: 'Multi-Format Sequence Ingestion',
      detail:
        'Drag-and-drop upload for FASTA (.fasta, .fa), FASTQ (.fastq, .fq with Phred+33 quality decoding), and tabular CSV datasets up to 15 MB per file, stored in isolated user buckets.',
    },
    {
      title: 'Taxonomic Identification Engine',
      detail:
        'Resolves Kingdom, Phylum, Class, Order, Family, Genus, and Species with explicit similarity score, confidence score, reference database provenance, and status tagging.',
    },
    {
      title: 'Ecological Biodiversity Calculator',
      detail:
        'Calculates Species Richness (S), Shannon Diversity (H\'), Simpson Index (D), Gini-Simpson (1 - D), Pielou Evenness (J\'), and relative abundance charts.',
    },
    {
      title: 'Interactive Taxonomy Explorer',
      detail:
        'Filter sequences by Kingdom, Phylum, Class, Genus, or status and navigate a collapsible scientific taxonomic hierarchy tree across all user datasets.',
    },
    {
      title: 'Unknown Sequence & OTU Clustering',
      detail:
        'Clusters unclassified and potentially novel amplicon reads by k-mer similarity, displays length distributions, and highlights representative sequences for downstream verification.',
    },
    {
      title: 'Cross-Sample Community Comparison',
      detail:
        'Compares multiple environmental samples side-by-side with shared taxa heat tables, Shannon/richness bar plots, and pairwise Jaccard community similarity indices.',
    },
    {
      title: 'BioAI Scientific Assistant',
      detail:
        'Context-aware scientific chat connected to your analyzed PostgreSQL datasets to clarify ecological metrics, sample differences, and quality considerations.',
    },
    {
      title: 'Publication-Grade Report Exports',
      detail:
        'Generates downloadable PDF, CSV, and JSON reports covering dataset metadata, preprocessing metrics, taxonomy tables, biodiversity indices, limitations, and conclusions.',
    },
  ];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">
            Platform Capabilities
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#071B35] dark:text-white text-balance">
            Built for rigorous environmental DNA analysis
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every capability in DeepSea BioAI is backed by real database queries, deterministic
            bioinformatics algorithms, and strict per-researcher data isolation.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((m, idx) => (
            <div
              key={m.title}
              className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2.5"
            >
              <span className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">
                {String(idx + 1).padStart(2, '0')}.
              </span>
              <h2 className="text-lg font-semibold text-[#071B35] dark:text-white">{m.title}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {m.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <Link
            to="/register"
            className="inline-flex items-center px-5 py-3 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Start Analyzing eDNA Datasets
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}

export function HowItWorksPage() {
  const stages = [
    {
      step: 'Stage 1 — Sample Collection & Filtration',
      body: 'Environmental water, sediment, or soil samples are filtered through sterile membranes to capture cellular and extracellular DNA shed by local organisms.',
    },
    {
      step: 'Stage 2 — Amplicon Sequencing & Export',
      body: 'Targeted primers amplify taxonomic barcode markers such as mitochondrial COI, prokaryotic 16S rRNA, or eukaryotic 18S rRNA, producing FASTA, FASTQ, or tabular CSV sequence exports.',
    },
    {
      step: 'Stage 3 — Upload & Quality Preprocessing',
      body: 'Researchers upload sequence files with environmental metadata. DeepSea BioAI validates IUPAC nucleotide bases, computes sequence length and GC%, and decodes FASTQ Phred+33 quality scores.',
    },
    {
      step: 'Stage 4 — Taxonomic Classification & OTU Clustering',
      body: 'Each valid sequence is compared against the curated local marine reference library using 6-mer/4-mer similarity. High-confidence matches receive full taxonomic lineage; low-similarity sequences are clustered into candidate OTUs.',
    },
    {
      step: 'Stage 5 — Biodiversity Indices & Reporting',
      body: 'Shannon diversity (H\'), Simpson index (D and 1 - D), species richness, and Pielou evenness are computed automatically and made available for visualization, BioAI Assistant discussion, and PDF/CSV/JSON export.',
    },
  ];

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">How It Works</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#071B35] dark:text-white text-balance">
            Five stages from raw eDNA reads to ecological insight
          </h1>
        </header>

        <div className="space-y-4">
          {stages.map((s) => (
            <div
              key={s.step}
              className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2"
            >
              <h2 className="text-base font-semibold text-[#071B35] dark:text-white">{s.step}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}

export function ScientificWorkflowPage() {
  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16 space-y-12">
        <header className="max-w-3xl space-y-4">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">
            Scientific Workflow & Mathematical Definitions
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#071B35] dark:text-white text-balance">
            Transparent algorithms and ecological index formulas
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            DeepSea BioAI documents every similarity threshold, clustering rule, and ecological
            formula so researchers can audit results with full scientific clarity.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-5">
            <h2 className="text-lg font-semibold text-[#071B35] dark:text-white">
              Taxonomic Decision Thresholds
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-[#1B3A63] text-xs text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-4">Similarity Range</th>
                    <th className="py-2.5 pr-4">Assigned Status</th>
                    <th className="py-2.5">Taxonomic Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-[#1B3A63] text-slate-700 dark:text-slate-200">
                  <tr>
                    <td className="py-3 pr-4 font-mono tabular-nums">&ge; 82.0%</td>
                    <td className="py-3 pr-4 font-medium text-teal-700 dark:text-teal-300">Identified</td>
                    <td className="py-3">Full Kingdom through Species</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono tabular-nums">62.0% – 81.9%</td>
                    <td className="py-3 pr-4 font-medium text-sky-700 dark:text-sky-300">Partially identified</td>
                    <td className="py-3">Kingdom through Genus; Species = Unclassified</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono tabular-nums">38.0% – 61.9%</td>
                    <td className="py-3 pr-4 font-medium text-amber-700 dark:text-amber-300">Potentially novel sequence</td>
                    <td className="py-3">Kingdom/Phylum hint + OTU-UNK cluster ID</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-mono tabular-nums">&lt; 38.0%</td>
                    <td className="py-3 pr-4 font-medium text-slate-600 dark:text-slate-400">Unclassified</td>
                    <td className="py-3">All ranks Unclassified + OTU-UNK cluster ID</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-xl overflow-hidden border border-slate-200 dark:border-[#1B3A63]">
            <SafeImage
              src={SPECIMEN_IMG}
              alt="Deep-sea coral polyps and copepod marine fauna"
              className="w-full h-full object-cover min-h-[240px]"
            />
          </div>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2">
            <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
              Shannon Diversity Index (H&apos;)
            </h3>
            <p className="font-mono text-sm text-[#0A4C7A] dark:text-[#21D4FD]">
              H&apos; = -Σ (p_i × ln(p_i))
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Where p_i is the proportion of sequence reads assigned to taxon i. Higher values
              reflect both greater richness and more balanced relative abundance.
            </p>
          </div>
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2">
            <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
              Simpson Dominance (D) & Gini-Simpson (1 - D)
            </h3>
            <p className="font-mono text-sm text-[#0A4C7A] dark:text-[#21D4FD]">
              D = Σ (p_i²) · Diversity = 1 - D
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Measures dominance concentration. Gini-Simpson (1 - D) approaches 1.0 when two
              randomly drawn sequences are likely to belong to different taxa.
            </p>
          </div>
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2">
            <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
              Pielou&apos;s Evenness (J&apos;)
            </h3>
            <p className="font-mono text-sm text-[#0A4C7A] dark:text-[#21D4FD]">
              J&apos; = H&apos; / ln(S)
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Normalizes Shannon diversity by the maximum possible diversity for richness S. Values
              near 1.0 indicate even read distribution across detected taxa.
            </p>
          </div>
          <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-2">
            <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
              Important Ecological Caveat
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Relative read counts derived from environmental DNA reflect amplification efficiency,
              marker copy number, biomass, and environmental persistence. They must be interpreted
              as relative molecular abundance proxies rather than exact organism counts.
            </p>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        skipAuth: true,
        body: JSON.stringify({ name, email, institution, subject, message }),
      });
      setSuccess(true);
      setName('');
      setEmail('');
      setInstitution('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 space-y-10">
        <header className="space-y-3">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">Contact</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#071B35] dark:text-white">
            Reach the DeepSea BioAI Research Desk
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl">
            Questions about eDNA dataset formats, local reference libraries, or Problem Statement
            25042 demonstration workflows? Send a message below.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7 bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8">
            {success ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-teal-600 dark:text-teal-400 mx-auto" />
                <h2 className="text-lg font-semibold text-[#071B35] dark:text-white">
                  Inquiry Submitted
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your message has been recorded in the DeepSea BioAI support queue.
                </p>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="mt-2 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-[#1B3A63] text-slate-700 dark:text-slate-200"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <NotificationBanner type="error" message={error} />}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Institution or Organization (Optional)
                  </label>
                  <input
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm bg-slate-50 dark:bg-[#071B35] border border-slate-300 dark:border-[#1B3A63] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#071B35] text-white dark:bg-[#13B8A6] dark:text-[#061326] text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Sending...' : 'Submit Inquiry'}</span>
                </button>
              </form>
            )}
          </div>

          <div className="md:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 space-y-3 text-sm">
              <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
                Project Reference
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Problem Statement ID: <span className="font-mono font-medium">25042</span>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Title: Identifying Taxonomy and Assessing Biodiversity from eDNA Datasets
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Contact Placeholder:{' '}
                <span className="font-mono text-xs">research-desk@deepseabioai.example</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}

export function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">Legal & Governance</p>
          <h1 className="text-3xl font-bold text-[#071B35] dark:text-white">Privacy Policy</h1>
          <p className="text-xs text-slate-500">Last updated: November 2026</p>
        </header>
        <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8 space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              1. Account & Researcher Data
            </h2>
            <p>
              DeepSea BioAI collects your name, email address, optional institutional affiliation,
              and research interests strictly to authenticate your workspace and attribute your
              scientific reports. Passwords for email-based accounts are salted and hashed
              server-side using scrypt and are never stored in plaintext.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              2. Private eDNA Dataset Isolation
            </h2>
            <p>
              Uploaded FASTA, FASTQ, and CSV sequence datasets, taxonomy assignments, and
              biodiversity results are strictly scoped to the owning researcher&apos;s user ID on the
              server. Other users cannot view, query, or delete your datasets.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              3. AI Assistant Processing
            </h2>
            <p>
              When you ask BioAI Assistant a question, summarized statistical findings from your
              selected datasets are sent securely from our backend server to the Gemini API to
              generate grounded scientific explanations. API keys remain strictly server-side.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}

export function TermsPage() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-16 space-y-8">
        <header className="space-y-2">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD]">Legal & Governance</p>
          <h1 className="text-3xl font-bold text-[#071B35] dark:text-white">
            Terms and Conditions
          </h1>
          <p className="text-xs text-slate-500">Last updated: November 2026</p>
        </header>
        <div className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 sm:p-8 space-y-5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              1. Scientific Prototype Scope
            </h2>
            <p>
              DeepSea BioAI is developed for Problem Statement ID 25042 (Identifying Taxonomy and
              Assessing Biodiversity from eDNA Datasets). Taxonomic classifications generated by the
              local curated marker library should be corroborated against peer-reviewed databases
              (such as NCBI GenBank or BOLD) prior to regulatory or clinical use.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              2. Acceptable Use & Account Security
            </h2>
            <p>
              Researchers agree to upload only lawful biological sequence files (FASTA, FASTQ, CSV)
              within platform limits and to refrain from attempting unauthorized access to other
              accounts or restricted administrative routes.
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-[#071B35] dark:text-white">
              3. Data Ownership
            </h2>
            <p>
              Researchers retain full ownership of uploaded environmental DNA files and generated
              scientific reports, and may delete their datasets from the platform at any time.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
