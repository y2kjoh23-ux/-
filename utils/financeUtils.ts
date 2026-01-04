
import { InvestmentParams, CalculationResult, TaxType, ChartPoint } from '../types';

export const calculateInvestment = (params: InvestmentParams): CalculationResult => {
  const { 
    lumpSum, monthlyDeposit, adjustDepositForInflation, 
    annualReturn, investmentPeriod, inflationRate, taxType 
  } = params;

  // monthly interest rate
  const r_monthly = (annualReturn / 100) / 12;
  // annual inflation rate
  const i_annual = inflationRate / 100;
  
  const taxRate = taxType === TaxType.GENERAL ? 0.154 : 0;
  
  let currentNominal = lumpSum;
  let totalPrincipal = lumpSum;
  let chartData: ChartPoint[] = [{
    year: 0,
    nominalValue: lumpSum,
    realValue: lumpSum,
    principal: lumpSum
  }];

  for (let year = 1; year <= investmentPeriod; year++) {
    // Current year's monthly contribution
    let monthlyContribution = monthlyDeposit;
    if (adjustDepositForInflation) {
      // If enabled, increase contribution based on inflation from previous years
      monthlyContribution = monthlyDeposit * Math.pow(1 + i_annual, year - 1);
    }

    for (let month = 1; month <= 12; month++) {
      /**
       * To match Naver's "Compound Interest" Financial Calculator:
       * 1. Deposit is made at the beginning of the month.
       * 2. Interest is applied at the end of the month based on the balance.
       */
      currentNominal += monthlyContribution;
      currentNominal *= (1 + r_monthly);
      totalPrincipal += monthlyContribution;
    }

    // Purchasing power (Real Value)
    // Discounting by annual inflation
    const realValue = currentNominal / Math.pow(1 + i_annual, year);

    chartData.push({
      year,
      nominalValue: Math.round(currentNominal),
      realValue: Math.round(realValue),
      principal: Math.round(totalPrincipal)
    });
  }

  const profit = currentNominal - totalPrincipal;
  const tax = profit > 0 ? profit * taxRate : 0;
  const afterTaxNominalValue = currentNominal - tax;
  
  // Final Real Purchasing Power based on After Tax Value
  const realPurchasingPower = afterTaxNominalValue / Math.pow(1 + i_annual, investmentPeriod);
  
  /**
   * Usable monthly real amount logic:
   * (Real Value * Real Return Rate) / 12
   * Real Return Rate = ((1 + r) / (1 + i)) - 1
   */
  const r_annual = annualReturn / 100;
  const realRate_annual = ((1 + r_annual) / (1 + i_annual)) - 1;
  const yearlyUsableReal = realRate_annual > 0 ? realPurchasingPower * realRate_annual : 0;
  const monthlyUsableReal = yearlyUsableReal / 12;

  return {
    totalPrincipal: Math.round(totalPrincipal),
    nominalFutureValue: Math.round(currentNominal),
    afterTaxNominalValue: Math.round(afterTaxNominalValue),
    realPurchasingPower: Math.round(realPurchasingPower),
    yearlyUsableReal: Math.round(yearlyUsableReal),
    monthlyUsableReal: Math.round(monthlyUsableReal),
    chartData
  };
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(value);
};
