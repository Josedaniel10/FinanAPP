import React, { useState, useMemo } from 'react';
import { PieChart as PieIcon, ListFilter, Tag, ArrowUpRight } from 'lucide-react';
import { useCurrency } from '../../../../shared/hooks/useCurrency';

interface CategoryItem {
  categoryName: string;
  categoryColor: string;
  total: number;
  count: number;
  percentage: number;
}

interface CategoryDonutChartProps {
  categories: CategoryItem[];
  totalExpenses: number;
  onSelectCategory?: (categoryName: string) => void;
  selectedCategoryName?: string;
}

// Helper to convert polar coordinates to Cartesian
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

// Helper to describe an SVG donut segment arc path
function describeDonutSegment(
  x: number,
  y: number,
  radius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  // Clamp 360 full circle
  const safeEndAngle = endAngle - startAngle >= 360 ? startAngle + 359.99 : endAngle;
  const start = polarToCartesian(x, y, radius, safeEndAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const innerStart = polarToCartesian(x, y, innerRadius, safeEndAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);

  const arcSweep = safeEndAngle - startAngle <= 180 ? '0' : '1';

  return [
    'M', start.x, start.y,
    'A', radius, radius, 0, arcSweep, 0, end.x, end.y,
    'L', innerEnd.x, innerEnd.y,
    'A', innerRadius, innerRadius, 0, arcSweep, 1, innerStart.x, innerStart.y,
    'Z',
  ].join(' ');
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  categories,
  totalExpenses,
  onSelectCategory,
  selectedCategoryName,
}) => {
  const { format } = useCurrency();
  const [hoveredCategory, setHoveredCategory] = useState<CategoryItem | null>(null);
  const [viewMode, setViewMode] = useState<'DONUT' | 'BARS'>('DONUT');

  // SVG Geometry
  const size = 260;
  const center = size / 2;
  const outerRadius = 110;
  const innerRadius = 72;
  const hoverOuterRadius = 118;

  // Compute angles for each category slice
  const slices = useMemo(() => {
    if (categories.length === 0 || totalExpenses <= 0) return [];

    let currentAngle = 0;
    return categories.map((cat) => {
      const sliceAngle = (cat.total / totalExpenses) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;

      return {
        ...cat,
        startAngle,
        endAngle,
      };
    });
  }, [categories, totalExpenses]);

  // Display category in center hole
  const activeFocus = hoveredCategory || (selectedCategoryName ? categories.find(c => c.categoryName === selectedCategoryName) : null);

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      {/* Chart Title and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-base text-slate-900">
              Distribución de Gastos por Categoría
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Concentración de salidas de dinero sobre el total de gastos ({categories.length} categorías)
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('DONUT')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode === 'DONUT'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>Gráfico Circular</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('BARS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              viewMode === 'BARS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-blue-600" />
            <span>Barras</span>
          </button>
        </div>
      </div>

      {categories.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Tag className="w-6 h-6 mb-1 text-slate-300" />
          <span>No hay gastos registrados en el periodo para calcular distribución</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* VIEW MODE 1: Interactive Donut Chart */}
          {viewMode === 'DONUT' ? (
            <div className="md:col-span-6 flex flex-col items-center justify-center relative">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="overflow-visible"
              >
                {/* Slices */}
                {slices.map((slice) => {
                  const isHovered = hoveredCategory?.categoryName === slice.categoryName;
                  const isSelected = selectedCategoryName === slice.categoryName;
                  const rad = isHovered || isSelected ? hoverOuterRadius : outerRadius;
                  const path = describeDonutSegment(
                    center,
                    center,
                    rad,
                    innerRadius,
                    slice.startAngle,
                    slice.endAngle
                  );

                  return (
                    <path
                      key={slice.categoryName}
                      d={path}
                      fill={slice.categoryColor}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="cursor-pointer transition-all duration-200 hover:opacity-90"
                      opacity={
                        hoveredCategory === null || isHovered || isSelected ? 1 : 0.45
                      }
                      onMouseEnter={() => setHoveredCategory(slice)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => onSelectCategory && onSelectCategory(slice.categoryName)}
                    />
                  );
                })}

                {/* Center Hole Content */}
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius - 4}
                  fill="#ffffff"
                  className="pointer-events-none drop-shadow-xs"
                />
              </svg>

              {/* Dynamic Center Text Overlay */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4"
                style={{ width: size, height: size, margin: 'auto' }}
              >
                {activeFocus ? (
                  <div className="space-y-0.5 max-w-[130px]">
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: activeFocus.categoryColor }}
                      />
                      <p className="text-[11px] font-bold text-slate-800 truncate">
                        {activeFocus.categoryName}
                      </p>
                    </div>
                    <p className="text-base font-black font-mono tabular-nums text-slate-900 leading-tight">
                      {format(activeFocus.total)}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full inline-block">
                      {activeFocus.percentage}% del total
                    </span>
                  </div>
                ) : (
                  <div className="space-y-0.5 max-w-[130px]">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Total Gastado
                    </p>
                    <p className="text-base font-black font-mono tabular-nums text-slate-900 leading-tight">
                      {format(totalExpenses)}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {categories.length} categorías
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: Ranked Linear Progress Bars */
            <div className="md:col-span-6 space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.categoryName}
                  className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedCategoryName === cat.categoryName
                      ? 'border-emerald-500 bg-emerald-50/30'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                  }`}
                  onClick={() => onSelectCategory && onSelectCategory(cat.categoryName)}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.categoryColor }}
                      />
                      <span>{cat.categoryName}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {format(cat.total)}{' '}
                      <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.categoryColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Legend / Category List Breakdown */}
          <div className="md:col-span-6 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase pb-1 border-b border-slate-100">
              <span>Categoría & Participación</span>
              <span>Monto Total</span>
            </div>

            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {categories.slice(0, 8).map((cat) => {
                const isHovered = hoveredCategory?.categoryName === cat.categoryName;
                const isSelected = selectedCategoryName === cat.categoryName;

                return (
                  <div
                    key={cat.categoryName}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200'
                        : isHovered
                        ? 'bg-slate-100'
                        : 'hover:bg-slate-50'
                    }`}
                    onMouseEnter={() => setHoveredCategory(cat)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => onSelectCategory && onSelectCategory(cat.categoryName)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: cat.categoryColor }}
                      />
                      <span className="truncate text-slate-800 font-medium">
                        {cat.categoryName}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        ({cat.count} mov.)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                      <span className="font-bold text-slate-900">
                        {format(cat.total)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 w-9 text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}

              {categories.length > 8 && (
                <p className="text-[11px] text-slate-400 text-center pt-1">
                  + {categories.length - 8} categorías adicionales en el libro contable
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
