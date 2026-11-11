import React, { useState } from 'react';
import { Calendar, Flame, AlertCircle } from 'lucide-react';
import { useCurrency } from '../../../../shared/hooks/useCurrency';

interface DailySpendingPulseChartProps {
  dailyData: {
    date: string;
    dayLabel: string;
    income: number;
    expense: number;
    net: number;
    count: number;
  }[];
  dailyAverageExpense: number;
}

export const DailySpendingPulseChart: React.FC<DailySpendingPulseChartProps> = ({
  dailyData,
  dailyAverageExpense,
}) => {
  const { format } = useCurrency();
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    dayLabel: string;
    income: number;
    expense: number;
    net: number;
    count: number;
  } | null>(null);

  if (dailyData.length === 0) {
    return null;
  }

  // Find max daily expense to scale heights
  const maxExpense = Math.max(...dailyData.map((d) => d.expense), dailyAverageExpense, 50);
  const peakDay = dailyData.reduce((prev, curr) => (curr.expense > prev.expense ? curr : prev), dailyData[0]);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">
              Ritmo de Gasto Diario & Picos de Consumo
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribución temporal de salidas diarias en comparación con tu promedio ({format(dailyAverageExpense)}/día)
          </p>
        </div>

        {/* Peak day badge */}
        {peakDay && peakDay.expense > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 self-start sm:self-auto">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Pico: {peakDay.dayLabel} ({format(peakDay.expense)})</span>
          </div>
        )}
      </div>

      {/* Hover Info bar */}
      <div className="h-7 flex items-center justify-between text-xs text-slate-600 px-1">
        {hoveredDay ? (
          <div className="flex items-center gap-2 font-mono tabular-nums">
            <span className="font-bold text-slate-900 font-sans">{hoveredDay.dayLabel}:</span>
            <span className="text-rose-600 font-bold">Gasto: -{format(hoveredDay.expense)}</span>
            {hoveredDay.income > 0 && (
              <span className="text-emerald-600 font-bold">| Ingreso: +{format(hoveredDay.income)}</span>
            )}
            <span className="text-slate-400 font-normal">({hoveredDay.count} transacciones)</span>
          </div>
        ) : (
          <span className="text-slate-400 text-[11px]">
            Línea punteada indica el gasto promedio diario ({format(dailyAverageExpense)})
          </span>
        )}
      </div>

      {/* Bar timeline container */}
      <div className="relative pt-6 pb-2">
        {/* Average line indicator */}
        {dailyAverageExpense > 0 && (
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-slate-300 z-10 pointer-events-none flex items-center justify-end pr-2"
            style={{
              bottom: `${Math.min(95, Math.max(5, (dailyAverageExpense / maxExpense) * 100))}%`,
            }}
          >
            <span className="text-[10px] font-mono font-bold bg-white/90 px-1 text-slate-500 rounded">
              Promedio: {format(dailyAverageExpense)}
            </span>
          </div>
        )}

        {/* Bars Grid */}
        <div className="flex items-end gap-1.5 sm:gap-2 h-36 w-full overflow-x-auto pb-2 scrollbar-none">
          {dailyData.map((d) => {
            const heightPct = maxExpense > 0 ? (d.expense / maxExpense) * 100 : 0;
            const isAboveAvg = d.expense > dailyAverageExpense && d.expense > 0;
            const isPeak = d.date === peakDay?.date && d.expense > 0;
            const isHovered = hoveredDay?.date === d.date;

            return (
              <div
                key={d.date}
                className="flex-1 min-w-[20px] max-w-[42px] flex flex-col items-center gap-1 group cursor-pointer"
                onMouseEnter={() => setHoveredDay(d)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => setHoveredDay(d)}
              >
                {/* Visual Bar */}
                <div className="w-full bg-slate-100 rounded-t-lg h-28 flex items-end overflow-hidden p-0.5">
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isPeak
                        ? 'bg-rose-600'
                        : isAboveAvg
                        ? 'bg-amber-500'
                        : d.expense > 0
                        ? 'bg-emerald-500'
                        : 'bg-transparent'
                    } ${isHovered ? 'brightness-110 shadow-xs' : ''}`}
                    style={{ height: `${Math.max(d.expense > 0 ? 8 : 0, heightPct)}%` }}
                  />
                </div>

                {/* Day label */}
                <span className={`text-[10px] font-mono tabular-nums truncate transition-colors ${
                  isHovered ? 'text-slate-900 font-bold' : 'text-slate-400'
                }`}>
                  {d.dayLabel.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
