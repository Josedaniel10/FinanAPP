import React, { useState } from 'react';
import { CategoryBreakdownItem, TransactionType } from '../types';
import { PieChart, TrendingDown, TrendingUp } from 'lucide-react';

interface CategorySummaryCardProps {
  breakdown: CategoryBreakdownItem[];
}

export const CategorySummaryCard: React.FC<CategorySummaryCardProps> = ({
  breakdown,
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>('EXPENSE');

  const filteredItems = breakdown.filter((item) => item.type === activeTab);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-emerald-600" />
          <span>Distribución por Categorías</span>
        </h2>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('EXPENSE')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'EXPENSE'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Gastos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('INCOME')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INCOME'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ingresos</span>
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          No hay movimientos de {activeTab === 'EXPENSE' ? 'gastos' : 'ingresos'} para calcular la distribución.
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => (
            <div key={item.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.categoryColor || '#10B981' }}
                  />
                  <span className="font-medium text-slate-700">
                    {item.categoryName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({item.count} {item.count === 1 ? 'mov.' : 'movs.'})
                  </span>
                </div>
                <div className="text-right font-semibold text-slate-800">
                  ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="ml-1 text-[11px] font-normal text-slate-400">
                    ({item.percentage}%)
                  </span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    backgroundColor: item.categoryColor || (activeTab === 'EXPENSE' ? '#F43F5E' : '#10B981'),
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
