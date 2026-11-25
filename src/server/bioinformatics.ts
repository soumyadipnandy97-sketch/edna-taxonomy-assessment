export interface ParsedSequence {
  sequenceId: string;
  dnaSequence: string;
  sequenceLength: number;
  qualityScore: number | null;
  gcContent: number;
}

export interface ParseSummary {
  sequences: ParsedSequence[];
  totalRawRecords: number;
  filteredOut: number;
  meanLength: number;
  meanGcContent: number;
  meanQuality: number | null;
  format: 'FASTA' | 'FASTQ' | 'CSV';
}

export interface TaxonomicReference {
  refId: string;
  marker: string;
  kingdom: string;
  phylum: string;
  className: string;
  orderName: string;
  family: string;
  genus: string;
  species: string;
  habitat: string;
  sequence: string;
}

export interface TaxonomyMatchResult {
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
  identificationStatus:
    | 'Identified'
    | 'Partially identified'
    | 'Unclassified'
    | 'Potentially novel sequence';
  referenceDatabase: string;
  clusterId: string | null;
}

export interface BiodiversitySummary {
  speciesRichness: number;
  identifiedSpeciesCount: number;
  novelOtuCount: number;
  shannonIndex: number;
  simpsonIndex: number;
  simpsonDiversity: number;
  evenness: number;
  totalSequences: number;
  classifiedCount: number;
  unclassifiedCount: number;
  relativeAbundance: Array<{
    taxon: string;
    kingdom: string;
    phylum: string;
    count: number;
    relativeAbundancePct: number;
    status: string;
  }>;
  clusterSummary: Array<{
    clusterId: string;
    sequenceCount: number;
    avgLength: number;
    avgSimilarity: number;
    representativeSeqId: string;
    classificationNote: string;
  }>;
  lengthDistribution: Array<{
    range: string;
    count: number;
  }>;
}

export const REFERENCE_DATABASE_NAME =
  'DeepSea Local Reference DB v1.0 (Curated Marine COI/16S/18S)';

