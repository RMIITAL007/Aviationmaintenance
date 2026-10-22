import React from 'react';
import { ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';

export interface KPICardProps {
  title: string;
  value: string | number;
  change?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend = 'neutral',
  icon,
  subtitle,
  badge,
  badgeColor,
  onClick
}) => {
  const trendColors = {
    up: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60',
    down: 'text-rose-400 bg-rose-950/40 border-rose-800/60',
    neutral: 'text-slate-400 bg-slate-800/50 border-slate-700/60',
  };

  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : ArrowRight;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-slate-900/80 backdrop-blur border border-slate-800/90 shadow-xl transition-all duration-200 relative overflow-hidden group ${
        onClick ? 'cursor-pointer hover:border-sky-500/50 hover:shadow-[0_0_20px_-5px_rgba(56,189,248,0.2)] hover:-translate-y-0.5' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
            {badge && (
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full border ${badgeColor || 'text-sky-300 bg-sky-950/60 border-sky-800/80'}`}>
                {badge}
              </span>
            )}
          </div>
          <div className="flex items-baseline space-x-2.5">
            <h3 className="text-2xl font-extrabold text-white tracking-tight font-mono">
              {value}
            </h3>
            {change !== undefined && (
              <span className={`text-xs font-semibold font-mono flex items-center px-1.5 py-0.5 rounded border ${trendColors[trend]}`}>
                <TrendIcon className="w-3 h-3 mr-0.5" />
                <span>{change}</span>
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500/15 to-blue-600/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-[0_0_15px_-3px_rgba(56,189,248,0.2)] group-hover:scale-105 transition-transform flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
