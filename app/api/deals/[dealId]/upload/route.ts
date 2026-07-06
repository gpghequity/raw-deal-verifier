import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { parseDocument } from '@/lib/parser';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await params;
  const formData = await req.formData();
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }

  const deal = await db.getDeal(dealId);
  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
  }

  const uploadDir = path.join(process.cwd(), 'data', 'uploads', dealId);
  await mkdir(uploadDir, { recursive: true });

  const uploadedFiles = [];

  for (const file of files) {
    const ext = file.name.split('.').pop() || 'txt';
    const filename = `${Date.now()}_${uuidv4().substring(0, 8)}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    try {
      const parsed = await parseDocument(filePath, file.name);
      const uploadId = await db.saveUpload(dealId, file.name, filePath, file.type, parsed.raw_text);

      uploadedFiles.push({
        upload_id: uploadId,
        filename: file.name,
        status: 'success',
        extracted_fields: parsed.extracted_fields,
      });
    } catch (err) {
      uploadedFiles.push({
        filename: file.name,
        status: 'error',
        error: String(err),
      });
    }
  }

  return NextResponse.json({ uploads: uploadedFiles });
}