// Curated local marine eDNA marker reference set (distinct 120bp signatures for deterministic k-mer classification)
export const MARINE_REFERENCE_DB: TaxonomicReference[] = [
  {
    refId: 'DSR-COI-001',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Arthropoda',
    className: 'Copepoda',
    orderName: 'Calanoida',
    family: 'Calanidae',
    genus: 'Calanus',
    species: 'Calanus finmarchicus',
    habitat: 'Pelagic North Atlantic',
    sequence:
      'GGTCAACAAATCATAAAGATATTGGTACTCTCTATTTAATCTTTGGTGCTTGGGCTGGTATGGTAGGTACTTCTCTAAGAATCTTAATTCGAGCTGAACTAGGTCAGCCTGGTTCTTTAATT',
  },
  {
    refId: 'DSR-COI-002',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Arthropoda',
    className: 'Malacostraca',
    orderName: 'Euphausiacea',
    family: 'Euphausiidae',
    genus: 'Euphausia',
    species: 'Euphausia superba',
    habitat: 'Southern Ocean Pelagic',
    sequence:
      'AACTTTATATTTTATCTTCGGGGCTTGATCAGGAATGATTGGCACTTCCCTAAGTTTACTAATTCGAGCAGAACTTGGCCAACCCGGTTCCCTGATTGGAGACGATCAAATTTACAATGTTA',
  },
  {
    refId: 'DSR-COI-003',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Cnidaria',
    className: 'Anthozoa',
    orderName: 'Scleractinia',
    family: 'Caryophylliidae',
    genus: 'Desmophyllum',
    species: 'Desmophyllum pertusum',
    habitat: 'Cold-Water Deep Coral Reef',
    sequence:
      'TCTACTAACCATAAGGACATTGGCACCCTCTATATGATTTTTGGTTTCTGTTCTGGGATGGTCGGGACCGCTATGAGTATGATTATCCGTCTGGAGCTGTCTGCCCCTGGATCAATGCTTGG',
  },
  {
    refId: 'DSR-COI-004',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Cnidaria',
    className: 'Scyphozoa',
    orderName: 'Semaeostomeae',
    family: 'Pelagiidae',
    genus: 'Pelagia',
    species: 'Pelagia noctiluca',
    habitat: 'Mesopelagic Open Ocean',
    sequence:
      'GCTACCACCATAAAGACATTGGAACTTTATATTTTGTATTTGGGGTTTGGTCGGGCCTTATTGGCACATCAATGAGCATCATTATTCGAATGGAATTATCAAGTCCAGGGTCGTTGCTTGGT',
  },
  {
    refId: 'DSR-COI-005',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Mollusca',
    className: 'Bivalvia',
    orderName: 'Mytilida',
    family: 'Mytilidae',
    genus: 'Bathymodiolus',
    species: 'Bathymodiolus thermophilus',
    habitat: 'Hydrothermal Vent',
    sequence:
      'CCTATTTTACTTCCTGTTTGGGATTTGAGCTGGTCTTGTGGGAACCTCTTTAAGTTTAATTATTCGTGTTGAGTTGAGACAACCTGGATCTTTTTTAGGGGATGACCAACTATATAATGTTG',
  },
  {
    refId: 'DSR-COI-006',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Mollusca',
    className: 'Cephalopoda',
    orderName: 'Vampyromorphida',
    family: 'Vampyroteuthidae',
    genus: 'Vampyroteuthis',
    species: 'Vampyroteuthis infernalis',
    habitat: 'Bathypelagic Oxygen Minimum Zone',
    sequence:
      'TTACTTTATTTGATCTTTGGTGCCTGAGCTGGAATGGTAGGGACTTCTTTGAGTATACTCATTCGAATCGAGCTAGGACATCCTGGTAGTTTACTAGGAGATGACCAGATTTACAACGTCAT',
  },
  {
    refId: 'DSR-COI-007',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Chordata',
    className: 'Actinopterygii',
    orderName: 'Gadiformes',
    family: 'Gadidae',
    genus: 'Gadus',
    species: 'Gadus morhua',
    habitat: 'Continental Shelf Marine',
    sequence:
      'CCTCTACCTAATCTTCGGTGCCTGAGCCGGAATAGTAGGCACCGCCTTAAGCCTTCTCATTCGGGCAGAACTAAGCCAACCCGGCGCCCTTCTGGGCGACGACCAGATCTATAATGTAATCG',
  },
  {
    refId: 'DSR-COI-008',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Chordata',
    className: 'Actinopterygii',
    orderName: 'Scombriformes',
    family: 'Scombridae',
    genus: 'Thunnus',
    species: 'Thunnus albacares',
    habitat: 'Epipelagic Tropical Ocean',
    sequence:
      'TCTCTACCTTGTATTTGGTGCATGAGCCGGGATAGTGGGTACTGCTCTAAGCCTCCTTATCCGGGCCGAGCTGAGCCAGCCAGGAGCTCTCCTAGGAGATGATCAAATCTATAACGTAATTG',
  },
  {
    refId: 'DSR-COI-009',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Chordata',
    className: 'Actinopterygii',
    orderName: 'Myctophiformes',
    family: 'Myctophidae',
    genus: 'Benthosema',
    species: 'Benthosema glaciale',
    habitat: 'Mesopelagic Deep Scattering Layer',
    sequence:
      'ACTCTACTTGCTGTTCGGTGCTTGAGCAGGCATGGTGGGCACCGCCCTCAGCCTACTAATCCGGGCCGAACTAGGGCAGCCCGGCGCACTACTTGGTGACGACCAAATCTACAACGTCATTG',
  },
  {
    refId: 'DSR-COI-010',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Annelida',
    className: 'Polychaeta',
    orderName: 'Sabellida',
    family: 'Siboglinidae',
    genus: 'Riftia',
    species: 'Riftia pachyptila',
    habitat: 'Deep-Sea Hydrothermal Vent',
    sequence:
      'GGTCCACCATAAAGATATCGGCACATTATACTTCATTTTCGGGGCATGGGCTGGTATGGTAGGCACAGGTTTAAGCATGATTATTCGAGCTGAATTAGGACAGCCCGGATCTTTTATTGGCG',
  },
  {
    refId: 'DSR-COI-011',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Echinodermata',
    className: 'Echinoidea',
    orderName: 'Camarodonta',
    family: 'Strongylocentrotidae',
    genus: 'Strongylocentrotus',
    species: 'Strongylocentrotus purpuratus',
    habitat: 'Subtidal Benthic',
    sequence:
      'CCTAATCTTTGGAGCATGAGCTGGAATGATTGGGACTGCTATGAGTGTTATTATCCGAATCGAATTAGCACAGCCTGGTTCCTTTATGGGAGATGACCAACTATATAATGTAATTGTTACCG',
  },
  {
    refId: 'DSR-16S-012',
    marker: '16S rRNA',
    kingdom: 'Bacteria',
    phylum: 'Cyanobacteria',
    className: 'Cyanophyceae',
    orderName: 'Synechococcales',
    family: 'Prochlorococcaceae',
    genus: 'Prochlorococcus',
    species: 'Prochlorococcus marinus',
    habitat: 'Oligotrophic Open Ocean',
    sequence:
      'AGAGTTTGATCCTGGCTCAGGATGAACGCTGGCGGTATGCTTAACACATGCAAGTCGAACGGACTCTTCGGAGTTAGTGGCGGACGGGTGAGTAACGCGTGAGAATCTGCCTTCAGGAGGGG',
  },
  {
    refId: 'DSR-16S-013',
    marker: '16S rRNA',
    kingdom: 'Bacteria',
    phylum: 'Pseudomonadota',
    className: 'Alphaproteobacteria',
    orderName: 'Pelagibacterales',
    family: 'Pelagibacteraceae',
    genus: 'Pelagibacter',
    species: 'Pelagibacter ubique',
    habitat: 'Global Surface Seawater',
    sequence:
      'TGAACGCTGGCGGCAGGCTTAACACATGCAAGTCGAGCGCCCTTAGGGGAGCGGCAGACGGGTGAGTAACACGTGGGAATCTACCCATAGGTACGGAATAACAGTTAGAAATGACTGCTAAT',
  },
  {
    refId: 'DSR-16S-014',
    marker: '16S rRNA',
    kingdom: 'Archaea',
    phylum: 'Nitrososphaerota',
    className: 'Nitrososphaeria',
    orderName: 'Nitrosopumilales',
    family: 'Nitrosopumilaceae',
    genus: 'Nitrosopumilus',
    species: 'Nitrosopumilus maritimus',
    habitat: 'Mesopelagic Ammonia-Oxidizing Zone',
    sequence:
      'TCCGGTTGATCCTGCCGGAGGCCATTGCTATCGGGGTCCGATTTAGCCATGCTAGTTGCACGAGTTCAGACTCGTGGCAGACAGCTCAGTAACACGTGGCCAACCTACCCTCGGGACGAGAT',
  },
  {
    refId: 'DSR-18S-015',
    marker: '18S rRNA',
    kingdom: 'Chromista',
    phylum: 'Haptophyta',
    className: 'Coccolithophyceae',
    orderName: 'Isochrysidales',
    family: 'Noelaerhabdaceae',
    genus: 'Emiliania',
    species: 'Emiliania huxleyi',
    habitat: 'Photic Marine Bloom',
    sequence:
      'AACCTGGTTGATCCTGCCAGTAGTCATATGCTTGTCTCAAAGATTAAGCCATGCATGTCTAAGTATAAGCGTTTGTACTGTGAAACTGCGAATGGCTCATTAAATCAGTTATAGTTTATTTG',
  },
  {
    refId: 'DSR-18S-016',
    marker: '18S rRNA',
    kingdom: 'Chromista',
    phylum: 'Bacillariophyta',
    className: 'Mediophyceae',
    orderName: 'Chaetocerotales',
    family: 'Chaetocerotaceae',
    genus: 'Chaetoceros',
    species: 'Chaetoceros socialis',
    habitat: 'Coastal Upwelling Phytoplankton',
    sequence:
      'GTAGTCATATGCTTGTCTCAAAGACTAAGCCATGCATGTCTAAGTATAAACGACTTTATACTGTGAAACTGCGAACGGCTCATTATATCAGTTATAGTTTCTTTGATGGTACCTTACTACTT',
  },
  {
    refId: 'DSR-18S-017',
    marker: '18S rRNA',
    kingdom: 'Chromista',
    phylum: 'Dinoflagellata',
    className: 'Dinophyceae',
    orderName: 'Gonyaulacales',
    family: 'Ceratiaceae',
    genus: 'Tripos',
    species: 'Tripos muelleri',
    habitat: 'Pelagic Marine Microplankton',
    sequence:
      'TGGTTGATCCTGCCAGTAGTCATATGCTTGTCTCAAAGATTAAGCCATGCATGTGTAAGTATAGTCGAACTTAACTGTGAAACTGCGAATGGCTCATTAAAACAGTTATAGTTTATTTGATA',
  },
  {
    refId: 'DSR-COI-018',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Chordata',
    className: 'Mammalia',
    orderName: 'Artiodactyla',
    family: 'Delphinidae',
    genus: 'Tursiops',
    species: 'Tursiops truncatus',
    habitat: 'Coastal & Pelagic Marine',
    sequence:
      'TTCATCAACCGCTGACTATTCTCAACCAACCACAAAGACATCGGCACCCTGTACCTACTATTCGGCGCTTGAGCTGGAATAGTGGGCACCGCCCTGAGTCTCCTAATCCGCGCAGAACTGGG',
  },
  {
    refId: 'DSR-16S-019',
    marker: '16S rRNA',
    kingdom: 'Bacteria',
    phylum: 'Campylobacterota',
    className: 'Campylobacteria',
    orderName: 'Campylobacterales',
    family: 'Sulfurovaceae',
    genus: 'Sulfurovum',
    species: 'Sulfurovum lithotrophicum',
    habitat: 'Hydrothermal Vent Plume',
    sequence:
      'GATCCTGGCTCAGAGTGAACGCTGGCGGCGTGCCTAATACATGCAAGTCGAACGGAGCACTACTTCGGTAGTGCTAGTGGCGCACGGGTGAGTAACGCATAGATAACCTGCCCTTAGGTCGG',
  },
  {
    refId: 'DSR-COI-020',
    marker: 'COI',
    kingdom: 'Animalia',
    phylum: 'Mollusca',
    className: 'Cephalopoda',
    orderName: 'Octopoda',
    family: 'Octopodidae',
    genus: 'Octopus',
    species: 'Octopus vulgaris',
    habitat: 'Benthic Continental Shelf',
    sequence:
      'ATTTTACTTTATTTTTGGAGCATGATCAGGAATAGTAGGTACATCTTTAAGTATTTTAATTCGAGCAGAATTAGGCCAACCAGGAACTTTATTAGGAGATGATCAAATTTATAATGTAATTG',
  },
];

