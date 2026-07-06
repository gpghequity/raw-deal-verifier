// REI Platform Bible v11.24 - Underwriting Engine
// LOCKED CONSTANTS - DO NOT MODIFY

export const BIBLE_VERSION = '11.24';

export const CONSTANTS = {
  RESIDENTIAL: {
    LTV: 0.80,
    RATE: 0.07,
    YEARS: 30,
    K: 0.08104,
    DSCR: 1.25,
    EXPENSE_FLOOR: 0.15,
    SCENARIOS: 3,
    POCKET_FLOOR: 0,
  },
  COMMERCIAL: {
    LTV: 0.75,
    RATE: 0.0725,
    YEARS: 25,
    K: 0.08679,
    DSCR_LEVELS: [1.25, 1.15],
    EXPENSE_FLOOR: 0.35,
    SCENARIOS: 8,
    POCKET_FLOORS: { 1.25: 10000, 1.15: 0 },
  },
  EQUITY_FINANCING: {
    K_IO: 0.08,
    K_AMORT: 0.09577,
  },
  SELLER_FINANCE: {
    BUYER_CASH: 100000,
    SELLER_RATE: 0.05,
    SELLER_YEARS: 25,
    SELLER_BALLOON: 15,
    K_SELLER: 0.07057,
  },
};

export interface VerifiedDealRecord {
  deal_id: string;
  analysis_version: number;
  bible_version: string;
  deal_type: string;
  property_address: string;
  submitted_by: string;
  created_date: number;

  financial_data: {
    asking_price?: FieldValue;
    gross_income?: FieldValue;
    annual_expenses?: FieldValue;
    occupancy?: FieldValue;
    market_rent?: FieldValue;
    [key: string]: FieldValue | undefined;
  };

  property_data: {
    units?: FieldValue;
    year_built?: FieldValue;
    building_sqft?: FieldValue;
    [key: string]: FieldValue | undefined;
  };

  status: 'verified';
  validation_errors: string[];
}

export interface FieldValue {
  value: number | string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  status: 'extracted' | 'edited' | 'missing';
}

export interface BibleOutput {
  deal_id: string;
  bible_version: string;
  deal_type: string;

  noi: number;
  gross_income: number;
  annual_expenses: number;
  expense_ratio: number;

  scenarios: Scenario[];

  ceiling_prices: {
    ceiling_25k: number;
    ceiling_10k: number;
    breakeven: number;
  };

  warnings: string[];
  assumptions: string[];

  seller_letter_data: {
    property_address: string;
    offer_price_low: number;
    offer_price_high: number;
    noi: number;
    key_metrics: string;
  };

  team_analysis_data: {
    [key: string]: any;
  };

  back_office_data: {
    [key: string]: any;
  };
}

export interface Scenario {
  pad_percentage: number;
  dscr_level?: number;
  noi_adjusted: number;
  max_loan: number;
  debt_service: number;
  pocket_money: number;
  loan_amount: number;
  purchase_price: number;
}

