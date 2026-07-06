import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const { report_type, verified_deal_record, bible_output } = await req.json();

  if (!report_type || !verified_deal_record || !bible_output) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // For MVP, return HTML instead of PDF
  // TODO: Implement proper PDF generation with server-side rendering
  try {
    let htmlContent = '';

    if (report_type === 'seller_letter') {
      htmlContent = generateSellerLetterHtml(verified_deal_record, bible_output);
    } else if (report_type === 'team_analysis') {
      htmlContent = generateTeamAnalysisHtml(verified_deal_record, bible_output);
    } else if (report_type === 'back_office') {
      htmlContent = generateBackOfficeHtml(verified_deal_record, bible_output);
    } else {
      return NextResponse.json({ error: 'Invalid report_type' }, { status: 400 });
    }

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${report_type}.html"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}

function generateSellerLetterHtml(deal: any, bible: any): string {
  return `<html><body><h1>Seller Letter</h1><p>NOI: $${bible.noi}</p></body></html>`;
}

function generateTeamAnalysisHtml(deal: any, bible: any): string {
  return `<html><body><h1>Team Analysis</h1><p>Scenarios: ${bible.scenarios.length}</p></body></html>`;
}

function generateBackOfficeHtml(deal: any, bible: any): string {
  return `<html><body><h1>Back Office</h1><p>NOI: $${bible.noi}</p></body></html>`;
}
