import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const searchParams = req.nextUrl.searchParams;
  const version = parseInt(searchParams.get('version') || '1');

  const fields = await db.getExtractedFields(dealId, version);
  return NextResponse.json(fields);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const { field, version } = await req.json();

  if (!field || !version) {
    return NextResponse.json({ error: 'Missing field or version' }, { status: 400 });
  }

  const fieldId = await db.saveExtractedField(dealId, version, field);
  return NextResponse.json({ field_id: fieldId, status: 'saved' });
}
