import { NextRequest, NextResponse } from 'next/server';
import { generateSellerLetterPdf, generateTeamAnalysisPdf, generateBackOfficePdf } from '@/lib/pdf-generator';
import { db } from '@/lib/db';
import { appendToGoogleSheets, uploadToDrive } from '@/lib/google-sync';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const { report_type, verified_deal_record, bible_output, should_archive } = await req.json();

  if (!report_type || !verified_deal_record || !bible_output) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    let htmlContent = '';

    if (report_type === 'seller_letter') {
      htmlContent = await generateSellerLetterPdf(verified_deal_record, bible_output);
    } else if (report_type === 'team_analysis') {
      htmlContent = await generateTeamAnalysisPdf(verified_deal_record, bible_output);
    } else if (report_type === 'back_office') {
      htmlContent = await generateBackOfficePdf(verified_deal_record, bible_output);
    } else {
      return NextResponse.json({ error: 'Invalid report_type' }, { status: 400 });
    }

    // If archiving, sync to Google
    if (should_archive) {
      try {
        await appendToGoogleSheets({
          deal_id: verified_deal_record.deal_id,
          property_address: verified_deal_record.property_address,
          deal_type: verified_deal_record.deal_type,
          submitted_by: verified_deal_record.submitted_by,
          analysis_date: new Date().toISOString(),
          bible_version: bible_output.bible_version,
          status: 'Complete',
          noi: bible_output.noi,
          scenarios_count: bible_output.scenarios.length,
        });
      } catch (err) {
        console.error('Google Sheets sync failed:', err);
        // Don't fail the request if Google sync fails
      }
    }

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${report_type}.html"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 });
  }
}
