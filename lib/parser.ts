import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import fs from 'fs';

export interface ParsedDocument {
  raw_text: string;
  extracted_fields: ExtractedField[];
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedField {
  name: string;
  value: string | number;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  page_number?: number;
}

const FIELD_PATTERNS = {
  asking_price: [/asking\s+price[:\s]+(\$?[\d,]+\.?\d*)/i, /purchase\s+price[:\s]+(\$?[\d,]+\.?\d*)/i],
  gross_income: [/gross\s+(?:annual\s+)?income[:\s]+(\$?[\d,]+\.?\d*)/i, /total\s+income[:\s]+(\$?[\d,]+\.?\d*)/i],
  annual_expenses: [/annual\s+expenses[:\s]+(\$?[\d,]+\.?\d*)/i, /total\s+expenses[:\s]+(\$?[\d,]+\.?\d*)/i],
  noi: [/net\s+operating\s+income[:\s]+(\$?[\d,]+\.?\d*)/i, /noi[:\s]+(\$?[\d,]+\.?\d*)/i],
  occupancy: [/occupancy[:\s]+(\d+\.?\d*)%?/i, /occupied\s+units[:\s]+(\d+)/i],
  units: [/units[:\s]+(\d+)/i, /total\s+(?:number\s+of\s+)?units[:\s]+(\d+)/i],
  year_built: [/year\s+built[:\s]+(\d{4})/i, /built[:\s]+(\d{4})/i],
  building_sqft: [/(?:building\s+)?sqft[:\s]+(\d+\.?\d*)/i, /square\s+feet[:\s]+(\d+\.?\d*)/i],
  lot_size: [/lot\s+size[:\s]+(\d+\.?\d*)/i, /lot[:\s]+(\d+\.?\d*)\s+(?:acres?|sqft)/i],
  market_rent: [/market\s+rent[:\s]+(\$?[\d,]+\.?\d*)/i, /average\s+rent[:\s]+(\$?[\d,]+\.?\d*)/i],
};

export async function parseDocument(filePath: string, filename: string): Promise<ParsedDocument> {
  const ext = filename.toLowerCase().split('.').pop() || '';

  let text = '';

  if (ext === 'pdf') {
    text = await parsePdf(filePath);
  } else if (['doc', 'docx'].includes(ext)) {
    text = await parseDocx(filePath);
  } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
    text = await parseSpreadsheet(filePath);
  } else if (['txt'].includes(ext)) {
    text = fs.readFileSync(filePath, 'utf-8');
  }

  const extractedFields = extractFields(text);

  return {
    raw_text: text,
    extracted_fields: extractedFields,
    confidence: extractedFields.length > 0 ? 'medium' : 'low',
  };
}

async function parsePdf(filePath: string): Promise<string> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text || '';
  } catch (err) {
    console.error('PDF parse error:', err);
    return '';
  }
}

async function parseDocx(filePath: string): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value || '';
  } catch (err) {
    console.error('DOCX parse error:', err);
    return '';
  }
}

async function parseSpreadsheet(filePath: string): Promise<string> {
  try {
    const workbook = XLSX.readFile(filePath);
    let text = '';

    workbook.SheetNames.forEach((sheetName) => {
      try {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_txt(sheet);
        text += `\n[Sheet: ${sheetName}]\n${data}`;
      } catch (err) {
        console.error(`Error parsing sheet ${sheetName}:`, err);
      }
    });

    return text || '';
  } catch (err) {
    console.error('Spreadsheet parse error:', err);
    return '';
  }
}

function extractFields(text: string): ExtractedField[] {
  const fields: ExtractedField[] = [];
  const lines = text.split('\n');

  Object.entries(FIELD_PATTERNS).forEach(([fieldName, patterns]) => {
    patterns.forEach((pattern) => {
      const match = text.match(pattern);
      if (match) {
        const rawValue = match[1];
        const value = parseValue(rawValue);

        fields.push({
          name: fieldName,
          value,
          source: `Extracted from document line: "${match[0].substring(0, 80)}..."`,
          confidence: 'medium',
        });
      }
    });
  });

  return fields;
}

function parseValue(raw: string): string | number {
  const cleaned = raw.replace(/[^\d.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? raw : num;
}

export function mergeExtractedFields(documentFields: ExtractedField[]): Record<string, ExtractedField> {
  const merged: Record<string, ExtractedField> = {};

  documentFields.forEach((field) => {
    const key = field.name;
    if (!merged[key]) {
      merged[key] = field;
    }
  });

  return merged;
}
