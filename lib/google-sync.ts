import { google } from 'googleapis';

// Initialize auth from environment
function getAuth() {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) return null;

  try {
    return new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'],
    });
  } catch (err) {
    console.error('Failed to initialize Google Auth:', err);
    return null;
  }
}

export async function appendToGoogleSheets(data: {
  deal_id: string;
  property_address: string;
  deal_type: string;
  submitted_by: string;
  analysis_date: string;
  bible_version: string;
  status: string;
  noi: number;
  scenarios_count: number;
}) {
  const auth = getAuth();
  if (!auth) return;

  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  if (!spreadsheetId) return;

  try {
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Raw Deal Analyses!A:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            data.deal_id,
            data.property_address,
            data.deal_type,
            data.submitted_by,
            data.analysis_date,
            data.bible_version,
            data.status,
            `$${data.noi.toLocaleString()}`,
            data.scenarios_count,
          ],
        ],
      },
    });
  } catch (err) {
    console.error('Failed to append to Google Sheets:', err);
  }
}

export async function uploadToDrive(fileName: string, mimeType: string, fileContent: Buffer) {
  const auth = getAuth();
  if (!auth) return null;

  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!folderId) return null;

  try {
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: fileContent as any,
      },
    });

    return response.data.id;
  } catch (err) {
    console.error('Failed to upload to Google Drive:', err);
    return null;
  }
}
