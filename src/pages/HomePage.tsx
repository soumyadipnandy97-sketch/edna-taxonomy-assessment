import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Dna,
  FileText,
  Layers,
  MessageSquare,
  SearchCheck,
} from 'lucide-react';
import { PublicLayout } from '../components/PublicLayout';
import { SafeImage } from '../components/UI';
import { useAuth } from '../contexts/AuthContext';

const HERO_IMG = '/src/assets/images/hero_deepsea_edna_1795609526157.jpg';
const SAMPLING_IMG = '/src/assets/images/workflow_ocean_sampling_1795609531297.jpg';
const SPECIMEN_IMG = '/src/assets/images/specimen_coral_edna_1795609530611.jpg';

const FEATURES = [
  {
    icon: Dna,
    title: 'Taxonomic Identification',
    description:
      'Aligns parsed FASTA, FASTQ, and CSV amplicon reads against curated marine COI, 16S, and 18S marker sequences across the full Kingdom-to-Species hierarchy.',
  },
  {
    icon: BarChart3,
    title: 'Biodiversity Assessment',
    description:
      'Computes Species Richness, Shannon Diversity (H\'), Simpson Dominance (D), Gini-Simpson (1 - D), Pielou Evenness (J\'), and relative abundance profiles directly from database results.',
  },
  {
    icon: SearchCheck,
    title: 'Unknown Sequence Detection',
    description:
      'Isolates low-similarity reads, clusters divergent sequences into candidate operational taxonomic units (OTUs), and reports length distributions without fabricating species names.',
  },
  {
    icon: MessageSquare,
    title: 'AI Scientific Insights',
    description:
      'BioAI Assistant interprets your actual PostgreSQL analysis results—explaining biodiversity indices, sample contrasts, and ecological patterns with transparent methodological caveats.',
  },
  {
    icon: Layers,
    title: 'Interactive Visualizations',
    description:
      'Explore taxonomic distribution charts, hierarchical Kingdom-to-Species trees, classified versus unclassified breakdowns, and multi-sample Jaccard community comparisons.',
  },
  {
    icon: FileText,
    title: 'Scientific Report Generation',
    description:
      'Export publication-ready scientific reports in PDF, CSV, and JSON containing preprocessing metrics, biodiversity indices, relative abundance tables, and explicit study limitations.',
  },
];

const PIPELINE_STEPS = [
  {
    num: '01',
    title: 'Environmental Sample',
    detail: 'Water, sediment, or soil filtration captures trace genetic material shed by organisms.',
  },
  {
    num: '02',
    title: 'DNA Sequencing',
    detail: 'Amplicon or metabarcoding sequencing targets COI, 16S rRNA, or 18S rRNA marker regions.',
  },
  {
    num: '03',
    title: 'Dataset Upload',
    detail: 'Researchers upload validated FASTA, FASTQ, or CSV sequence datasets with collection metadata.',
  },
  {
    num: '04',
    title: 'Sequence Processing',
    detail: 'Automated base validation, Phred quality parsing, GC-content scoring, and length profiling.',
  },
  {
    num: '05',
    title: 'Taxonomic Identification',
    detail: 'Multi-scale k-mer similarity scoring assigns taxonomy or flags divergent OTU clusters.',
  },
  {
    num: '06',
    title: 'Biodiversity Analysis',
    detail: 'Calculates Shannon, Simpson, richness, evenness, and cross-sample community overlap.',
  },
  {
    num: '07',
    title: 'Scientific Report',
    detail: 'Compiles reproducible PDF, CSV, and JSON reports grounded in verified analysis outputs.',
  },
];

