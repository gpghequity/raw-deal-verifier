import { NextRequest, NextResponse } from 'next/server';
import { executeBible, VerifiedDealRecord } from '@/lib/bible';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const { verified_deal_record, candidate_deal_record } = await req.json();

  if (!verified_deal_record) {
    return NextResponse.json({ error: 'Missing verified_deal_record' }, { status: 400 });
  }

  const deal = await db.getDeal(dealId);
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  try {
    const bibleOutput = executeBible(verified_deal_record as VerifiedDealRecord);

    const analysisId = `analysis_${uuidv4()}`;
    const nextVersion = (deal.current_version || 1) + 1;

    await db.saveAnalysis(analysisId, dealId, nextVersion, candidate_deal_record, verified_deal_record, bibleOutput);

    return NextResponse.json({
      analysis_id: analysisId,
      version: nextVersion,
      bible_output: bibleOutput,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
