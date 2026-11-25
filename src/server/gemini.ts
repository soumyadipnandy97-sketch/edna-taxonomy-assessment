import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface DatasetScientificContext {
  datasetName: string;
  sampleName: string;
  sampleType: string;
  collectionLocation: string;
  collectionDate: string;
  fileFormat: string;
  totalSequences: number;
  classifiedCount: number;
  unclassifiedCount: number;
  speciesRichness: number;
  shannonIndex: number;
  simpsonIndex: number;
  simpsonDiversity: number;
  evenness: number;
  topTaxa: Array<{
    taxon: string;
    kingdom: string;
    phylum: string;
    count: number;
    relativeAbundancePct: number;
    status: string;
  }>;
  clusters: Array<{
    clusterId: string;
    sequenceCount: number;
    avgLength: number;
    avgSimilarity: number;
  }>;
  referenceDatabase: string;
}

export async function askBioAIAssistant(params: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  datasetContexts: DatasetScientificContext[];
}): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets.'
    );
  }

  const contextBlock =
    params.datasetContexts.length > 0
      ? JSON.stringify(params.datasetContexts, null, 2)
      : 'No analyzed datasets are currently selected or uploaded by this researcher.';

  const systemInstruction = `You are BioAI Assistant, the scientific bioinformatics advisor inside DeepSea BioAI (Problem Statement ID 25042: Identifying Taxonomy and Assessing Biodiversity from eDNA Datasets).

STRICT SCIENTIFIC INTEGRITY RULES:
1. Base all quantitative observations ONLY on the provided dataset analysis results JSON below. NEVER invent species names, sequence counts, p-values, or biodiversity metrics not present in the context.
2. Always remind researchers when relevant that eDNA read counts represent relative molecular detection abundance (influenced by PCR bias, DNA shedding rates, and marker copy number), NOT exact organism census counts.
3. For unclassified or potentially novel sequence clusters (OTU-UNK-*), use rigorous scientific caution: explain that computational divergence from a local reference database indicates either incomplete reference coverage or a candidate divergent lineage requiring expanded database verification (e.g., NCBI GenBank / BOLD) and wet-lab validation—NEVER claim a new species has been formally discovered from computational similarity alone.
4. Explain ecological indices clearly when asked:
   - Species Richness (S): count of distinct identified taxa/OTUs.
   - Shannon Diversity Index (H' = -Σ(pi * ln(pi))): reflects both richness and evenness.
   - Simpson Index (D = Σ(pi^2)) and Gini-Simpson Diversity (1 - D): probability two randomly chosen reads belong to different taxa.
   - Pielou's Evenness (J' = H' / ln(S)): measures dominance vs uniform distribution (0 to 1).
5. Structure responses cleanly with concise headings or bullet points appropriate for a peer-reviewed scientific notebook. Keep answers crisp, authoritative, and directly actionable.

RESEARCHER'S ACTUAL DATABASE ANALYSIS CONTEXT:
${contextBlock}`;

  const contents = [
    ...params.history.slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    {
      role: 'user',
      parts: [{ text: params.message }],
    },
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents,
    config: {
      systemInstruction,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('BioAI Assistant returned an empty response. Please try again.');
  }
  return text;
}
