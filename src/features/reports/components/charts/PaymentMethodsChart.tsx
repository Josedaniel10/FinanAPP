import React from 'react';
import { CreditCard, Banknote, ArrowRightLeft, MoreHorizontal, Layers } from 'lucide-react';
import { useCurrency } from '../../../../shared/hooks/useCurrency';

interface PaymentMethodItem {
  method: string;
  label: string;
  total: number;
  count: number;
  percentage: number;
}

interface PaymentMethodsChartProps {
  paymentMethods: PaymentMethodItem[];
}

export const PaymentMethodsChart: React.FC<PaymentMethodsChartProps> = ({ paymentMethods }) => {
  const { format } = useCurrency();

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      case 'DEBIT_CARD':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'CREDIT_CARD':
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case 'TRANSFER':
        return <ArrowRightLeft className="w-4 h-4 text-amber-600" />;
      default:
        return <MoreHorizontal className="w-4 h-4 text-slate-500" />;
    }
  };

  const getMethodBarColor = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'bg-emerald-500';
      case 'DEBIT_CARD':
        return 'bg-blue-500';
      case 'CREDIT_CARD':
        return 'bg-purple-500';
      case 'TRANSFER':
        return 'bg-amber-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-base text-slate-900">
            Canales y Métodos de Pago
          </h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {paymentMethods.length} canales
        </span>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="p-6 text-center text-slate-400 text-xs">
          No hay movimientos con método de pago registrado en este periodo.
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div
              key={pm.method}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-100/80 space-y-2 hover:bg-slate-100/60 transition-colors"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-white flex items-center justify-center shadow-2xs border border-slate-200/60">
                    {getMethodIcon(pm.method)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-tight">{pm.label}</p>
                    <p className="text-[11px] text-slate-400">{pm.count} transacciones</p>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <p className="font-black text-slate-900 text-sm">{format(pm.total)}</p>
                  <p className="text-[11px] font-semibold text-slate-500">{pm.percentage}% del volumen</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getMethodBarColor(pm.method)}`}
                  style={{ width: `${pm.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
