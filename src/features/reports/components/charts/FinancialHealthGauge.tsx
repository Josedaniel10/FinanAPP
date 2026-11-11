import React from 'react';
import { ShieldCheck, Target, AlertCircle, Award, Compass, TrendingUp } from 'lucide-react';
import { useCurrency } from '../../../../shared/hooks/useCurrency';

interface FinancialHealthGaugeProps {
  savingsRate: number;
  netSavings: number;
  totalIncome: number;
  rule503020: {
    needsAmount: number;
    needsPercentage: number;
    wantsAmount: number;
    wantsPercentage: number;
    savingsAmount: number;
    savingsPercentage: number;
    baseIncome: number;
  };
}

export const FinancialHealthGauge: React.FC<FinancialHealthGaugeProps> = ({
  savingsRate,
  netSavings,
  totalIncome,
  rule503020,
}) => {
  const { format } = useCurrency();

  // Semi-circle gauge geometry
  const width = 240;
  const height = 140;
  const cx = width / 2;
  const cy = 120;
  const radius = 95;
  const strokeWidth = 16;

  // Clamp savings rate between -20 and 100 for gauge angle representation
  const clampedRate = Math.max(-20, Math.min(100, savingsRate));
  // Angle: -180 deg (left, 0% or negative) to 0 deg (right, 100%)
  // Normalized 0 to 1
  const normalized = Math.max(0, Math.min(1, (clampedRate + 20) / 120));
  const needleAngle = -180 + normalized * 180;

  // Arc path generator
  const createArc = (startAngleDeg: number, endAngleDeg: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const startX = cx + radius * Math.cos(toRad(startAngleDeg));
    const startY = cy + radius * Math.sin(toRad(startAngleDeg));
    const endX = cx + radius * Math.cos(toRad(endAngleDeg));
    const endY = cy + radius * Math.sin(toRad(endAngleDeg));
    const largeArc = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
    return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
  };

  // Needle tip
  const needleLen = radius - 18;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleTipX = cx + needleLen * Math.cos(needleRad);
  const needleTipY = cy + needleLen * Math.sin(needleRad);

  // Status diagnostics
  const getStatus = () => {
    if (totalIncome === 0 && netSavings === 0) {
      return {
        label: 'Sin Datos',
        color: 'text-slate-600',
        bg: 'bg-slate-50',
        desc: 'Registra ingresos y gastos en este periodo para calcular tu salud financiera.',
      };
    }
    if (netSavings < 0) {
      return {
        label: 'Déficit Financiero',
        color: 'text-rose-700',
        bg: 'bg-rose-50 border-rose-200',
        desc: 'Tus gastos superan tus ingresos. Ajusta consumos no esenciales para recuperar el equilibrio.',
      };
    }
    if (savingsRate >= 20) {
      return {
        label: 'Salud Financiera Óptima',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50 border-emerald-200',
        desc: '¡Excelente! Cumples y superas la meta recomendada del 20% de ahorro e inversión.',
      };
    }
    if (savingsRate >= 10) {
      return {
        label: 'Ahorro Moderado',
        color: 'text-amber-700',
        bg: 'bg-amber-50 border-amber-200',
        desc: 'Tienes superávit, pero estás por debajo del umbral del 20% del modelo 50/30/20.',
      };
    }
    return {
      label: 'Margen Ajustado',
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-200',
      desc: 'Tu capacidad de ahorro es menor al 10%. Evalúa recortes en gastos discrecionales.',
    };
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">
              Salud Financiera & Metodología 50/30/20
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluación contra los estándares internacionales de finanzas personales
          </p>
        </div>

        <div className={`px-3 py-1 rounded-xl text-xs font-bold border self-start sm:self-auto ${status.bg} ${status.color}`}>
          {status.label}
        </div>
      </div>

      {/* Grid: Speedometer Gauge on Left, 50/30/20 Breakdown on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Speedometer Gauge */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
          >
            {/* Red Zone: -180 to -144 deg (0 to 10%) */}
            <path
              d={createArc(-180, -144)}
              fill="none"
              stroke="#f43f5e"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {/* Amber Zone: -144 to -108 deg (10 to 20%) */}
            <path
              d={createArc(-144, -108)}
              fill="none"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
            />
            {/* Green Zone: -108 to 0 deg (20 to 100%) */}
            <path
              d={createArc(-108, 0)}
              fill="none"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Target 20% Marker */}
            {(() => {
              const markerRad = (-108 * Math.PI) / 180;
              const x1 = cx + (radius - 12) * Math.cos(markerRad);
              const y1 = cy + (radius - 12) * Math.sin(markerRad);
              const x2 = cx + (radius + 12) * Math.cos(markerRad);
              const y2 = cy + (radius + 12) * Math.sin(markerRad);
              return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#0f172a" strokeWidth={2.5} />;
            })()}

            {/* Needle */}
            <line
              x1={cx}
              y1={cy}
              x2={needleTipX}
              y2={needleTipY}
              stroke="#0f172a"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r={7} fill="#0f172a" />
            <circle cx={cx} cy={cy} r={3} fill="#ffffff" />

            {/* Gauge Labels */}
            <text x={cx - radius} y={cy + 18} textAnchor="middle" className="text-[10px] fill-rose-600 font-bold font-mono">
              0%
            </text>
            <text x={cx - 30} y={cy - radius + 8} textAnchor="middle" className="text-[10px] fill-amber-700 font-bold font-mono">
              20% Meta
            </text>
            <text x={cx + radius} y={cy + 18} textAnchor="middle" className="text-[10px] fill-emerald-700 font-bold font-mono">
              100%
            </text>
          </svg>

          {/* Value Display */}
          <div className="text-center mt-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black font-mono tabular-nums text-slate-900">
                {savingsRate}%
              </span>
              <span className="text-xs font-semibold text-slate-500">
                tasa de ahorro
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xs text-center">
              {status.desc}
            </p>
          </div>
        </div>

        {/* 50/30/20 Framework Cards */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-100 font-medium">
            <span>Regla 50/30/20: Tu presupuesto actual</span>
            <span className="font-mono tabular-nums">Base: {format(rule503020.baseIncome)}</span>
          </div>

          {/* 50% Needs */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="font-bold text-slate-800">50% Necesidades Básicas</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">(Vivienda, Servicios, Comida, Salud)</span>
              </div>
              <div className="font-mono tabular-nums text-right">
                <span className="font-bold text-slate-900">{format(rule503020.needsAmount)}</span>
                <span className={`ml-1.5 text-xs font-bold ${rule503020.needsPercentage <= 50 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {rule503020.needsPercentage}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rule503020.needsPercentage <= 50 ? 'bg-blue-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, rule503020.needsPercentage)}%` }}
              />
            </div>
          </div>

          {/* 30% Wants */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span className="font-bold text-slate-800">30% Deseos & Estilo de Vida</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">(Ocio, Compras, Salidas)</span>
              </div>
              <div className="font-mono tabular-nums text-right">
                <span className="font-bold text-slate-900">{format(rule503020.wantsAmount)}</span>
                <span className={`ml-1.5 text-xs font-bold ${rule503020.wantsPercentage <= 30 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {rule503020.wantsPercentage}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rule503020.wantsPercentage <= 30 ? 'bg-purple-500' : 'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, rule503020.wantsPercentage)}%` }}
              />
            </div>
          </div>

          {/* 20% Savings */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-bold text-slate-800">20% Ahorro & Inversión</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">(Superávit, Fondos, Futuro)</span>
              </div>
              <div className="font-mono tabular-nums text-right">
                <span className="font-bold text-slate-900">{format(rule503020.savingsAmount)}</span>
                <span className={`ml-1.5 text-xs font-bold ${rule503020.savingsPercentage >= 20 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {rule503020.savingsPercentage}%
                </span>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, rule503020.savingsPercentage)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
