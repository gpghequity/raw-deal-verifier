import { BibleOutput, VerifiedDealRecord } from './bible';

export async function generateSellerLetterPdf(
  deal: VerifiedDealRecord,
  bibleOutput: BibleOutput,
): Promise<string> {
  return generateSellerLetterHtml(deal, bibleOutput);
}

export async function generateTeamAnalysisPdf(
  deal: VerifiedDealRecord,
  bibleOutput: BibleOutput,
): Promise<string> {
  return generateTeamAnalysisHtml(deal, bibleOutput);
}

export async function generateBackOfficePdf(
  deal: VerifiedDealRecord,
  bibleOutput: BibleOutput,
): Promise<string> {
  return generateBackOfficeHtml(deal, bibleOutput);
}

function generateSellerLetterHtml(deal: VerifiedDealRecord, bible: BibleOutput): string {
  const bestScenario: any = bible.scenarios[0] || {};

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Seller Letter</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
        h2 { color: #0066cc; margin-top: 30px; }
        .metric { display: inline-block; margin-right: 30px; margin-bottom: 15px; }
        .metric-label { font-weight: bold; color: #666; }
        .metric-value { font-size: 18px; color: #0066cc; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        .summary-box { background: #f9f9f9; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>Market Offer Analysis</h1>
      <p><strong>Property:</strong> ${deal.property_address}</p>
      <p><strong>Analysis Date:</strong> ${new Date().toLocaleDateString()}</p>
      <p><strong>Bible Version:</strong> ${bible.bible_version}</p>

      <div class="summary-box">
        <h2>Key Investment Metrics</h2>
        <div class="metric">
          <div class="metric-label">Gross Annual Income</div>
          <div class="metric-value">$${bible.gross_income.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Annual Expenses</div>
          <div class="metric-value">$${bible.annual_expenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Net Operating Income</div>
          <div class="metric-value">$${bible.noi.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Expense Ratio</div>
          <div class="metric-value">${(bible.expense_ratio * 100).toFixed(1)}%</div>
        </div>
      </div>

      <h2>Market Offer Scenarios</h2>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Expense Adjustment</th>
            ${bible.scenarios[0]?.dscr_level ? '<th>DSCR</th>' : ''}
            <th>Adjusted NOI</th>
            <th>Maximum Offer Price</th>
            <th>Monthly Pocket</th>
          </tr>
        </thead>
        <tbody>
          ${bible.scenarios
            .map(
              (s, i) => `
            <tr>
              <td>Scenario ${i + 1}</td>
              <td>${s.pad_percentage.toFixed(0)}%</td>
              ${s.dscr_level ? `<td>${s.dscr_level}</td>` : ''}
              <td>$${s.noi_adjusted.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              <td>$${s.purchase_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              <td>$${(s.pocket_money / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>

      <h2>Financing Analysis</h2>
      <div class="summary-box">
        <p><strong>Maximum Loan Amount:</strong> $${bestScenario.max_loan?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}</p>
        <p><strong>Annual Debt Service:</strong> $${bestScenario.debt_service?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}</p>
        <p><strong>Annual Pocket Money:</strong> $${bestScenario.pocket_money?.toLocaleString('en-US', { maximumFractionDigits: 0 }) || 'N/A'}</p>
      </div>

      ${bible.warnings.length > 0 ? `<div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0;"><strong>Warnings:</strong><ul>${bible.warnings.map((w) => `<li>${w}</li>`).join('')}</ul></div>` : ''}

      <footer>
        <p>This analysis is prepared based on provided property data and Bible v${bible.bible_version} underwriting standards.</p>
      </footer>
    </body>
    </html>
  `;
}

function generateTeamAnalysisHtml(deal: VerifiedDealRecord, bible: BibleOutput): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Team Analysis</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 3px solid #0066cc; padding-bottom: 10px; }
        h2 { color: #0066cc; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f0f0f0; }
        .section { page-break-inside: avoid; margin: 20px 0; }
        footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>Team Analysis Report</h1>
      <p><strong>Property:</strong> ${deal.property_address}</p>
      <p><strong>Deal Type:</strong> ${deal.deal_type}</p>
      <p><strong>Analysis Date:</strong> ${new Date().toLocaleDateString()}</p>

      <div class="section">
        <h2>1. Deal Summary</h2>
        <table>
          <tr><td><strong>Property Address</strong></td><td>${deal.property_address}</td></tr>
          <tr><td><strong>Deal Type</strong></td><td>${deal.deal_type}</td></tr>
          <tr><td><strong>Bible Version</strong></td><td>${bible.bible_version}</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>2. Income Analysis</h2>
        <table>
          <tr><td><strong>Gross Annual Income</strong></td><td>$${bible.gross_income.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td></tr>
          <tr><td><strong>Annual Expenses</strong></td><td>$${bible.annual_expenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td></tr>
          <tr><td><strong>Expense Ratio</strong></td><td>${(bible.expense_ratio * 100).toFixed(1)}%</td></tr>
          <tr><td><strong>Net Operating Income</strong></td><td>$${bible.noi.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td></tr>
        </table>
      </div>

      <div class="section">
        <h2>3. Scenario Analysis</h2>
        <table>
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Pad %</th>
              ${bible.scenarios[0]?.dscr_level ? '<th>DSCR</th>' : ''}
              <th>Adjusted NOI</th>
              <th>Debt Service</th>
              <th>Purchase Price</th>
              <th>Monthly Pocket</th>
            </tr>
          </thead>
          <tbody>
            ${bible.scenarios
              .map(
                (s, i) => `
              <tr>
                <td>S${i + 1}</td>
                <td>${s.pad_percentage.toFixed(0)}%</td>
                ${s.dscr_level ? `<td>${s.dscr_level}</td>` : ''}
                <td>$${s.noi_adjusted.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td>$${s.debt_service.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td>$${s.purchase_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
                <td>$${(s.pocket_money / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>4. Assumptions</h2>
        <ul>
          ${bible.assumptions.map((a) => `<li>${a}</li>`).join('')}
        </ul>
      </div>

      ${bible.warnings.length > 0 ? `<div class="section"><h2>5. Warnings & Notes</h2><ul>${bible.warnings.map((w) => `<li>${w}</li>`).join('')}</ul></div>` : ''}

      <footer>
        <p>Prepared with Bible v${bible.bible_version} | Confidential - For Internal Use Only</p>
      </footer>
    </body>
    </html>
  `;
}

function generateBackOfficeHtml(deal: VerifiedDealRecord, bible: BibleOutput): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Back Office</title>
      <style>
        body { font-family: monospace; margin: 40px; font-size: 11px; line-height: 1.5; }
        h1 { font-size: 16px; border-bottom: 2px solid #000; padding-bottom: 5px; }
        h2 { font-size: 13px; margin-top: 20px; border-bottom: 1px solid #ddd; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
        th, td { border: 1px solid #ddd; padding: 5px; text-align: right; }
        th { background-color: #f0f0f0; }
        .label { text-align: left; }
        footer { margin-top: 40px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 9px; }
      </style>
    </head>
    <body>
      <h1>BACK OFFICE ANALYSIS</h1>
      <p>Property: ${deal.property_address} | Deal ID: ${deal.deal_id} | Version: ${deal.analysis_version}</p>

      <h2>FINANCIAL SUMMARY</h2>
      <table>
        <tr>
          <td class="label">Gross Income</td>
          <td>$${bible.gross_income.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
        </tr>
        <tr>
          <td class="label">Expenses (${(bible.expense_ratio * 100).toFixed(1)}%)</td>
          <td>$${bible.annual_expenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
        </tr>
        <tr style="font-weight: bold;">
          <td class="label">NET OPERATING INCOME</td>
          <td>$${bible.noi.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
        </tr>
      </table>

      <h2>DETAILED SCENARIO MATRIX</h2>
      <table>
        <thead>
          <tr>
            <th>Scenario</th>
            <th>Pad %</th>
            ${bible.scenarios[0]?.dscr_level ? '<th>DSCR</th>' : ''}
            <th>NOI Adj.</th>
            <th>DS/Month</th>
            <th>Max Loan</th>
            <th>Offer Price</th>
            <th>Mo. Pocket</th>
          </tr>
        </thead>
        <tbody>
          ${bible.scenarios
            .map(
              (s, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${s.pad_percentage.toFixed(0)}%</td>
              ${s.dscr_level ? `<td>${s.dscr_level}</td>` : ''}
              <td>$${s.noi_adjusted.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              <td>$${(s.debt_service / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              <td>$${s.max_loan.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              <td>$${s.purchase_price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
              <td>$${(s.pocket_money / 12).toLocaleString('en-US', { maximumFractionDigits: 0 })}</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>

      ${bible.warnings.length > 0 ? `<h2>WARNINGS</h2><pre>${bible.warnings.join('\n')}</pre>` : ''}

      <footer>Bible v${bible.bible_version} | ${new Date().toISOString()} | DO NOT DISTRIBUTE</footer>
    </body>
    </html>
  `;
}