export function executeBible(deal: VerifiedDealRecord): BibleOutput {
  const dealType = deal.deal_type.toLowerCase();
  const isCommercial = ['multifamily', 'office', 'retail', 'industrial', 'mixed use', 'self storage', 'mobile home park', 'rv park'].includes(dealType);
  const isResidential = ['single family', 'duplex', 'triplex', 'fourplex'].includes(dealType);

  if (!isCommercial && !isResidential && dealType !== 'land') {
    throw new Error(`Unknown deal type: ${deal.deal_type}`);
  }

  const grossIncome = extractNumber(deal.financial_data.gross_income);
  const annualExpenses = extractNumber(deal.financial_data.annual_expenses);
  const askingPrice = extractNumber(deal.financial_data.asking_price);

  // Apply expense floor
  const expenseFloor = isResidential ? CONSTANTS.RESIDENTIAL.EXPENSE_FLOOR : CONSTANTS.COMMERCIAL.EXPENSE_FLOOR;
  const minExpenses = grossIncome * expenseFloor;
  const finalExpenses = Math.max(annualExpenses || 0, minExpenses);

  const noi = grossIncome - finalExpenses;

  const scenarios: Scenario[] = [];
  const warnings: string[] = [];
  const assumptions: string[] = [];

  if (isResidential) {
    scenarios.push(...generateResidentialScenarios(noi, grossIncome, askingPrice));
    assumptions.push(`Using residential constants: LTV ${CONSTANTS.RESIDENTIAL.LTV}, Rate ${CONSTANTS.RESIDENTIAL.RATE}, DSCR ${CONSTANTS.RESIDENTIAL.DSCR}`);
  } else if (isCommercial) {
    scenarios.push(...generateCommercialScenarios(noi, grossIncome, askingPrice));
    assumptions.push(`Using commercial constants: LTV ${CONSTANTS.COMMERCIAL.LTV}, Rate ${CONSTANTS.COMMERCIAL.RATE}`);
  }

  // Validate
  if (noi <= 0) warnings.push('WARNING: NOI is zero or negative. Deal may not be viable.');
  if (finalExpenses < minExpenses) warnings.push(`NOTE: Expenses below ${Math.round(expenseFloor * 100)}% floor. Using floor value.`);

  return {
    deal_id: deal.deal_id,
    bible_version: BIBLE_VERSION,
    deal_type: deal.deal_type,
    noi,
    gross_income: grossIncome,
    annual_expenses: finalExpenses,
    expense_ratio: finalExpenses / grossIncome,
    scenarios,
    ceiling_prices: calculateCeilingPrices(scenarios),
    warnings,
    assumptions,
    seller_letter_data: {
      property_address: deal.property_address,
      offer_price_low: scenarios[0]?.purchase_price || 0,
      offer_price_high: scenarios[scenarios.length - 1]?.purchase_price || 0,
      noi,
      key_metrics: `${scenarios.length} scenarios analyzed`,
    },
    team_analysis_data: {
      scenarios,
      noi,
      gross_income: grossIncome,
      annual_expenses: finalExpenses,
    },
    back_office_data: {
      scenarios,
      noi,
      warnings,
      assumptions,
    },
  };
}

function generateResidentialScenarios(noi: number, grossIncome: number, askingPrice: number): Scenario[] {
  const scenarios: Scenario[] = [];
  const pads = [0, 0.15, 0.3];

  pads.forEach((pad) => {
    const noiAdjusted = noi * (1 - pad);
    const dscr = CONSTANTS.RESIDENTIAL.DSCR;
    const maxAnnualDebtService = noiAdjusted / dscr;
    const monthlyDebtService = maxAnnualDebtService / 12;
    const loanAmount = monthlyDebtService / CONSTANTS.RESIDENTIAL.K;
    const pocketFloor = CONSTANTS.RESIDENTIAL.POCKET_FLOOR;

    scenarios.push({
      pad_percentage: pad * 100,
      noi_adjusted: noiAdjusted,
      max_loan: loanAmount,
      debt_service: maxAnnualDebtService,
      pocket_money: Math.max(noiAdjusted - maxAnnualDebtService, pocketFloor),
      loan_amount: loanAmount,
      purchase_price: loanAmount / CONSTANTS.RESIDENTIAL.LTV,
    });
  });

  return scenarios;
}

function generateCommercialScenarios(noi: number, grossIncome: number, askingPrice: number): Scenario[] {
  const scenarios: Scenario[] = [];

  CONSTANTS.COMMERCIAL.DSCR_LEVELS.forEach((dscr) => {
    [0, 0.15, 0.3].forEach((pad) => {
      const noiAdjusted = noi * (1 - pad);
      const maxAnnualDebtService = noiAdjusted / dscr;
      const monthlyDebtService = maxAnnualDebtService / 12;
      const loanAmount = monthlyDebtService / CONSTANTS.COMMERCIAL.K;
      const pocketFloor = CONSTANTS.COMMERCIAL.POCKET_FLOORS[dscr as keyof typeof CONSTANTS.COMMERCIAL.POCKET_FLOORS] || 0;

      scenarios.push({
        pad_percentage: pad * 100,
        dscr_level: dscr,
        noi_adjusted: noiAdjusted,
        max_loan: loanAmount,
        debt_service: maxAnnualDebtService,
        pocket_money: Math.max(noiAdjusted - maxAnnualDebtService, pocketFloor),
        loan_amount: loanAmount,
        purchase_price: loanAmount / CONSTANTS.COMMERCIAL.LTV,
      });
    });
  });

  return scenarios;
}

function calculateCeilingPrices(scenarios: Scenario[]) {
  return {
    ceiling_25k: scenarios.find((s) => s.pocket_money >= 25000)?.purchase_price || 0,
    ceiling_10k: scenarios.find((s) => s.pocket_money >= 10000)?.purchase_price || 0,
    breakeven: scenarios.find((s) => s.pocket_money >= 0)?.purchase_price || 0,
  };
}

function extractNumber(field?: FieldValue): number {
  if (!field) return 0;
  const value = field.value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
  }
  return 0;
}
