import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseDocument } from '@/lib/parser';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const deal = await db.getDeal(dealId);
    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Use /tmp for Vercel compatibility
    const uploadDir = path.join('/tmp', 'raw-deal-verifier', dealId);
    await mkdir(uploadDir, { recursive: true });

    const uploadedFiles = [];

    for (const file of files) {
      try {
        const ext = file.name.split('.').pop() || 'txt';
        const filename = `${Date.now()}_${uuidv4().substring(0, 8)}.${ext}`;
        const filePath = path.join(uploadDir, filename);

        // Write file to disk
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // Parse document
        let parseResult = { raw_text: '', extracted_fields: [] };
        try {
          parseResult = await parseDocument(filePath, file.name);
        } catch (parseErr) {
          console.error(`Parse error for ${file.name}:`, parseErr);
          parseResult = { raw_text: '', extracted_fields: [] };
        }

        // Save to DB
        const uploadId = await db.saveUpload(dealId, file.name, filePath, file.type, parseResult.raw_text);

        uploadedFiles.push({
          upload_id: uploadId,
          filename: file.name,
          size: file.size,
          status: 'success',
          extracted_fields: parseResult.extracted_fields,
        });
      } catch (fileErr) {
        console.error(`Upload error for ${file.name}:`, fileErr);
        uploadedFiles.push({
          filename: file.name,
          status: 'error',
          error: String(fileErr),
        });
      }
    }

    return NextResponse.json({
      uploads: uploadedFiles,
      success: uploadedFiles.filter((f) => f.status === 'success').length,
      failed: uploadedFiles.filter((f) => f.status === 'error').length,
    });
  } catch (err) {
    console.error('Upload route error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