function computeGcContent(seq: string): number {
  if (!seq.length) return 0;
  let gc = 0;
  for (let i = 0; i < seq.length; i++) {
    const ch = seq[i];
    if (ch === 'G' || ch === 'C') gc++;
  }
  return Number(((gc / seq.length) * 100).toFixed(2));
}

function cleanDna(raw: string): string {
  return raw.toUpperCase().replace(/[^ACGTN]/g, '');
}

function decodePhred33Mean(qualStr: string): number {
  if (!qualStr.length) return 30;
  let sum = 0;
  for (let i = 0; i < qualStr.length; i++) {
    sum += Math.max(0, qualStr.charCodeAt(i) - 33);
  }
  return Number((sum / qualStr.length).toFixed(2));
}

export function parseSequenceFile(
  content: string,
  filename: string,
  explicitFormat?: string
): ParseSummary {
  const ext = filename.toLowerCase().split('.').pop() || '';
  let format: 'FASTA' | 'FASTQ' | 'CSV' = 'FASTA';

  if (explicitFormat && ['FASTA', 'FASTQ', 'CSV'].includes(explicitFormat.toUpperCase())) {
    format = explicitFormat.toUpperCase() as 'FASTA' | 'FASTQ' | 'CSV';
  } else if (ext === 'fastq' || ext === 'fq') {
    format = 'FASTQ';
  } else if (ext === 'csv') {
    format = 'CSV';
  } else {
    const trimmed = content.trim();
    if (trimmed.startsWith('@')) format = 'FASTQ';
    else if (trimmed.startsWith('>')) format = 'FASTA';
    else if (trimmed.includes(',')) format = 'CSV';
  }

  const sequences: ParsedSequence[] = [];
  let totalRawRecords = 0;
  let filteredOut = 0;
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  if (format === 'FASTA') {
    let currentId = '';
    let currentSeqParts: string[] = [];

    const flush = () => {
      if (!currentId && currentSeqParts.length === 0) return;
      totalRawRecords++;
      const seq = cleanDna(currentSeqParts.join(''));
      if (seq.length >= 20) {
        sequences.push({
          sequenceId: currentId || `SEQ_${totalRawRecords}`,
          dnaSequence: seq,
          sequenceLength: seq.length,
          qualityScore: null,
          gcContent: computeGcContent(seq),
        });
      } else {
        filteredOut++;
      }
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;
      if (line.startsWith('>')) {
        flush();
        currentId = line.slice(1).trim().split(/\s+/)[0] || `SEQ_${totalRawRecords + 1}`;
        currentSeqParts = [];
      } else {
        currentSeqParts.push(line);
      }
    }
    flush();
  } else if (format === 'FASTQ') {
    const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i + 3 < nonEmpty.length; i += 4) {
      const header = nonEmpty[i];
      const seqLine = nonEmpty[i + 1];
      const qualLine = nonEmpty[i + 3];
      if (!header.startsWith('@')) continue;
      totalRawRecords++;
      const seq = cleanDna(seqLine);
      const qScore = decodePhred33Mean(qualLine);
      if (seq.length >= 20) {
        sequences.push({
          sequenceId: header.slice(1).trim().split(/\s+/)[0] || `READ_${totalRawRecords}`,
          dnaSequence: seq,
          sequenceLength: seq.length,
          qualityScore: qScore,
          gcContent: computeGcContent(seq),
        });
      } else {
        filteredOut++;
      }
    }
  } else {
    // CSV parser
    const nonEmpty = lines.map((l) => l.trim()).filter(Boolean);
    if (nonEmpty.length > 0) {
      const firstCols = nonEmpty[0].split(',').map((c) => c.trim().replace(/^"|"$/g, '').toLowerCase());
      const hasHeader =
        firstCols.some((c) => c.includes('seq') || c.includes('id') || c.includes('dna') || c.includes('read'));
      const startIdx = hasHeader ? 1 : 0;

      let idCol = 0;
      let seqCol = 1;
      let qualCol = -1;

      if (hasHeader) {
        const foundId = firstCols.findIndex((c) => c.includes('id') || c.includes('name'));
        const foundSeq = firstCols.findIndex((c) => c.includes('dna') || c.includes('sequence') || c === 'seq');
        const foundQual = firstCols.findIndex((c) => c.includes('qual') || c.includes('phred'));
        if (foundId >= 0) idCol = foundId;
        if (foundSeq >= 0) seqCol = foundSeq;
        else if (idCol === 0) seqCol = 1;
        if (foundQual >= 0) qualCol = foundQual;
      }

      for (let i = startIdx; i < nonEmpty.length; i++) {
        const cols = nonEmpty[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 2) continue;
        totalRawRecords++;
        const seqId = cols[idCol] || `CSV_SEQ_${totalRawRecords}`;
        const seq = cleanDna(cols[seqCol] || '');
        const qual = qualCol >= 0 && cols[qualCol] ? Number.parseFloat(cols[qualCol]) : null;
        if (seq.length >= 20) {
          sequences.push({
            sequenceId: seqId,
            dnaSequence: seq,
            sequenceLength: seq.length,
            qualityScore: qual !== null && !Number.isNaN(qual) ? qual : null,
            gcContent: computeGcContent(seq),
          });
        } else {
          filteredOut++;
        }
      }
    }
  }

  const capped = sequences.slice(0, 2000);
  const meanLength =
    capped.length > 0
      ? Number((capped.reduce((acc, s) => acc + s.sequenceLength, 0) / capped.length).toFixed(1))
      : 0;
  const meanGcContent =
    capped.length > 0
      ? Number((capped.reduce((acc, s) => acc + s.gcContent, 0) / capped.length).toFixed(2))
      : 0;
  const withQual = capped.filter((s) => s.qualityScore !== null);
  const meanQuality =
    withQual.length > 0
      ? Number(
          (withQual.reduce((acc, s) => acc + (s.qualityScore || 0), 0) / withQual.length).toFixed(2)
        )
      : null;

  return {
    sequences: capped,
    totalRawRecords,
    filteredOut,
    meanLength,
    meanGcContent,
    meanQuality,
    format,
  };
}

