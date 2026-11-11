import React, { useState, useMemo } from 'react';
import { TrendingUp, BarChart2, Activity, Layers, Info } from 'lucide-react';
import { useCurrency } from '../../../../shared/hooks/useCurrency';

interface CashFlowPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
  cumulativeSavings?: number;
}

interface CashFlowChartProps {
  monthlyData: { monthLabel: string; income: number; expense: number; savings: number }[];
  dailyData: { date: string; dayLabel: string; income: number; expense: number; net: number; count: number }[];
  cumulativeData: { label: string; income: number; expense: number; net: number; cumulativeSavings: number }[];
}

export const CashFlowChart: React.FC<CashFlowChartProps> = ({
  monthlyData,
  dailyData,
  cumulativeData,
}) => {
  const { format } = useCurrency();
  const [chartMode, setChartMode] = useState<'BARS' | 'SPLINE' | 'CUMULATIVE'>('BARS');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Choose appropriate dataset: if multiple months, use monthly; if single month, use daily (or sample if too many days)
  const isMultiMonth = monthlyData.length > 1;
  const points: CashFlowPoint[] = useMemo(() => {
    if (chartMode === 'CUMULATIVE') {
      return cumulativeData.map((d) => ({
        label: d.label,
        income: d.income,
        expense: d.expense,
        net: d.net,
        cumulativeSavings: d.cumulativeSavings,
      }));
    }

    if (isMultiMonth) {
      return monthlyData.map((m) => ({
        label: m.monthLabel,
        income: m.income,
        expense: m.expense,
        net: m.savings,
      }));
    }

    // Single month: use daily data
    if (dailyData.length > 0) {
      return dailyData.map((d) => ({
        label: d.dayLabel,
        income: d.income,
        expense: d.expense,
        net: d.net,
      }));
    }

    return [];
  }, [chartMode, isMultiMonth, monthlyData, dailyData, cumulativeData]);

  // Chart dimensions & scaling
  const width = 800;
  const height = 300;
  const padding = { top: 28, right: 30, bottom: 45, left: 65 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Compute maximum values for scaling
  const maxVal = useMemo(() => {
    if (points.length === 0) return 100;
    if (chartMode === 'CUMULATIVE') {
      const allVals = points.map((p) => p.cumulativeSavings ?? 0);
      const absMax = Math.max(...allVals.map(Math.abs), 10);
      return Math.ceil(absMax * 1.15);
    }
    const maxInc = Math.max(...points.map((p) => p.income), 0);
    const maxExp = Math.max(...points.map((p) => p.expense), 0);
    const top = Math.max(maxInc, maxExp, 50);
    return Math.ceil(top * 1.15);
  }, [points, chartMode]);

  // For Spline and Cumulative mode, we can have negative values
  const minVal = useMemo(() => {
    if (chartMode === 'CUMULATIVE') {
      const allVals = points.map((p) => p.cumulativeSavings ?? 0);
      const min = Math.min(...allVals, 0);
      return Math.floor(min * 1.15);
    }
    if (chartMode === 'SPLINE') {
      const allNets = points.map((p) => p.net);
      const min = Math.min(...allNets, 0);
      return Math.floor(min * 1.15);
    }
    return 0;
  }, [points, chartMode]);

  const valueRange = maxVal - minVal || 1;
  const zeroY = padding.top + plotHeight - ((0 - minVal) / valueRange) * plotHeight;

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return padding.top + plotHeight - ((clamped - minVal) / valueRange) * plotHeight;
  };

  const getX = (index: number) => {
    if (points.length <= 1) return padding.left + plotWidth / 2;
    return padding.left + (index / (points.length - 1)) * plotWidth;
  };

  // Generate SVG path for Spline
  const splineAreaPath = useMemo(() => {
    if (points.length === 0) return '';
    const coords = points.map((p, idx) => ({
      x: getX(idx),
      y: getY(chartMode === 'CUMULATIVE' ? (p.cumulativeSavings ?? 0) : p.net),
    }));

    if (coords.length === 1) {
      return `M ${coords[0].x - 20} ${coords[0].y} L ${coords[0].x + 20} ${coords[0].y} L ${coords[0].x + 20} ${zeroY} L ${coords[0].x - 20} ${zeroY} Z`;
    }

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }

    // Close area to baseline
    const last = coords[coords.length - 1];
    const first = coords[0];
    d += ` L ${last.x} ${zeroY} L ${first.x} ${zeroY} Z`;
    return d;
  }, [points, chartMode, maxVal, minVal, zeroY]);

  const splineLinePath = useMemo(() => {
    if (points.length === 0) return '';
    const coords = points.map((p, idx) => ({
      x: getX(idx),
      y: getY(chartMode === 'CUMULATIVE' ? (p.cumulativeSavings ?? 0) : p.net),
    }));

    if (coords.length === 1) {
      return `M ${coords[0].x - 20} ${coords[0].y} L ${coords[0].x + 20} ${coords[0].y}`;
    }

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const curr = coords[i];
      const next = coords[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
    return d;
  }, [points, chartMode, maxVal, minVal]);

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      {/* Chart Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">
              Evolución y Flujo de Caja
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isMultiMonth
              ? 'Análisis comparativo mensual de ingresos, gastos y ahorro'
              : 'Comportamiento diario de flujo monetario en el periodo seleccionado'}
          </p>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setChartMode('BARS');
              setHoveredIndex(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              chartMode === 'BARS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ingresos vs Gastos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChartMode('SPLINE');
              setHoveredIndex(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              chartMode === 'SPLINE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Ahorro Neto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setChartMode('CUMULATIVE');
              setHoveredIndex(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              chartMode === 'CUMULATIVE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-600" />
            <span>Acumulado</span>
          </button>
        </div>
      </div>

      {/* Legend & Interactive Hover State Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
        {/* Static Legend */}
        <div className="flex items-center gap-4 text-slate-600 font-medium">
          {chartMode === 'BARS' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                <span>Ingresos (+)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500" />
                <span>Gastos (-)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-blue-500 rounded-full" />
                <span>Ahorro Neto</span>
              </div>
            </>
          ) : chartMode === 'SPLINE' ? (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Curva de Ahorro / Superávit</span>
              <span className="text-slate-400">· Línea punteada indica umbral $0</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-600" />
              <span>Crecimiento Acumulado del Capital</span>
            </div>
          )}
        </div>

        {/* Hover Highlight Badge */}
        {activePoint ? (
          <div className="flex items-center gap-2 font-mono tabular-nums text-xs bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
            <span className="font-sans font-bold text-slate-800">{activePoint.label}:</span>
            {chartMode === 'CUMULATIVE' ? (
              <span className={activePoint.cumulativeSavings! >= 0 ? 'text-purple-700 font-bold' : 'text-rose-600 font-bold'}>
                Acumulado: {format(activePoint.cumulativeSavings ?? 0)}
              </span>
            ) : (
              <>
                <span className="text-emerald-600 font-bold">+{format(activePoint.income)}</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600 font-bold">-{format(activePoint.expense)}</span>
                <span className="text-slate-300">|</span>
                <span className={activePoint.net >= 0 ? 'text-blue-600 font-bold' : 'text-rose-600 font-bold'}>
                  Neto: {format(activePoint.net)}
                </span>
              </>
            )}
          </div>
        ) : (
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Pasa el cursor o presiona cualquier punto para ver detalles
          </span>
        )}
      </div>

      {/* SVG Canvas Area */}
      {points.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Info className="w-6 h-6 mb-1 text-slate-300" />
          <span>No hay movimientos registrados para graficar en este periodo</span>
        </div>
      ) : (
        <div className="relative w-full overflow-x-auto select-none">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto min-h-[240px] max-h-[340px] overflow-visible"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.32" />
                <stop offset="90%" stopColor="#3b82f6" stopOpacity="0.02" />
              </linearGradient>

              <linearGradient id="cumulativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9333ea" stopOpacity="0.35" />
                <stop offset="90%" stopColor="#9333ea" stopOpacity="0.03" />
              </linearGradient>

              <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>

              <linearGradient id="expenseBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
              const val = minVal + pct * valueRange;
              const y = getY(val);
              return (
                <g key={pct}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={val === 0 ? '0' : '4 4'}
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono tabular-nums"
                  >
                    ${Math.round(val).toLocaleString('es-ES')}
                  </text>
                </g>
              );
            })}

            {/* Zero Baseline indicator if visible */}
            {zeroY >= padding.top && zeroY <= height - padding.bottom && (
              <line
                x1={padding.left}
                y1={zeroY}
                x2={width - padding.right}
                y2={zeroY}
                stroke="#cbd5e1"
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
            )}

            {/* RENDER MODE 1: Grouped Bars */}
            {chartMode === 'BARS' && (
              <g>
                {points.map((p, idx) => {
                  const groupWidth = plotWidth / points.length;
                  const centerX = padding.left + idx * groupWidth + groupWidth / 2;
                  const barWidth = Math.min(22, Math.max(7, (groupWidth - 8) / 2));
                  const incHeight = Math.max(2, ((p.income - 0) / valueRange) * plotHeight);
                  const expHeight = Math.max(2, ((p.expense - 0) / valueRange) * plotHeight);

                  const incY = getY(p.income);
                  const expY = getY(p.expense);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g
                      key={p.label + idx}
                      className="cursor-pointer transition-opacity"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setHoveredIndex(idx)}
                      opacity={hoveredIndex === null || isHovered ? 1 : 0.45}
                    >
                      {/* Invisible hover zone */}
                      <rect
                        x={centerX - groupWidth / 2}
                        y={padding.top}
                        width={groupWidth}
                        height={plotHeight}
                        fill="transparent"
                      />

                      {/* Income Bar (Emerald) */}
                      {p.income > 0 && (
                        <rect
                          x={centerX - barWidth - 1.5}
                          y={incY}
                          width={barWidth}
                          height={incHeight}
                          rx={3}
                          fill="url(#incomeBarGrad)"
                          className="transition-all duration-200"
                        />
                      )}

                      {/* Expense Bar (Rose) */}
                      {p.expense > 0 && (
                        <rect
                          x={centerX + 1.5}
                          y={expY}
                          width={barWidth}
                          height={expHeight}
                          rx={3}
                          fill="url(#expenseBarGrad)"
                          className="transition-all duration-200"
                        />
                      )}

                      {/* Net Savings Marker Dot */}
                      <circle
                        cx={centerX}
                        cy={getY(p.net)}
                        r={isHovered ? 5 : 3.5}
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* RENDER MODE 2: Spline Area (Net Savings) */}
            {chartMode === 'SPLINE' && (
              <g>
                {/* Area under curve */}
                <path d={splineAreaPath} fill="url(#splineGradient)" />
                {/* Line on top */}
                <path
                  d={splineLinePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Points */}
                {points.map((p, idx) => {
                  const cx = getX(idx);
                  const cy = getY(p.net);
                  const isHovered = hoveredIndex === idx;
                  return (
                    <g
                      key={p.label + idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setHoveredIndex(idx)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6 : 4}
                        fill={p.net >= 0 ? '#3b82f6' : '#ef4444'}
                        stroke="#ffffff"
                        strokeWidth={2}
                        className="transition-all duration-150"
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* RENDER MODE 3: Cumulative Growth Curve */}
            {chartMode === 'CUMULATIVE' && (
              <g>
                <path d={splineAreaPath} fill="url(#cumulativeGradient)" />
                <path
                  d={splineLinePath}
                  fill="none"
                  stroke="#9333ea"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {points.map((p, idx) => {
                  const cx = getX(idx);
                  const cy = getY(p.cumulativeSavings ?? 0);
                  const isHovered = hoveredIndex === idx;
                  return (
                    <g
                      key={p.label + idx}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => setHoveredIndex(idx)}
                    >
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 6.5 : 4}
                        fill="#9333ea"
                        stroke="#ffffff"
                        strokeWidth={2}
                      />
                    </g>
                  );
                })}
              </g>
            )}

            {/* X-Axis labels */}
            {points.map((p, idx) => {
              // Determine if we should display every label or skip every second if too dense
              const step = points.length > 15 ? Math.ceil(points.length / 8) : 1;
              if (idx % step !== 0 && idx !== points.length - 1) return null;

              const x =
                chartMode === 'BARS'
                  ? padding.left + idx * (plotWidth / points.length) + (plotWidth / points.length) / 2
                  : getX(idx);

              return (
                <text
                  key={idx}
                  x={x}
                  y={height - padding.bottom + 20}
                  textAnchor="middle"
                  className={`text-[11px] font-sans transition-colors ${
                    hoveredIndex === idx ? 'fill-slate-900 font-bold' : 'fill-slate-500'
                  }`}
                >
                  {p.label}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};
