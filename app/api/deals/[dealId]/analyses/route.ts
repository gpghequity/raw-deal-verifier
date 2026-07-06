import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const version = searchParams.get('version');

  if (version) {
    const analysis = await db.getAnalysis(dealId, parseInt(version));
    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }
    return NextResponse.json({
      ...analysis,
      verified_deal_record: JSON.parse(analysis.verified_deal_record),
      bible_output: JSON.parse(analysis.bible_output),
      candidate_deal_record: analysis.candidate_deal_record ? JSON.parse(analysis.candidate_deal_record) : null,
    });
  }

  const latest = await db.getLatestAnalysis(dealId);
  if (!latest) {
    return NextResponse.json({ error: 'No analyses found' }, { status: 404 });
  }

  return NextResponse.json({
    ...latest,
    verified_deal_record: JSON.parse(latest.verified_deal_record),
    bible_output: JSON.parse(latest.bible_output),
    candidate_deal_record: latest.candidate_deal_record ? JSON.parse(latest.candidate_deal_record) : null,
  });
}