export function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <PublicLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#071B35] text-white border-b border-[#16365E]">
        <div className="absolute inset-0">
          <SafeImage
            src={HERO_IMG}
            alt="Deep-sea environmental DNA strands and pelagic marine biodiversity"
            className="w-full h-full object-cover object-right opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#071B35] via-[#071B35]/90 to-[#071B35]/35" />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 py-24 lg:py-32">
          <div className="max-w-2xl space-y-6">
            <p className="text-xs font-mono tracking-wide text-[#21D4FD]">
              Problem Statement ID 25042 · Environmental DNA Bioinformatics Platform
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white text-balance leading-[1.08]">
              DeepSea BioAI
            </h1>
            <p className="text-xl sm:text-2xl font-medium text-cyan-100 text-balance">
              Discover Life Through Environmental DNA
            </p>
            <p className="text-base text-slate-300 leading-relaxed max-w-xl">
              An intelligent eDNA analysis platform that helps researchers identify organisms,
              understand biodiversity, and explore hidden biological diversity through DNA-based
              environmental analysis.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3.5">
              <Link
                to={isAuthenticated ? '/dashboard/upload' : '/register'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#13B8A6] text-[#061326] font-semibold text-sm hover:bg-[#21D4FD] transition-colors whitespace-nowrap shrink-0"
              >
                <span>Start Analysis</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to={isAuthenticated ? '/dashboard' : '/login'}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 text-white border border-white/20 font-medium text-sm hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
              >
                <span>Explore Dashboard</span>
              </Link>
              <Link
                to="/scientific-workflow"
                className="inline-flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-cyan-200 hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>Learn More</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Strip — 6 Core Modules */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD] mb-2">
            Analytical Modules
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-[#071B35] dark:text-white text-balance">
            End-to-end bioinformatics for environmental DNA research
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            Built for marine ecologists, molecular biologists, and conservation teams who need
            transparent sequence classification, ecological diversity indices, and reproducible
            documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="bg-white dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-6 flex flex-col gap-3"
              >
                <div className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-[#133058] text-[#0A4C7A] dark:text-[#21D4FD] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-[#071B35] dark:text-white">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works — 7-Stage Pipeline + Documentary Field Imagery */}
      <section className="bg-white dark:bg-[#071B35] border-y border-slate-200 dark:border-[#17345A]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-20 lg:py-24 space-y-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              <div>
                <p className="text-xs font-mono text-[#0A4C7A] dark:text-[#21D4FD] mb-2">
                  How It Works
                </p>
                <h2 className="text-3xl font-bold tracking-tight text-[#071B35] dark:text-white text-balance">
                  From ocean water filtration to reproducible biodiversity reports
                </h2>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
                  Every uploaded FASTA, FASTQ, or CSV file passes through deterministic sequence
                  parsing, local marker alignment, OTU clustering for divergent reads, and exact
                  ecological index computation stored in PostgreSQL.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#1B3A63] aspect-[4/3]">
                  <SafeImage
                    src={SAMPLING_IMG}
                    alt="Oceanographic CTD Niskin water sampler deployed from a research vessel"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-[#1B3A63] aspect-[4/3]">
                  <SafeImage
                    src={SPECIMEN_IMG}
                    alt="Deep-sea cold-water coral polyps and marine copepods"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PIPELINE_STEPS.map((step) => (
                <div
                  key={step.num}
                  className="bg-slate-50 dark:bg-[#0C2342] border border-slate-200 dark:border-[#1B3A63] rounded-xl p-5 flex flex-col gap-1.5"
                >
                  <span className="text-xs font-mono font-semibold text-[#0A4C7A] dark:text-[#21D4FD] tabular-nums">
                    {step.num}. {step.title}
                  </span>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {step.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scientific Integrity & Call to Action */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="bg-[#071B35] text-white rounded-2xl border border-[#16365E] p-8 sm:p-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs font-mono text-[#21D4FD]">
              Methodological Transparency
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Grounded statistics. Zero fabricated taxa.
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              DeepSea BioAI never invents species names for low-similarity reads, explicitly
              distinguishes relative eDNA read abundance from organism population counts, and keeps
              every researcher&apos;s datasets privately scoped in PostgreSQL.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              to="/register"
              className="px-5 py-3 rounded-lg bg-[#13B8A6] text-[#061326] font-semibold text-sm hover:bg-[#21D4FD] transition-colors whitespace-nowrap"
            >
              Create Researcher Account
            </Link>
            <Link
              to="/about"
              className="px-5 py-3 rounded-lg border border-white/20 text-white text-sm font-medium hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Read Methodology
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
