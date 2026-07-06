import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  const { deal_name, property_address, deal_type, submitted_by } = await req.json();

  if (!deal_name || !property_address || !deal_type) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const dealId = `deal_${uuidv4()}`;
  const deal = await db.createDeal(dealId, deal_name, property_address, deal_type, submitted_by || 'unknown');

  return NextResponse.json(deal, { status: 201 });
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const searchAddress = searchParams.get('address');
  const searchType = searchParams.get('type');

  const deals = await db.listDeals(searchAddress || undefined, searchType || undefined);
  return NextResponse.json(deals);
}