function extractKmers(seq: string, k = 6): Set<string> {
  const kmers = new Set<string>();
  if (seq.length < k) return kmers;
  for (let i = 0; i <= seq.length - k; i++) {
    const kmer = seq.slice(i, i + k);
    if (!kmer.includes('N')) kmers.add(kmer);
  }
  return kmers;
}

function computeKmerSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  const smaller = setA.size <= setB.size ? setA : setB;
  const larger = setA.size <= setB.size ? setB : setA;
  for (const kmer of smaller) {
    if (larger.has(kmer)) intersection++;
  }
  // Sorensen-Dice / containment blend works well for partial amplicon reads vs reference barcodes
  const containment = intersection / smaller.size;
  const jaccard = intersection / (setA.size + setB.size - intersection);
  return 0.65 * containment + 0.35 * jaccard;
}

const PRECOMPUTED_REF_KMERS = MARINE_REFERENCE_DB.map((ref) => ({
  ref,
  kmers6: extractKmers(ref.sequence, 6),
  kmers4: extractKmers(ref.sequence, 4),
}));

export function classifySequences(
  seqs: Array<{ sequenceId: string; dnaSequence: string; sequenceLength: number; qualityScore?: number | null }>
): { results: TaxonomyMatchResult[]; biodiversity: BiodiversitySummary } {
  const results: TaxonomyMatchResult[] = [];
  const unknownEntries: Array<{
    idx: number;
    seqId: string;
    length: number;
    similarity: number;
    kmers5: Set<string>;
  }> = [];

  for (let i = 0; i < seqs.length; i++) {
    const seq = seqs[i];
    const queryK6 = extractKmers(seq.dnaSequence, 6);
    const queryK4 = extractKmers(seq.dnaSequence, 4);

    let bestRef: TaxonomicReference | null = null;
    let bestScore = 0;

    for (const candidate of PRECOMPUTED_REF_KMERS) {
      const sim6 = computeKmerSimilarity(queryK6, candidate.kmers6);
      const sim4 = computeKmerSimilarity(queryK4, candidate.kmers4);
      const combined = 0.8 * sim6 + 0.2 * sim4;
      if (combined > bestScore) {
        bestScore = combined;
        bestRef = candidate.ref;
      }
    }

    const similarityPct = Number((bestScore * 100).toFixed(2));
    const qualFactor = seq.qualityScore ? Math.min(1, seq.qualityScore / 35) : 0.94;
    const lenFactor = Math.min(1, seq.sequenceLength / 100);
    const confidencePct = Number(
      Math.min(99.8, Math.max(5, similarityPct * (0.85 + 0.15 * qualFactor * lenFactor))).toFixed(2)
    );

    if (bestRef && similarityPct >= 82) {
      results.push({
        sequenceId: seq.sequenceId,
        kingdom: bestRef.kingdom,
        phylum: bestRef.phylum,
        className: bestRef.className,
        orderName: bestRef.orderName,
        family: bestRef.family,
        genus: bestRef.genus,
        species: bestRef.species,
        similarityScore: similarityPct,
        confidenceScore: confidencePct,
        identificationStatus: 'Identified',
        referenceDatabase: REFERENCE_DATABASE_NAME,
        clusterId: null,
      });
    } else if (bestRef && similarityPct >= 62) {
      results.push({
        sequenceId: seq.sequenceId,
        kingdom: bestRef.kingdom,
        phylum: bestRef.phylum,
        className: bestRef.className,
        orderName: bestRef.orderName,
        family: bestRef.family,
        genus: bestRef.genus,
        species: 'Unclassified',
        similarityScore: similarityPct,
        confidenceScore: Number((confidencePct * 0.85).toFixed(2)),
        identificationStatus: 'Partially identified',
        referenceDatabase: REFERENCE_DATABASE_NAME,
        clusterId: null,
      });
    } else if (bestRef && similarityPct >= 38) {
      results.push({
        sequenceId: seq.sequenceId,
        kingdom: bestRef.kingdom,
        phylum: bestRef.phylum,
        className: 'Unclassified',
        orderName: 'Unclassified',
        family: 'Unclassified',
        genus: 'Unclassified',
        species: 'Unclassified',
        similarityScore: similarityPct,
        confidenceScore: Number((confidencePct * 0.65).toFixed(2)),
        identificationStatus: 'Potentially novel sequence',
        referenceDatabase: REFERENCE_DATABASE_NAME,
        clusterId: null,
      });
      unknownEntries.push({
        idx: i,
        seqId: seq.sequenceId,
        length: seq.sequenceLength,
        similarity: similarityPct,
        kmers5: extractKmers(seq.dnaSequence, 5),
      });
    } else {
      results.push({
        sequenceId: seq.sequenceId,
        kingdom: 'Unclassified',
        phylum: 'Unclassified',
        className: 'Unclassified',
        orderName: 'Unclassified',
        family: 'Unclassified',
        genus: 'Unclassified',
        species: 'Unclassified',
        similarityScore: similarityPct,
        confidenceScore: Number((confidencePct * 0.5).toFixed(2)),
        identificationStatus: 'Unclassified',
        referenceDatabase: REFERENCE_DATABASE_NAME,
        clusterId: null,
      });
      unknownEntries.push({
        idx: i,
        seqId: seq.sequenceId,
        length: seq.sequenceLength,
        similarity: similarityPct,
        kmers5: extractKmers(seq.dnaSequence, 5),
      });
    }
  }

  // Greedy k-mer centroid clustering for unclassified & potentially novel sequences
  const clusters: Array<{
    clusterId: string;
    centroidKmers: Set<string>;
    representativeSeqId: string;
    members: typeof unknownEntries;
  }> = [];

  for (const item of unknownEntries) {
    let assigned = false;
    for (const cluster of clusters) {
      const sim = computeKmerSimilarity(item.kmers5, cluster.centroidKmers);
      if (sim >= 0.45) {
        cluster.members.push(item);
        results[item.idx].clusterId = cluster.clusterId;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const clusterId = `OTU-UNK-${String(clusters.length + 1).padStart(3, '0')}`;
      clusters.push({
        clusterId,
        centroidKmers: item.kmers5,
        representativeSeqId: item.seqId,
        members: [item],
      });
      results[item.idx].clusterId = clusterId;
    }
  }

  // Biodiversity calculations across operational taxonomic units (identified species, partial genus, or novel OTU cluster)
  const taxonCounts = new Map<
    string,
    { taxon: string; kingdom: string; phylum: string; count: number; status: string }
  >();
  const identifiedSpeciesSet = new Set<string>();
  let classifiedCount = 0;
  let unclassifiedCount = 0;

  for (const r of results) {
    if (r.identificationStatus === 'Identified') {
      classifiedCount++;
      identifiedSpeciesSet.add(r.species);
      const key = r.species;
      const prev = taxonCounts.get(key);
      if (prev) prev.count++;
      else
        taxonCounts.set(key, {
          taxon: r.species,
          kingdom: r.kingdom,
          phylum: r.phylum,
          count: 1,
          status: 'Identified',
        });
    } else if (r.identificationStatus === 'Partially identified') {
      classifiedCount++;
      const key = `${r.genus} sp. (Partial)`;
      const prev = taxonCounts.get(key);
      if (prev) prev.count++;
      else
        taxonCounts.set(key, {
          taxon: key,
          kingdom: r.kingdom,
          phylum: r.phylum,
          count: 1,
          status: 'Partially identified',
        });
    } else {
      unclassifiedCount++;
      const key = r.clusterId || 'Unclassified';
      const prev = taxonCounts.get(key);
      if (prev) prev.count++;
      else
        taxonCounts.set(key, {
          taxon: key,
          kingdom: r.kingdom,
          phylum: r.phylum,
          count: 1,
          status: r.identificationStatus,
        });
    }
  }

  const totalSequences = results.length;
  const speciesRichness = taxonCounts.size;

  let shannon = 0;
  let simpsonD = 0;

  if (totalSequences > 0 && speciesRichness > 0) {
    for (const entry of taxonCounts.values()) {
      const p = entry.count / totalSequences;
      if (p > 0) {
        shannon -= p * Math.log(p);
        simpsonD += p * p;
      }
    }
  }

  const simpsonDiversity = totalSequences > 0 ? Math.max(0, 1 - simpsonD) : 0;
  const evenness = speciesRichness > 1 ? shannon / Math.log(speciesRichness) : speciesRichness === 1 ? 1 : 0;

  const relativeAbundance = Array.from(taxonCounts.values())
    .map((entry) => ({
      ...entry,
      relativeAbundancePct:
        totalSequences > 0 ? Number(((entry.count / totalSequences) * 100).toFixed(2)) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const clusterSummary = clusters.map((c) => {
    const avgLength = Number(
      (c.members.reduce((acc, m) => acc + m.length, 0) / c.members.length).toFixed(1)
    );
    const avgSimilarity = Number(
      (c.members.reduce((acc, m) => acc + m.similarity, 0) / c.members.length).toFixed(2)
    );
    const hasNovel = c.members.some(
      (m) => results[m.idx].identificationStatus === 'Potentially novel sequence'
    );
    return {
      clusterId: c.clusterId,
      sequenceCount: c.members.length,
      avgLength,
      avgSimilarity,
      representativeSeqId: c.representativeSeqId,
      classificationNote: hasNovel
        ? 'Divergent amplicon cluster warranting phylogenetic and wet-lab validation; computational divergence alone does not confirm a novel species.'
        : 'Low reference similarity against local curated marine database; candidate for expanded reference screening (e.g., NCBI/BOLD).',
    };
  });

  // Sequence length distribution bins
  const bins: Record<string, number> = {
    '< 80 bp': 0,
    '80–110 bp': 0,
    '111–140 bp': 0,
    '141–200 bp': 0,
    '> 200 bp': 0,
  };
  for (const s of seqs) {
    if (s.sequenceLength < 80) bins['< 80 bp']++;
    else if (s.sequenceLength <= 110) bins['80–110 bp']++;
    else if (s.sequenceLength <= 140) bins['111–140 bp']++;
    else if (s.sequenceLength <= 200) bins['141–200 bp']++;
    else bins['> 200 bp']++;
  }

  return {
    results,
    biodiversity: {
      speciesRichness,
      identifiedSpeciesCount: identifiedSpeciesSet.size,
      novelOtuCount: clusters.length,
      shannonIndex: Number(shannon.toFixed(4)),
      simpsonIndex: Number(simpsonD.toFixed(4)),
      simpsonDiversity: Number(simpsonDiversity.toFixed(4)),
      evenness: Number(evenness.toFixed(4)),
      totalSequences,
      classifiedCount,
      unclassifiedCount,
      relativeAbundance,
      clusterSummary,
      lengthDistribution: Object.entries(bins).map(([range, count]) => ({ range, count })),
    },
  };
}

function mutateSequence(seq: string, mutationRate: number, seed: number): string {
  const bases = ['A', 'C', 'G', 'T'];
  let s = seed;
  const nextRand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  let out = '';
  for (let i = 0; i < seq.length; i++) {
    if (nextRand() < mutationRate) {
      const idx = Math.floor(nextRand() * 4);
      out += bases[idx];
    } else {
      out += seq[i];
    }
  }
  return out;
}

export function generateSampleDatasetFile(format: 'FASTA' | 'FASTQ' | 'CSV', profile: 'pelagic' | 'vent' = 'pelagic'): {
  filename: string;
  content: string;
  sampleName: string;
  location: string;
  description: string;
} {
  const picks =
    profile === 'pelagic'
      ? [
          { ref: MARINE_REFERENCE_DB[0], count: 7, mut: 0.01 },
          { ref: MARINE_REFERENCE_DB[1], count: 5, mut: 0.015 },
          { ref: MARINE_REFERENCE_DB[3], count: 4, mut: 0.02 },
          { ref: MARINE_REFERENCE_DB[6], count: 4, mut: 0.01 },
          { ref: MARINE_REFERENCE_DB[8], count: 6, mut: 0.01 },
          { ref: MARINE_REFERENCE_DB[11], count: 5, mut: 0.01 },
          { ref: MARINE_REFERENCE_DB[14], count: 4, mut: 0.02 },
          { ref: MARINE_REFERENCE_DB[15], count: 3, mut: 0.06 }, // partial match
          { ref: MARINE_REFERENCE_DB[5], count: 2, mut: 0.14 }, // potentially novel
        ]
      : [
          { ref: MARINE_REFERENCE_DB[4], count: 8, mut: 0.01 },
          { ref: MARINE_REFERENCE_DB[9], count: 7, mut: 0.015 },
          { ref: MARINE_REFERENCE_DB[2], count: 5, mut: 0.01 },
          { ref: MARINE_REFERENCE_DB[13], count: 6, mut: 0.01 },
          { ref: MARINE_REFERENCE_DB[18], count: 6, mut: 0.015 },
          { ref: MARINE_REFERENCE_DB[5], count: 3, mut: 0.06 },
          { ref: MARINE_REFERENCE_DB[10], count: 3, mut: 0.16 },
        ];

  const entries: Array<{ id: string; seq: string; qual: string }> = [];
  let seqNum = 1;

  for (const p of picks) {
    for (let i = 0; i < p.count; i++) {
      const id = `EDNA_${profile.toUpperCase()}_${String(seqNum).padStart(4, '0')}`;
      const seq = mutateSequence(p.ref.sequence, p.mut, seqNum * 7919 + i * 31);
      const qual = 'I'.repeat(seq.length); // Phred 40
      entries.push({ id, seq, qual });
      seqNum++;
    }
  }

  // Add 3 truly divergent unclassified sequences forming a coherent cluster
  const unkSeedSeq =
    'GCTAGCTTCGATCGGCTAGCTAGCGTACGTACGTTAGCGCTAGCTGATCGTAGCTAGCTGACGTACGTAGCTGATCGTAGCTAGCGTACGTAGCTGATCGTACGCTAGCTGATCGTACGTAG';
  for (let i = 0; i < 3; i++) {
    const id = `EDNA_${profile.toUpperCase()}_UNK_${String(i + 1).padStart(2, '0')}`;
    const seq = mutateSequence(unkSeedSeq, 0.03, 9901 + i * 13);
    entries.push({ id, seq, qual: 'F'.repeat(seq.length) });
  }

  let content = '';
  const ext = format.toLowerCase();
  if (format === 'FASTA') {
    content = entries.map((e) => `>${e.id} marker=eDNA_amplicon\n${e.seq}`).join('\n');
  } else if (format === 'FASTQ') {
    content = entries.map((e) => `@${e.id}\n${e.seq}\n+\n${e.qual}`).join('\n');
  } else {
    content = [
      'sequence_id,dna_sequence,quality_score',
      ...entries.map((e) => `${e.id},${e.seq},38.5`),
    ].join('\n');
  }

  return {
    filename:
      profile === 'pelagic'
        ? `north_atlantic_pelagic_edna.${ext}`
        : `hydrothermal_vent_plume_edna.${ext}`,
    content,
    sampleName: profile === 'pelagic' ? 'NA-PEL-200M-01' : 'HV-PLUME-2450M-04',
    location:
      profile === 'pelagic'
        ? 'North Atlantic Pelagic Transect (200m depth)'
        : 'Mid-Ocean Ridge Hydrothermal Vent Field (2,450m depth)',
    description:
      profile === 'pelagic'
        ? 'Filtered 2L mesopelagic seawater eDNA amplicon survey targeting marine COI, 16S, and 18S marker loci.'
        : 'Deep-sea Niskin rosette water sample collected adjacent to active hydrothermal vent chimneys targeting chemosynthetic and benthic eDNA.',
  };
}
