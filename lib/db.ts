import { promises as fs } from 'fs';
import path from 'path';
import { VerifiedDealRecord, BibleOutput } from './bible';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    //
  }
}

export interface DealRecord {
  id: string;
  deal_name: string;
  property_address: string;
  deal_type: string;
  submitted_by: string;
  created_date: number;
  current_version: number;
  status: string;
}

export interface AnalysisRecord {
  id: string;
  deal_id: string;
  version: number;
  candidate_deal_record: string | null;
  verified_deal_record: string;
  bible_output: string;
  created_date: number;
}

const dealsFile = path.join(DATA_DIR, 'deals.json');
const analysesFile = path.join(DATA_DIR, 'analyses.json');

async function readDeals(): Promise<Record<string, DealRecord>> {
  try {
    const data = await fs.readFile(dealsFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

async function writeDeals(deals: Record<string, DealRecord>) {
  await ensureDataDir();
  await fs.writeFile(dealsFile, JSON.stringify(deals, null, 2));
}

async function readAnalyses(): Promise<AnalysisRecord[]> {
  try {
    const data = await fs.readFile(analysesFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeAnalyses(analyses: AnalysisRecord[]) {
  await ensureDataDir();
  await fs.writeFile(analysesFile, JSON.stringify(analyses, null, 2));
}

export const db = {
  createDeal: async (id: string, name: string, address: string, dealType: string, submittedBy: string): Promise<DealRecord> => {
    const deals = await readDeals();
    const now = Date.now();
    const deal: DealRecord = {
      id,
      deal_name: name,
      property_address: address,
      deal_type: dealType,
      submitted_by: submittedBy,
      created_date: now,
      current_version: 1,
      status: 'draft',
    };
    deals[id] = deal;
    await writeDeals(deals);
    return deal;
  },

  getDeal: async (id: string): Promise<DealRecord | null> => {
    const deals = await readDeals();
    return deals[id] || null;
  },

  listDeals: async (searchAddress?: string, searchType?: string): Promise<DealRecord[]> => {
    const deals = await readDeals();
    let results = Object.values(deals);

    if (searchAddress) {
      results = results.filter((d) => d.property_address.toLowerCase().includes(searchAddress.toLowerCase()));
    }

    if (searchType) {
      results = results.filter((d) => d.deal_type === searchType);
    }

    return results.sort((a, b) => b.created_date - a.created_date);
  },

  saveAnalysis: async (
    analysisId: string,
    dealId: string,
    version: number,
    candidateRecord: any,
    verifiedRecord: VerifiedDealRecord,
    bibleOutput: BibleOutput,
  ): Promise<AnalysisRecord> => {
    const analyses = await readAnalyses();
    const now = Date.now();

    const analysis: AnalysisRecord = {
      id: analysisId,
      deal_id: dealId,
      version,
      candidate_deal_record: candidateRecord ? JSON.stringify(candidateRecord) : null,
      verified_deal_record: JSON.stringify(verifiedRecord),
      bible_output: JSON.stringify(bibleOutput),
      created_date: now,
    };

    analyses.push(analysis);
    await writeAnalyses(analyses);

    // Update deal version
    const deals = await readDeals();
    const deal = deals[dealId];
    if (deal) {
      deal.current_version = version;
      await writeDeals(deals);
    }

    return analysis;
  },

  getAnalysis: async (dealId: string, version: number): Promise<AnalysisRecord | null> => {
    const analyses = await readAnalyses();
    return analyses.find((a) => a.deal_id === dealId && a.version === version) || null;
  },

  getLatestAnalysis: async (dealId: string): Promise<AnalysisRecord | null> => {
    const analyses = await readAnalyses();
    const matching = analyses.filter((a) => a.deal_id === dealId).sort((a, b) => b.version - a.version);
    return matching[0] || null;
  },

  saveUpload: async (dealId: string, filename: string, filePath: string, fileType: string, parsedText: string): Promise<string> => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // In MVP, just track uploads in memory or in deal record
    return uploadId;
  },

  getUploads: async (dealId: string) => {
    return [];
  },

  saveExtractedField: async (dealId: string, version: number, field: any) => {
    return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  getExtractedFields: async (dealId: string, version: number) => {
    return [];
  },
};
