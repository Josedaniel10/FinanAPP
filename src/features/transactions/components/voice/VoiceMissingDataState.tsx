import React, { useState } from 'react';
import { HelpCircle, ArrowRight, CreditCard, DollarSign } from 'lucide-react';
import { VoiceTransactionResponse } from '../../services/ai-voice.service';
import { Category, Account, CreateTransactionPayload } from '../../types';
import { formatCOP } from './voiceDesignTokens';

interface VoiceMissingDataStateProps {
  data: VoiceTransactionResponse;
  accounts: Account[];
  categories: Category[];
  onCompleteMissingData: (updatedPayload: Partial<CreateTransactionPayload>) => void;
  onCancel: () => void;
}

export const VoiceMissingDataState: React.FC<VoiceMissingDataStateProps> = ({
  data,
  accounts,
  categories,
  onCompleteMissingData,
  onCancel,
}) => {
  const { suggestedPayload, raw } = data;

  const isAmountMissing = !suggestedPayload.amount || suggestedPayload.amount <= 0;
  const isAccountMissing = !suggestedPayload.accountId;

  const [customAmount, setCustomAmount] = useState('');

  // Quick amount suggestions for Colombian Pesos
  const amountSuggestions = [10000, 20000, 50000, 100000];

  const handleSelectAccount = (acc: Account) => {
    onCompleteMissingData({
      accountId: acc.id,
      amount: suggestedPayload.amount || Number(customAmount) || 0,
    });
  };

  const handleSelectAmount = (amt: number) => {
    onCompleteMissingData({
      amount: amt,
      accountId: suggestedPayload.accountId || accounts[0]?.id,
    });
  };

  const handleCustomAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(customAmount);
    if (val > 0) {
      onCompleteMissingData({
        amount: val,
        accountId: suggestedPayload.accountId || accounts[0]?.id,
      });
    }
  };

  return (
    <div className="flex flex-col px-3 py-2 text-center select-none">
      {/* Friendly Icon */}
      <div className="mx-auto w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center mb-1.5 shadow-2xs">
        <HelpCircle className="w-5 h-5" />
      </div>

      {/* Main question */}
      <h3 className="text-sm sm:text-base font-bold text-slate-900">
        {isAmountMissing
          ? '¿Cuál fue el valor del movimiento?'
          : isAccountMissing
          ? '¿Con qué cuenta realizaste el pago?'
          : '¿Cuál es la categoría correspondiente?'}
      </h3>

      <p className="text-[11px] text-slate-500 mt-0.5 mb-2.5">
        Detectamos "{raw.descripcion || 'tu movimiento'}", solo falta este dato para guardarlo.
      </p>

      {/* If Amount is missing */}
      {isAmountMissing && (
        <div className="w-full space-y-2 mb-2 text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Valores sugeridos
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {amountSuggestions.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => handleSelectAmount(amt)}
                className="min-h-[42px] py-2 px-3 rounded-xl border border-slate-200/80 bg-white text-xs font-bold text-slate-800 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>{formatCOP(amt)}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleCustomAmountSubmit} className="mt-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Otro valor en pesos..."
                className="flex-1 min-h-[42px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!customAmount || Number(customAmount) <= 0}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs cursor-pointer hover:bg-emerald-700 transition-all shadow-xs"
              >
                Continuar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* If Account is missing */}
      {!isAmountMissing && isAccountMissing && (
        <div className="w-full space-y-1.5 mb-2 text-left">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
            Selecciona tu cuenta
          </span>
          <div className="flex flex-col gap-1.5">
            {accounts.slice(0, 3).map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleSelectAccount(acc)}
                className="w-full min-h-[44px] p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-500 hover:bg-emerald-50/30 flex items-center justify-between group cursor-pointer transition-all active:scale-[0.99] shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold text-slate-800 block">
                      {acc.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Saldo: {formatCOP(acc.balance || 0)}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cancel button */}
      <button
        type="button"
        onClick={onCancel}
        className="text-xs font-semibold text-slate-500 hover:text-slate-800 mt-1 py-1 cursor-pointer transition-colors"
      >
        Cancelar y volver
      </button>
    </div>
  );
};
