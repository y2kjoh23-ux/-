
export enum TaxType {
  TAX_FREE = '비과세',
  GENERAL = '일반(15.4%)'
}

export interface InvestmentParams {
  lumpSum: number;
  monthlyDeposit: number;
  adjustDepositForInflation: boolean;
  annualReturn: number;
  investmentPeriod: number;
  inflationRate: number;
  taxType: TaxType;
}

export interface CalculationResult {
  totalPrincipal: number;
  nominalFutureValue: number;
  afterTaxNominalValue: number;
  realPurchasingPower: number;
  yearlyUsableReal: number;
  monthlyUsableReal: number;
  chartData: ChartPoint[];
}

export interface ChartPoint {
  year: number;
  nominalValue: number;
  realValue: number;
  principal: number;
}
