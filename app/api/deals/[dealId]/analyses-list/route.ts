import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;

  try {
    const analyses = await db.getAllAnalyses(dealId);
    return NextResponse.json(analyses);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
