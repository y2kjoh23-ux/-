
import { GoogleGenAI } from "@google/genai";
import { InvestmentParams, CalculationResult } from "../types";

export const getFinancialInsights = async (params: InvestmentParams, result: CalculationResult): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    전문 자산 관리사로서 다음 투자 계획에 대해 3~4문장으로 핵심 분석과 조언을 해주세요.
    친절하고 전문적인 어조를 사용하세요.

    [투자 데이터]
    - 거치금: ${params.lumpSum.toLocaleString()}원
    - 월 적립금: ${params.monthlyDeposit.toLocaleString()}원 (물가 상승 반영: ${params.adjustDepositForInflation ? '예' : '아니오'})
    - 예상 연 수익률: ${params.annualReturn}%
    - 투자 기간: ${params.investmentPeriod}년
    - 예상 물가 상승률: ${params.inflationRate}%
    - 과세 방식: ${params.taxType}

    [분석 결과]
    - 최종 세후 명목 자산: ${result.afterTaxNominalValue.toLocaleString()}원
    - 최종 실질 구매력 (현재 가치): ${result.realPurchasingPower.toLocaleString()}원
    - 실질 가치 기준 월 가용 금액: ${result.monthlyUsableReal.toLocaleString()}원

    사용자가 인플레이션의 위험을 이해하고 장기 투자의 복리 효과를 극대화할 수 있도록 격려해주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text || "분석 결과를 가져오는 중 오류가 발생했습니다.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI 분석 기능을 현재 사용할 수 없습니다. 잠시 후 다시 시도해주세요.";
  }
};
