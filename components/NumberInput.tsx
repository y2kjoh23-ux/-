
import React from 'react';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  step?: number;
  min?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, unit, step = 10000, min = 0 }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center px-0.5">
        <label className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{label}</label>
        <span className="text-[9px] font-medium text-slate-400 uppercase">{unit}</span>
      </div>
      <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:bg-white focus-within:border-indigo-400 transition-all shadow-inner">
        <button 
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-900 hover:text-indigo-600 hover:border-indigo-300 active:scale-90 transition-all shadow-sm"
        >
          <i className="fas fa-minus text-[10px]"></i>
        </button>
        <div className="flex-1 flex flex-col items-center">
            <input 
              type="text"
              inputMode="numeric"
              value={new Intl.NumberFormat('ko-KR').format(value)}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^0-9]/g, '');
                onChange(Number(raw));
              }}
              className="w-full text-center text-lg font-black text-slate-900 focus:outline-none bg-transparent tracking-tighter"
            />
        </div>
        <button 
          onClick={() => onChange(value + step)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-900 hover:text-indigo-600 hover:border-indigo-300 active:scale-90 transition-all shadow-sm"
        >
          <i className="fas fa-plus text-[10px]"></i>
        </button>
      </div>
    </div>
  );
};

export default NumberInput;
