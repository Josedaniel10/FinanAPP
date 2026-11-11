import React, { useState } from 'react';
import {
  TrendingDown,
  TrendingUp,
  ArrowLeftRight,
  Tag,
  CreditCard,
  Calendar,
  Building2,
  Check,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import { VoiceTransactionResponse } from '../../services/ai-voice.service';
import { Category, Account, CreateTransactionPayload } from '../../types';
import { formatCOP, triggerHaptic } from './voiceDesignTokens';

interface VoiceConfirmationStateProps {
  data: VoiceTransactionResponse;
  categories: Category[];
  accounts: Account[];
  onConfirm: (payload: CreateTransactionPayload) => void;
  onRepeat: () => void;
  onOpenFullEdit?: (payload: Partial<CreateTransactionPayload>) => void;
}

export const VoiceConfirmationState: React.FC<VoiceConfirmationStateProps> = ({
  data,
  categories,
  accounts,
  onConfirm,
  onRepeat,
  onOpenFullEdit,
}) => {
  const { suggestedPayload, raw } = data;

  // Local editable states for quick tap-to-edit
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER'>(suggestedPayload.type);
  const [amount, setAmount] = useState<number>(suggestedPayload.amount || 0);
  const [description, setDescription] = useState<string>(
    suggestedPayload.description || raw.descripcion || 'Movimiento'
  );
  const [categoryId, setCategoryId] = useState<string>(suggestedPayload.categoryId || '');
  const [accountId, setAccountId] = useState<string>(
    suggestedPayload.accountId || (accounts[0]?.id ?? '')
  );
  const [date, setDate] = useState<string>(
    suggestedPayload.date || raw.fecha_movimiento || new Date().toISOString().split('T')[0]
  );

  // Field editing toggles
  const [editingField, setEditingField] = useState<string | null>(null);

  const isIncome = type === 'INCOME';
  const isTransfer = type === 'TRANSFER';

  const badgeClasses = isIncome
    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/90'
    : isTransfer
    ? 'bg-teal-50 text-teal-800 border border-teal-200/90'
    : 'bg-rose-50 text-rose-800 border border-rose-200/90';

  const typeLabel = isIncome ? 'Ingreso' : isTransfer ? 'Transferencia' : 'Gasto';

  const handleConfirmClick = () => {
    triggerHaptic('confirm');
    const finalPayload: CreateTransactionPayload = {
      type,
      amount: Number(amount) || 0,
      description: description.trim() || 'Movimiento',
      categoryId: categoryId || categories[0]?.id || '',
      accountId: accountId || accounts[0]?.id || '',
      date,
      notes: raw.comercio ? `Comercio: ${raw.comercio}` : undefined,
    };
    onConfirm(finalPayload);
  };

  return (
    <div className="flex flex-col px-3 py-1.5 select-none">
      {/* Header bar: Type Badge & Commerce */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center gap-1 shrink-0 ${badgeClasses}`}
          >
            {isIncome ? (
              <TrendingUp className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
            ) : isTransfer ? (
              <ArrowLeftRight className="w-3 h-3 text-teal-600 stroke-[2.5]" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-600 stroke-[2.5]" />
            )}
            <span>{typeLabel}</span>
          </span>
          {raw.comercio && (
            <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1 truncate">
              • <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{raw.comercio}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() =>
            setType((prev) =>
              prev === 'EXPENSE' ? 'INCOME' : prev === 'INCOME' ? 'TRANSFER' : 'EXPENSE'
            )
          }
          className="text-[11px] font-semibold text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer shrink-0 ml-2"
        >
          Cambiar tipo
        </button>
      </div>

      {/* Main Container matching FinanAPP light theme */}
      <div className="w-full rounded-2xl bg-slate-50 border border-slate-200/80 p-2.5 shadow-2xs space-y-2">
        {/* Large Formatted Amount (Pure white card inside) */}
        <div className="text-center py-1.5 px-3 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
            Monto a registrar
          </span>
          {editingField === 'amount' ? (
            <div className="flex items-center justify-center gap-2 max-w-[180px] mx-auto">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                onBlur={() => setEditingField(null)}
                autoFocus
                className="w-full text-xl font-black text-center rounded-lg border border-emerald-500 px-2 py-0.5 bg-emerald-50/50 text-slate-900"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingField('amount')}
              className="group cursor-pointer inline-flex items-center gap-1.5 focus:outline-none"
              title="Toca para editar monto"
            >
              <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900">
                {formatCOP(amount)}
              </span>
              <Edit2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 opacity-60 group-hover:opacity-100 transition-all" />
            </button>
          )}
        </div>

        {/* Details 2x2 Grid on white cards */}
        <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-700">
          {/* Description */}
          <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
              Descripción
            </span>
            {editingField === 'description' ? (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => setEditingField(null)}
                autoFocus
                className="w-full text-xs font-semibold rounded px-1.5 py-0.5 bg-white border border-slate-300"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingField('description')}
                className="w-full text-left font-semibold text-slate-800 truncate cursor-pointer block"
              >
                {description || 'Sin descripción'}
              </button>
            )}
          </div>

          {/* Category */}
          <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
              Categoría
            </span>
            <div className="flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer truncate text-xs"
              >
                <option value="">Categoría...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account */}
          <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
              Cuenta
            </span>
            <div className="flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-slate-500 shrink-0" />
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer truncate text-xs"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date */}
          <div className="p-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
            <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">
              Fecha
            </span>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Full-Width Confirm Button (FinanAPP Emerald) */}
      <button
        type="button"
        onClick={handleConfirmClick}
        aria-label="Confirmar y registrar movimiento"
        className="w-full min-h-[46px] mt-2.5 py-2.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99] transition-all bg-emerald-600 hover:bg-emerald-700"
      >
        <Check className="w-4 h-4 stroke-[2.5]" />
        <span>Confirmar movimiento</span>
      </button>

      {/* Secondary Actions: Repetir / Editar detalle */}
      <div className="flex items-center justify-between mt-2 px-1">
        <button
          type="button"
          onClick={onRepeat}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Repetir audio</span>
        </button>

        {onOpenFullEdit && (
          <button
            type="button"
            onClick={() =>
              onOpenFullEdit({
                type,
                amount,
                description,
                categoryId: categoryId || categories[0]?.id || '',
                accountId,
                date,
              })
            }
            className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1 py-1 cursor-pointer"
          >
            <span>Editar formulario</span>
          </button>
        )}
      </div>
    </div>
  );
};
