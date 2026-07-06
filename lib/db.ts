import { promises as fs } from 'fs';
import path from 'path';
import { VerifiedDealRecord, BibleOutput } from './bible';

// Try to use Vercel KV in production, fallback to file storage
let kv: any = null;
if (process.env.NODE_ENV === 'production') {
  try {
    const kvModule = require('@vercel/kv');
    kv = kvModule;
  } catch (err) {
    console.log('KV not available, using file storage');
  }
}

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

    if (kv) {
      // Store in Vercel KV
      await kv.set(`deal:${id}`, JSON.stringify(deal), { ex: 86400 * 7 }); // 7 day TTL
    } else {
      // Fallback to file storage
      const deals = await readDeals();
      deals[id] = deal;
      await writeDeals(deals);
    }

    return deal;
  },

  getDeal: async (id: string): Promise<DealRecord | null> => {
    if (kv) {
      try {
        const data = await kv.get(`deal:${id}`);
        if (!data) return null;
        return JSON.parse(typeof data === 'string' ? data : String(data));
      } catch (err) {
        console.error('KV get error:', err);
      }
    }

    // Fallback to file storage
    const deals = await readDeals();
    return deals[id] || null;
  },

  listDeals: async (searchAddress?: string, searchType?: string): Promise<DealRecord[]> => {
    let deals: Record<string, DealRecord> = {};

    if (kv) {
      try {
        const keys = await kv.keys('deal:*');
        for (const key of keys) {
          const data = await kv.get(key);
          if (data) {
            const deal = JSON.parse(typeof data === 'string' ? data : String(data));
            deals[deal.id] = deal;
          }
        }
      } catch (err) {
        console.error('KV list error:', err);
        deals = await readDeals();
      }
    } else {
      deals = await readDeals();
    }

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

    if (kv) {
      await kv.set(`analysis:${dealId}:${version}`, JSON.stringify(analysis), { ex: 86400 * 7 });
      // Update deal version in KV
      const deal = await db.getDeal(dealId);
      if (deal) {
        deal.current_version = version;
        await kv.set(`deal:${dealId}`, JSON.stringify(deal), { ex: 86400 * 7 });
      }
    } else {
      const analyses = await readAnalyses();
      analyses.push(analysis);
      await writeAnalyses(analyses);

      const deals = await readDeals();
      const deal = deals[dealId];
      if (deal) {
        deal.current_version = version;
        deals[dealId] = deal;
        await writeDeals(deals);
      }
    }

    return analysis;
  },

  getAnalysis: async (dealId: string, version: number): Promise<AnalysisRecord | null> => {
    if (kv) {
      try {
        const data = await kv.get(`analysis:${dealId}:${version}`);
        if (!data) return null;
        return JSON.parse(typeof data === 'string' ? data : String(data));
      } catch (err) {
        console.error('KV analysis get error:', err);
      }
    }

    const analyses = await readAnalyses();
    return analyses.find((a) => a.deal_id === dealId && a.version === version) || null;
  },

  getLatestAnalysis: async (dealId: string): Promise<AnalysisRecord | null> => {
    if (kv) {
      try {
        const keys = await kv.keys(`analysis:${dealId}:*`);
        if (keys.length === 0) return null;

        const analyses = [];
        for (const key of keys) {
          const data = await kv.get(key);
          if (data) {
            analyses.push(JSON.parse(typeof data === 'string' ? data : String(data)));
          }
        }

        return analyses.sort((a, b) => b.version - a.version)[0] || null;
      } catch (err) {
        console.error('KV latest analysis error:', err);
      }
    }

    const analyses = await readAnalyses();
    const matching = analyses.filter((a) => a.deal_id === dealId).sort((a, b) => b.version - a.version);
    return matching[0] || null;
  },

  getAllAnalyses: async (dealId: string): Promise<AnalysisRecord[]> => {
    if (kv) {
      try {
        const keys = await kv.keys(`analysis:${dealId}:*`);
        const analyses = [];

        for (const key of keys) {
          const data = await kv.get(key);
          if (data) {
            analyses.push(JSON.parse(typeof data === 'string' ? data : String(data)));
          }
        }

        return analyses.sort((a, b) => b.version - a.version);
      } catch (err) {
        console.error('KV all analyses error:', err);
      }
    }

    const analyses = await readAnalyses();
    return analyses.filter((a) => a.deal_id === dealId).sort((a, b) => b.version - a.version);
  },

  saveUpload: async (dealId: string, filename: string, filePath: string, fileType: string, parsedText: string): Promise<string> => {
    const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
