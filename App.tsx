
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { InvestmentParams, TaxType, CalculationResult } from './types';
import { calculateInvestment } from './utils/financeUtils';
import { getFinancialInsights } from './services/geminiService';
import NumberInput from './components/NumberInput';

const APP_VERSION = "v3.3";

/**
 * 2025년 최신 시장 데이터가 반영된 자산별 연평균 총수익률(TR)
 * 주식 자산: 최근 15년 평균 (2010-2025)
 * 비트코인: 최근 5년 평균 (2020-2025, 제도권 편입 이후 데이터 중심)
 */
const HISTORICAL_RETURNS = {
  kospi: 6.5,   
  sp500: 13.8,  
  nasdaq: 18.5, 
  btc: 58.5     // 최근 5년 CAGR
};

const App: React.FC = () => {
  const dateInfo = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthStr = String(currentMonth).padStart(2, '0');
    
    return {
      currentYear,
      currentMonth,
      label15Y: `${currentYear - 15}.${monthStr} ~ ${currentYear}.${monthStr}`,
      label5Y: `${currentYear - 5}.${monthStr} ~ ${currentYear}.${monthStr}`
    };
  }, []);

  const [params, setParams] = useState<InvestmentParams>({
    lumpSum: 10000000,
    monthlyDeposit: 1000000,
    adjustDepositForInflation: false,
    annualReturn: HISTORICAL_RETURNS.sp500,
    investmentPeriod: 20,
    inflationRate: 4.0, 
    taxType: TaxType.TAX_FREE
  });

  const [aiInsight, setAiInsight] = useState<string>("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const result = useMemo(() => calculateInvestment(params), [params]);

  const handleAiInsight = useCallback(async () => {
    setIsAiLoading(true);
    const insight = await getFinancialInsights(params, result);
    setAiInsight(insight);
    setIsAiLoading(false);
  }, [params, result]);

  useEffect(() => {
    setAiInsight("");
  }, [params.investmentPeriod, params.annualReturn, params.inflationRate]);

  const updateParam = <K extends keyof InvestmentParams>(key: K, value: InvestmentParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrencyParts = (value: number) => {
    const formatted = new Intl.NumberFormat('ko-KR', {
      maximumFractionDigits: 0
    }).format(value);
    return { value: formatted, unit: '원' };
  };

  const CurrencyDisplay = ({ value, size = 'md', color = '#0F172A', isBold = true }: { value: number, size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl', color?: string, isBold?: boolean }) => {
    const { value: val, unit } = formatCurrencyParts(value);
    const len = val.length;
    const isLarge = len > 10;
    const isExtreme = len > 13;

    const sizeMap = {
      xs: isLarge ? 'text-[10px]' : 'text-[11px]',
      sm: isLarge ? 'text-[13px]' : 'text-sm',
      md: isExtreme ? 'text-lg' : (isLarge ? 'text-xl' : 'text-2xl'),
      lg: isExtreme ? 'text-xl' : (isLarge ? 'text-2xl' : 'text-3xl'),
      xl: isExtreme ? 'text-3xl' : (isLarge ? 'text-4xl' : 'text-5xl')
    };

    const unitSizeMap = {
      xs: 'text-[8px]',
      sm: 'text-[10px]',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-xl'
    };

    return (
      <span className={`${sizeMap[size]} ${isBold ? 'font-black' : 'font-bold'} tracking-tighter transition-all duration-200 inline-block`} style={{ color }}>
        {val}<span className={`${unitSizeMap[size]} font-normal ml-0.5 opacity-40`}>{unit}</span>
      </span>
    );
  };

  const presets = useMemo(() => ({
    cagr: [
      { label: 'KOSPI', value: HISTORICAL_RETURNS.kospi, icon: 'fa-landmark', period: '15Y' },
      { label: 'S&P 500', value: HISTORICAL_RETURNS.sp500, icon: 'fa-chart-line', period: '15Y' },
      { label: 'Nasdaq', value: HISTORICAL_RETURNS.nasdaq, icon: 'fa-bolt', period: '15Y' },
      { label: 'BTC', value: HISTORICAL_RETURNS.btc, icon: 'fa-bitcoin-sign', isVolatile: true, period: '5Y' },
    ],
    periods: [10, 20, 30, 40, 50],
    inflation: [2, 3, 4, 5, 6, 7]
  }), []);

  const getButtonClass = (isActive: boolean) => {
    const base = "relative py-3 px-1 rounded-xl text-[10px] font-bold transition-all border outline-none active:scale-95 flex flex-col items-center justify-center gap-1 overflow-hidden";
    return isActive 
      ? `${base} bg-indigo-600 text-white border-indigo-600 shadow-md`
      : `${base} bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100`;
  };

  const currentPeriodLabel = useMemo(() => {
    const selectedPreset = presets.cagr.find(p => p.value === params.annualReturn);
    if (selectedPreset?.period === '5Y') return dateInfo.label5Y;
    return dateInfo.label15Y;
  }, [params.annualReturn, presets.cagr, dateInfo]);

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex flex-col items-center">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 flex justify-center">
        <div className="w-full max-w-xl px-6 py-3.5 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Wealth Simulator</span>
            <h1 className="text-md font-extrabold text-slate-900 tracking-tight flex items-baseline">
              RealValue <span className="text-indigo-600 ml-1">Pro</span>
              <span className="ml-2 text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase">{APP_VERSION}</span>
            </h1>
          </div>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all active:scale-95 shadow-sm"
          >
            <i className={`fas ${showSettings ? 'fa-times' : 'fa-sliders-h'} text-sm`}></i>
          </button>
        </div>
      </header>

      <main className="w-full max-w-xl flex flex-col gap-5 py-5 px-5 sm:px-0 mb-20">
        
        {/* Main Asset Cards */}
        <section className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col divide-y divide-slate-100">
          <div className="flex divide-x divide-slate-100">
            <div className="flex-1 p-5 flex flex-col gap-1">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">총 납입 원금</p>
              <div className="truncate">
                <CurrencyDisplay value={result.totalPrincipal} size="sm" color="#334155" />
              </div>
            </div>
            <div className="flex-1 p-5 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">최종 명목 자산</p>
                <span className="text-[8px] font-bold text-slate-400 bg-slate-50 px-1 rounded">세후</span>
              </div>
              <div className="truncate">
                <CurrencyDisplay value={result.afterTaxNominalValue} size="sm" color="#334155" />
              </div>
            </div>
          </div>

          <div className="p-7 bg-indigo-600 flex flex-col gap-5 text-white relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <div className="flex flex-col gap-1.5 relative z-10">
              <div className="flex justify-between items-center">
                <p className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">최종 실질 구매력 (현재 가치)</p>
                <button onClick={() => setShowInfo(true)} className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <i className="fas fa-info text-[10px]"></i>
                </button>
              </div>
              <div className="flex flex-wrap items-baseline">
                 <CurrencyDisplay value={result.realPurchasingPower} size="xl" color="#FFFFFF" />
              </div>
              <p className="text-[12px] text-indigo-100/80 font-medium leading-relaxed mt-0.5">
                {params.investmentPeriod}년 후의 자산을 현재 가치로 환산한 금액입니다.
              </p>
            </div>

            <div className="p-4 bg-indigo-950/40 rounded-2xl border border-white/10 backdrop-blur-md flex flex-col gap-1.5 relative z-10 border-l-4 border-l-indigo-400">
              <p className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest">실질 기준 매월 생활비 가용액</p>
              <CurrencyDisplay value={result.monthlyUsableReal} size="md" color="#FFFFFF" />
              <p className="text-[10px] text-indigo-200/50 font-medium italic">
                자산의 실질 가치를 유지하면서 지출할 수 있는 금액입니다.
              </p>
            </div>
          </div>
        </section>

        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6" onClick={() => setShowInfo(false)}>
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-black text-slate-900 tracking-tight">수익률 산출 근거</h4>
                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
              <div className="space-y-4 text-[13px] text-slate-600 leading-relaxed">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="font-bold text-slate-900 mb-1">TR(Total Return) 방식</p>
                  <p>단순 가격 변동뿐만 아니라 지급된 배당금을 즉시 재투자했을 때의 성과를 반영합니다. 장기 투자 시 복리 효과가 극대화됩니다.</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="font-bold text-indigo-800 mb-1">자산별 기준 기간 (v3.3)</p>
                  <p>주식 시장은 장기 추세인 <strong>최근 15년</strong> 데이터를 사용하며, 비트코인(BTC)은 자산 성격의 변화를 반영하여 <strong>최근 5년</strong> 평균을 사용합니다.</p>
                </div>
              </div>
              <button onClick={() => setShowInfo(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-xl">이해했습니다</button>
            </div>
          </div>
        )}

        {/* AI Insight Section */}
        <section className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <i className="fas fa-magic text-white text-[9px]"></i>
               </div>
               <span className="text-[13px] font-bold text-slate-800 tracking-tight">AI 자산 진단</span>
            </div>
            {!aiInsight && !isAiLoading && (
              <button 
                onClick={handleAiInsight}
                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                진단하기
              </button>
            )}
          </div>
          <div className="min-h-[40px] flex items-center px-1">
            {isAiLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[11px] font-bold text-slate-400">데이터 분석 중...</p>
              </div>
            ) : aiInsight ? (
              <p className="text-[12px] leading-relaxed text-slate-600 font-medium italic">"{aiInsight}"</p>
            ) : (
              <p className="text-[11px] text-slate-400">내 자산 상황에 최적화된 맞춤형 조언을 드립니다.</p>
            )}
          </div>
        </section>

        {/* Chart Section */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 pb-0 flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">성장 시뮬레이션</h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-600">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div> 명목
              </span>
              <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div> 실질
              </span>
            </div>
          </div>
          <div className="h-[220px] w-full mt-5 chart-container px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={result.chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}}
                  dy={10}
                  interval={Math.floor(params.investmentPeriod / 5)}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 9, fontWeight: 700}}
                  tickFormatter={(val) => val >= 100000000 ? `${(val / 100000000).toFixed(0)}억` : `${(val / 10000).toFixed(0)}만`}
                  width={45}
                />
                <Tooltip 
                  cursor={{stroke: '#CBD5E1', strokeWidth: 1}}
                  contentStyle={{borderRadius: '16px', border: '1px solid #F1F5F9', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px'}}
                  formatter={(value: number) => [`${formatCurrencyParts(value).value}원`, '']}
                  labelFormatter={() => ""}
                  labelStyle={{ display: 'none' }}
                />
                <Area type="monotone" dataKey="nominalValue" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNominal)" />
                <Area type="monotone" dataKey="realValue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Inputs */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-7 space-y-9">
          <div className="space-y-9">
            <NumberInput 
              label="초기 투자 원금" 
              value={params.lumpSum} 
              onChange={(v) => updateParam('lumpSum', v)} 
              unit="KRW"
              step={1000000}
            />
            
            <div className="space-y-4">
              <NumberInput 
                label="매월 적립액" 
                value={params.monthlyDeposit} 
                onChange={(v) => updateParam('monthlyDeposit', v)} 
                unit="KRW"
                step={100000}
              />
              <div className="flex items-center justify-between bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                <div className="flex flex-col">
                  <span className="text-[12px] font-black text-slate-800 tracking-tight">물가 연동 적립</span>
                  <span className="text-[10px] text-slate-400 font-medium">인플레이션만큼 매년 납입금을 자동 증액합니다.</span>
                </div>
                <button 
                  onClick={() => updateParam('adjustDepositForInflation', !params.adjustDepositForInflation)}
                  className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1 border-2 ${params.adjustDepositForInflation ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-200 border-slate-200'}`}
                  aria-label="물가 연동 적립 토글"
                >
                  {/* ON/OFF Label Indicator */}
                  <span className={`absolute text-[8px] font-black tracking-tighter transition-all uppercase ${params.adjustDepositForInflation ? 'left-2.5 text-white opacity-100' : 'right-2.5 text-slate-400 opacity-0'}`}>ON</span>
                  <span className={`absolute text-[8px] font-black tracking-tighter transition-all uppercase ${params.adjustDepositForInflation ? 'left-2.5 text-white opacity-0' : 'right-2.5 text-slate-400 opacity-100'}`}>OFF</span>
                  
                  {/* Toggle Knob */}
                  <div className={`w-5 h-5 bg-white rounded-full absolute transition-all duration-300 shadow-lg transform ${params.adjustDepositForInflation ? 'translate-x-7' : 'translate-x-0'}`}>
                    {params.adjustDepositForInflation && <div className="absolute inset-0 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></div></div>}
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-baseline px-0.5">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">목표 수익률 (TR 기준)</label>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{currentPeriodLabel} 기준</span>
                  </div>
                  <span className="text-xl font-black text-indigo-600 tracking-tighter">{params.annualReturn}%</span>
               </div>
               <input 
                type="range" 
                min="0" max="150" step="0.5"
                value={params.annualReturn}
                onChange={(e) => updateParam('annualReturn', parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="grid grid-cols-4 gap-2">
                {presets.cagr.map(p => (
                  <button 
                    key={p.label}
                    onClick={() => updateParam('annualReturn', p.value)}
                    className={getButtonClass(params.annualReturn === p.value)}
                  >
                    <div className="flex items-center gap-1">
                      <i className={`fas ${p.icon} ${params.annualReturn === p.value ? 'opacity-100' : 'opacity-40'} text-[10px]`}></i>
                      <span className="text-[8px] opacity-60 font-black">{p.period}</span>
                    </div>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
               <div className="flex justify-between items-baseline px-0.5">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest">투자기간 (년)</label>
                  <span className="text-xl font-black text-indigo-600 tracking-tighter">{params.investmentPeriod}년</span>
               </div>
               <input 
                type="range" 
                min="1" max="60" step="1"
                value={params.investmentPeriod}
                onChange={(e) => updateParam('investmentPeriod', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="grid grid-cols-5 gap-2">
                {presets.periods.map(v => (
                  <button 
                    key={v}
                    onClick={() => updateParam('investmentPeriod', v)}
                    className={getButtonClass(params.investmentPeriod === v)}
                  >
                    {v}년
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <footer className="text-center px-4 mb-16 space-y-3 opacity-40">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.25em]">Wealth Intelligence Lab</p>
            <p className="text-[9px] text-slate-500 leading-relaxed max-w-sm mx-auto font-medium">
              네이버 금융 월 복리 계산 방식(기초 납입)을 기준으로 산출되었습니다.<br/>
              주식 15년 / BTC 5년 TR 데이터를 기반으로 매월 최신화됩니다.
            </p>
        </footer>
      </main>

      {/* Settings Drawer */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300 px-4 pb-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-7"></div>
            <div className="space-y-7">
              <div className="space-y-4">
                <div className="flex justify-between items-baseline px-1">
                  <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest">장기 물가 상승률 전망</label>
                  <span className="text-xl font-black text-indigo-600">{params.inflationRate}%</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {presets.inflation.map(v => (
                    <button 
                      key={v}
                      onClick={() => updateParam('inflationRate', v)}
                      className={getButtonClass(params.inflationRate === v)}
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-900 mb-4 uppercase tracking-widest text-center">세제 혜택 계좌 여부</label>
                <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
                  {Object.values(TaxType).map(t => (
                    <button 
                      key={t}
                      onClick={() => updateParam('taxType', t)}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all ${params.taxType === t ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setShowSettings(false)} className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm active:scale-95 transition-all shadow-lg outline-none">설정 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
