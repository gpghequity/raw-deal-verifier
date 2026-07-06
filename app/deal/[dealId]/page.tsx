'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Deal {
  id: string;
  deal_name: string;
  property_address: string;
  deal_type: string;
  created_date: number;
  current_version: number;
  status: string;
}

interface DealState {
  asking_price: string;
  gross_income: string;
  annual_expenses: string;
  occupancy: string;
  units: string;
  year_built: string;
  [key: string]: string;
}

export default function DealPage() {
  const params = useParams();
  const dealId = params.dealId as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  // SHARED STATE - PERSISTS ACROSS STEPS
  const [dealData, setDealData] = useState<DealState>({
    asking_price: '',
    gross_income: '',
    annual_expenses: '',
    occupancy: '',
    units: '',
    year_built: '',
  });

  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [bibleOutput, setBibleOutput] = useState<any>(null);

  useEffect(() => {
    const fetchDeal = async () => {
      try {
        const response = await fetch(`/api/deals/${dealId}`);
        if (!response.ok) throw new Error('Deal not found');
        const data = await response.json();
        setDeal(data);
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    if (dealId) fetchDeal();
  }, [dealId]);

  if (loading)
    return (
      <div className="screen">
        <div className="loading"></div> Loading deal...
      </div>
    );

  if (error || !deal)
    return (
      <div className="screen">
        <div className="alert alert-error">{error || 'Deal not found'}</div>
      </div>
    );

  return (
    <div>
      <div className="screen" style={{ marginBottom: '20px' }}>
        <div className="screen-title">{deal.deal_name}</div>
        <div className="screen-subtitle">{deal.property_address} | {deal.deal_type}</div>

        <div style={{ marginTop: '20px' }}>
          <strong>Deal ID:</strong> {deal.id}
          <br />
          <strong>Deal Type:</strong> {deal.deal_type}
        </div>

        <div className="button-group" style={{ marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={() => (window.location.href = '/')}>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="screen">
        <h2 style={{ marginBottom: '20px' }}>9-Step Workflow (Step {currentStep})</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '30px' }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step)}
              className={`btn ${currentStep === step ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '10px', fontSize: '12px' }}
            >
              Step {step}
            </button>
          ))}
        </div>

        {currentStep === 1 && <Step1Start dealId={dealId} deal={deal} onContinue={() => setCurrentStep(2)} />}
        {currentStep === 2 && (
          <Step2Upload
            dealId={dealId}
            uploadedFiles={uploadedFiles}
            setUploadedFiles={setUploadedFiles}
            onContinue={() => setCurrentStep(3)}
          />
        )}
        {currentStep === 3 && <Step3ExtractFields dealId={dealId} uploadedFiles={uploadedFiles} dealData={dealData} setDealData={setDealData} onContinue={() => setCurrentStep(4)} />}
        {currentStep === 4 && <Step4VerifyFields dealData={dealData} setDealData={setDealData} onContinue={() => setCurrentStep(5)} />}
        {currentStep === 5 && <Step5Questions deal={deal} dealData={dealData} setDealData={setDealData} onContinue={() => setCurrentStep(6)} />}
        {currentStep === 6 && <Step6Review dealData={dealData} onContinue={() => setCurrentStep(7)} />}
        {currentStep === 7 && <Step7Bible dealId={dealId} deal={deal} dealData={dealData} setBibleOutput={setBibleOutput} onContinue={() => setCurrentStep(8)} />}
        {currentStep === 8 && <Step8Reports dealId={dealId} bibleOutput={bibleOutput} dealData={dealData} />}
      </div>
    </div>
  );
}

function Step1Start({ dealId, deal, onContinue }: any) {
  return (
    <div>
      <h3>Step 1: Deal Created ✓</h3>
      <div style={{ padding: '20px', background: '#d4edda', borderRadius: '4px', color: '#155724', marginBottom: '20px' }}>
        <strong>{deal.deal_name}</strong> created successfully
        <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>{deal.property_address} ({deal.deal_type})</p>
      </div>
      <p>Ready to upload documents and begin analysis.</p>
      <div className="button-group">
        <button className="btn btn-primary" onClick={onContinue}>
          Continue to Upload
        </button>
      </div>
    </div>
  );
}

function Step2Upload({ dealId, uploadedFiles, setUploadedFiles, onContinue }: any) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select files');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append('files', file));

      const response = await fetch(`/api/deals/${dealId}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Upload failed: ${text}`);
      }

      const result = await response.json();
      console.log('Upload result:', result);

      setUploadedFiles(result.uploads);
      setMessage(`✓ Uploaded ${result.success} files successfully`);

      setTimeout(() => onContinue(), 1000);
    } catch (err) {
      console.error('Upload error:', err);
      setMessage(`✗ Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>Step 2: Upload Documents</h3>
      <div className="file-upload" onClick={() => document.getElementById('fileInput')?.click()}>
        <div style={{ fontSize: '24px' }}>📁</div>
        <div className="file-upload-text">Click to select files or drag and drop</div>
        <div style={{ fontSize: '12px', color: '#999' }}>PDF, DOC, DOCX, XLS, XLSX, TXT, CSV</div>
        <input id="fileInput" type="file" multiple onChange={handleFileSelect} />
      </div>

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: '15px' }}>
          <strong>Selected files ({selectedFiles.length}):</strong>
          <ul>
            {selectedFiles.map((f) => (
              <li key={f.name}>{f.name}</li>
            ))}
          </ul>
        </div>
      )}

      {message && <div className={`alert ${message.startsWith('✓') ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '15px' }}>{message}</div>}

      <div className="button-group" style={{ marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={handleUpload} disabled={loading || selectedFiles.length === 0}>
          {loading ? 'Uploading...' : 'Upload Files'}
        </button>
        <button className="btn btn-secondary" onClick={onContinue}>
          Skip Upload → Go to Manual Entry
        </button>
      </div>
    </div>
  );
}

function Step3ExtractFields({ dealId, uploadedFiles, dealData, setDealData, onContinue }: any) {
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    // Extract fields from uploaded files
    if (uploadedFiles.length > 0) {
      setExtracting(true);
      const extracted: any = {};

      uploadedFiles.forEach((file: any) => {
        if (file.extracted_fields && file.extracted_fields.length > 0) {
          file.extracted_fields.forEach((field: any) => {
            extracted[field.name] = String(field.value);
          });
        }
      });

      setDealData((prev: any) => ({ ...prev, ...extracted }));
      setExtracting(false);
    }
  }, [uploadedFiles, setDealData]);

  return (
    <div>
      <h3>Step 3: Extract Fields from Documents</h3>
      {extracting ? (
        <div style={{ padding: '20px', background: '#f0f7ff', borderRadius: '4px' }}>
          <div className="loading"></div>
          <p>Extracting fields from {uploadedFiles.length} documents...</p>
        </div>
      ) : (
        <div style={{ padding: '15px', background: '#d4edda', borderRadius: '4px', color: '#155724', marginBottom: '20px' }}>
          ✓ Extraction complete. {Object.values(dealData).filter((v) => v).length} fields extracted.
        </div>
      )}

      <div className="button-group" style={{ marginTop: '20px' }}>
        <button className="btn btn-primary" onClick={onContinue} disabled={extracting}>
          Continue to Verify
        </button>
      </div>
    </div>
  );
}

function Step4VerifyFields({ dealData, setDealData, onContinue }: any) {
  return (
    <div>
      <h3>Step 4: Verify & Edit Fields</h3>
      <p style={{ marginBottom: '20px', color: '#666' }}>Edit any extracted values:</p>

      {Object.keys(dealData).map((key) => (
        <div key={key} className="form-group">
          <label>{key.replace(/_/g, ' ').toUpperCase()}</label>
          <input
            type="text"
            value={dealData[key]}
            onChange={(e) => setDealData({ ...dealData, [key]: e.target.value })}
            placeholder={`Enter ${key}`}
          />
        </div>
      ))}

      <div className="button-group">
        <button className="btn btn-primary" onClick={onContinue}>
          Continue to Questions
        </button>
      </div>
    </div>
  );
}

function Step5Questions({ deal, dealData, setDealData, onContinue }: any) {
  const requiredFields = ['gross_income', 'annual_expenses', 'units'];

  const allAnswered = requiredFields.every((field) => dealData[field]);

  return (
    <div>
      <h3>Step 5: Answer Required Questions</h3>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        {requiredFields.filter((f) => dealData[f]).length} of {requiredFields.length} answered
      </p>

      {requiredFields.map((field) => (
        <div key={field} className="form-group">
          <label>{field.replace(/_/g, ' ').toUpperCase()}</label>
          <input
            type="text"
            value={dealData[field] || ''}
            onChange={(e) => setDealData({ ...dealData, [field]: e.target.value })}
            placeholder={`Enter ${field}`}
          />
        </div>
      ))}

      <div className="button-group">
        <button className="btn btn-primary" onClick={onContinue} disabled={!allAnswered}>
          {allAnswered ? 'Continue to Review' : 'Answer all questions first'}
        </button>
      </div>
    </div>
  );
}

function Step6Review({ dealData, onContinue }: any) {
  const missing = Object.entries(dealData).filter(([k, v]) => !v);

  return (
    <div>
      <h3>Step 6: Review Verified Deal Data</h3>

      <table className="table" style={{ marginBottom: '20px' }}>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(dealData).map(([key, value]: any) => (
            <tr key={key} style={{ background: value ? 'white' : '#fff3cd' }}>
              <td>{key.replace(/_/g, ' ')}</td>
              <td>{String(value) || '(missing)'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {missing.length === 0 ? (
        <div className="alert alert-success">✓ All required fields complete</div>
      ) : (
        <div className="alert alert-warning">⚠ {missing.length} fields missing</div>
      )}

      <div className="button-group">
        <button className="btn btn-primary" onClick={onContinue} disabled={missing.length > 0}>
          {missing.length === 0 ? 'Run Bible Analysis' : 'Fill missing fields first'}
        </button>
      </div>
    </div>
  );
}

function Step7Bible({ dealId, deal, dealData, setBibleOutput, onContinue }: any) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const runBible = async () => {
      try {
        const verifiedRecord = {
          deal_id: dealId,
          analysis_version: 1,
          bible_version: '11.24',
          deal_type: deal.deal_type,
          property_address: deal.property_address,
          submitted_by: 'operator',
          created_date: Date.now(),
          financial_data: {
            asking_price: { value: parseFloat(dealData.asking_price) || 0, source: 'User', confidence: 'high', status: 'edited' },
            gross_income: { value: parseFloat(dealData.gross_income) || 0, source: 'User', confidence: 'high', status: 'edited' },
            annual_expenses: { value: parseFloat(dealData.annual_expenses) || 0, source: 'User', confidence: 'high', status: 'edited' },
            occupancy: { value: parseFloat(dealData.occupancy) || 100, source: 'User', confidence: 'high', status: 'edited' },
          },
          property_data: {
            units: { value: parseInt(dealData.units) || 0, source: 'User', confidence: 'high', status: 'edited' },
            year_built: { value: parseInt(dealData.year_built) || 0, source: 'User', confidence: 'medium', status: 'edited' },
          },
          status: 'verified',
          validation_errors: [],
        };

        const response = await fetch(`/api/deals/${dealId}/bible`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verified_deal_record: verifiedRecord }),
        });

        if (!response.ok) throw new Error('Bible execution failed');

        const result = await response.json();
        setBibleOutput(result.bible_output);

        setTimeout(() => onContinue(), 1500);
      } catch (err) {
        console.error('Bible error:', err);
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    runBible();
  }, [dealId, deal, dealData, setBibleOutput, onContinue]);

  if (loading)
    return (
      <div>
        <h3>Step 7: Running Bible v11.24</h3>
        <div style={{ padding: '20px', background: '#f0f7ff', borderRadius: '4px' }}>
          <div className="loading"></div>
          <p>Analyzing deal with {Object.keys(dealData).filter((k) => dealData[k]).length} verified fields...</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div>
        <h3>Step 7: Analysis Error</h3>
        <div className="alert alert-error">✗ {error}</div>
      </div>
    );

  return (
    <div>
      <h3>Step 7: Analysis Complete ✓</h3>
      <div style={{ padding: '15px', background: '#d4edda', borderRadius: '4px', color: '#155724', marginBottom: '20px' }}>
        <strong>NOI:</strong> ${dealData.gross_income} - ${dealData.annual_expenses} = calculated
      </div>
      <div className="button-group">
        <button className="btn btn-primary" onClick={onContinue}>
          View Reports
        </button>
      </div>
    </div>
  );
}

function Step8Reports({ dealId, bibleOutput, dealData }: any) {
  if (!bibleOutput) {
    return (
      <div>
        <h3>Step 8: Reports</h3>
        <p>Run Bible analysis first.</p>
      </div>
    );
  }

  return (
    <div>
      <h3>Step 8: Analysis Reports ✓</h3>

      <div style={{ padding: '15px', background: '#d1ecf1', borderRadius: '4px', marginBottom: '20px', color: '#0c5460' }}>
        <strong>Analysis complete</strong>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>NOI: ${bibleOutput.noi.toLocaleString()} | Scenarios: {bibleOutput.scenarios.length}</p>
      </div>

      <p style={{ marginBottom: '20px' }}>Reports generated and archived.</p>

      <div className="button-group">
        <button className="btn btn-secondary" onClick={() => (window.location.href = '/')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
