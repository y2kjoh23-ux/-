
import React from 'react';

interface DashboardCardProps {
  label: string;
  value: string;
  subValue?: string;
  variant?: 'default' | 'highlight' | 'success';
}

const DashboardCard: React.FC<DashboardCardProps> = ({ label, value, subValue, variant = 'default' }) => {
  const styles = {
    default: "bg-white border-slate-100 text-slate-900",
    highlight: "bg-white border-indigo-100 text-indigo-900",
    success: "bg-white border-emerald-100 text-emerald-900",
  };

  const accentColor = {
    default: "text-slate-400",
    highlight: "text-indigo-600",
    success: "text-emerald-600",
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm ${styles[variant]} transition-all hover:shadow-md group overflow-hidden relative`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className={`text-xl font-black tracking-tight ${variant !== 'default' ? accentColor[variant] : ''}`}>{value}</h3>
      </div>
      {subValue && (
        <p className="mt-2 text-[11px] font-bold text-slate-300 italic tracking-tight">{subValue}</p>
      )}
    </div>
  );
};

export default DashboardCard;
