import React, { useState, useEffect } from 'react';
import { Account } from '../services/account.service';
import { transactionService } from '../../transactions/services/transaction.service';
import { categoryService } from '../../categories/services/category.service';
import { DSBottomSheet, DSButton, DSInput, DSSelect, DSAlert } from '../../../design-system';
import { ArrowLeftRight, DollarSign, Calendar, FileText, ArrowRight } from 'lucide-react';
import { showToast } from '../../../stores/toastStore';
import { useQueryClient } from '@tanstack/react-query';
import { ACCOUNT_KEYS } from '../hooks/useAccountsQuery';
import { TRANSACTION_KEYS } from '../../transactions/hooks/useTransactionsQuery';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  defaultOriginAccountId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  accounts,
  defaultOriginAccountId,
}) => {
  const queryClient = useQueryClient();
  const [originId, setOriginId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [amount, setAmount] = useState('');
  const [destinationAmount, setDestinationAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transferCategoryId, setTransferCategoryId] = useState<string>('');

  // Find origin and destination account objects
  const originAccount = accounts.find((a) => a.id === originId) || null;
  const destinationAccount = accounts.find((a) => a.id === destinationId) || null;
  const isMultiCurrency =
    originAccount &&
    destinationAccount &&
    originAccount.currency !== destinationAccount.currency;

  useEffect(() => {
    // Resolve transfer category
    categoryService.getCategories().then((res) => {
      const cats = res.data;
      const transferCat =
        cats.find((c) => c.name.toLowerCase().includes('transfer') || (c.type as string) === 'TRANSFER') ||
        cats[0];
      if (transferCat) setTransferCategoryId(transferCat.id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setAmount('');
      setDestinationAmount('');
      setNotes('');
      setDate(new Date().toISOString().split('T')[0] || '');

      if (accounts.length >= 2) {
        const initialOrigin =
          (defaultOriginAccountId && accounts.find((a) => a.id === defaultOriginAccountId)?.id) ||
          accounts[0].id;
        setOriginId(initialOrigin);

        const initialDest = accounts.find((a) => a.id !== initialOrigin)?.id || accounts[1].id;
        setDestinationId(initialDest);
      }
    }
  }, [isOpen, accounts, defaultOriginAccountId]);

  // Handle amount change and auto sync destination amount if same currency
  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (!isMultiCurrency) {
      setDestinationAmount(val);
    }
  };

  const parsedAmount = parseFloat(amount) || 0;
  const parsedDestAmount = parseFloat(destinationAmount) || parsedAmount;

  const originNewBalance = originAccount ? originAccount.balance - parsedAmount : 0;
  const destinationNewBalance = destinationAccount
    ? destinationAccount.balance + parsedDestAmount
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!originId || !destinationId) {
      setError('Debes seleccionar tanto la cuenta de origen como la de destino.');
      return;
    }

    if (originId === destinationId) {
      setError('La cuenta de origen y de destino no pueden ser la misma.');
      return;
    }

    if (parsedAmount <= 0) {
      setError('Por favor ingresa un monto a transferir mayor a 0.');
      return;
    }

    if (originAccount && parsedAmount > originAccount.balance) {
      setError(
        `Saldo insuficiente en ${originAccount.name}. Saldo disponible: ${originAccount.currency} ${originAccount.balance.toFixed(2)}`
      );
      return;
    }

    if (isMultiCurrency && parsedDestAmount <= 0) {
      setError('Por favor especifica el monto recibido en la divisa de destino.');
      return;
    }

    setIsSubmitting(true);
    try {
      await transactionService.createTransaction({
        type: 'TRANSFER',
        amount: parsedAmount,
        accountId: originId,
        destinationAccountId: destinationId,
        destinationAmount: isMultiCurrency ? parsedDestAmount : undefined,
        categoryId: transferCategoryId,
        date,
        description: `Transferencia: ${originAccount?.name} → ${destinationAccount?.name}`,
        notes: notes.trim() || undefined,
        paymentMethod: 'TRANSFER',
      });

      // Invalidate relevant TanStack queries
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all });
      queryClient.invalidateQueries({ queryKey: TRANSACTION_KEYS.all });

      showToast({
        type: 'success',
        message: `Transferencia de ${originAccount?.currency} ${parsedAmount.toFixed(
          2
        )} realizada con éxito.`,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al procesar la transferencia entre cuentas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DSBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Transferir entre Cuentas"
      subtitle="Movimiento atómico de fondos entre cuentas propias con soporte multidivisa"
      maxHeight="75"
      footer={
        <div className="flex gap-3">
          <DSButton
            type="button"
            variant="outline"
            size="md"
            className="flex-1 min-h-[48px]"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </DSButton>
          <DSButton
            type="submit"
            variant="primary"
            size="md"
            className="flex-1 min-h-[48px]"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            disabled={accounts.length < 2}
          >
            Confirmar Transferencia
          </DSButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <DSAlert type="error" message={error} onClose={() => setError(null)} />}

        {accounts.length < 2 && (
          <DSAlert
            type="warning"
            message="Necesitas al menos 2 cuentas financieras registradas para realizar transferencias entre ellas."
          />
        )}

        {/* Source & Destination Account Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Source Account */}
          <div className="space-y-1">
            <DSSelect
              label="Cuenta de Origen (Debitar)"
              value={originId}
              onChange={(e) => setOriginId(e.target.value)}
              disabled={accounts.length < 2}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency} {acc.balance.toFixed(2)})
                </option>
              ))}
            </DSSelect>
            {originAccount && (
              <p className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>Disponible:</span>
                <span className="font-mono font-bold text-slate-800">
                  {originAccount.currency} {originAccount.balance.toFixed(2)}
                </span>
              </p>
            )}
          </div>

          {/* Destination Account */}
          <div className="space-y-1">
            <DSSelect
              label="Cuenta de Destino (Acreditar)"
              value={destinationId}
              onChange={(e) => setDestinationId(e.target.value)}
              disabled={accounts.length < 2}
            >
              {accounts
                .filter((a) => a.id !== originId)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency} {acc.balance.toFixed(2)})
                  </option>
                ))}
            </DSSelect>
            {destinationAccount && (
              <p className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>Saldo actual:</span>
                <span className="font-mono font-bold text-slate-800">
                  {destinationAccount.currency} {destinationAccount.balance.toFixed(2)}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Amount to transfer */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Monto a Transferir ({originAccount?.currency || 'USD'})
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-sm font-bold">
              {originAccount?.currency || '$'}
            </div>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.00"
              className="w-full min-h-[48px] pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono text-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>
        </div>

        {/* Multicurrency Destination Amount Field if currencies differ */}
        {isMultiCurrency && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span className="flex items-center gap-1.5">
                <ArrowLeftRight className="w-4 h-4 text-blue-600" /> Conversión Multidivisa
              </span>
              <span className="text-[11px] text-blue-600 font-medium">
                {originAccount?.currency} → {destinationAccount?.currency}
              </span>
            </div>
            <p className="text-[11px] text-blue-800">
              Las cuentas tienen monedas diferentes. Ingresa el monto exacto que se acreditará en{' '}
              <span className="font-bold">{destinationAccount?.currency}</span>:
            </p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-blue-600 font-mono text-sm font-bold">
                {destinationAccount?.currency}
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={destinationAmount}
                onChange={(e) => setDestinationAmount(e.target.value)}
                placeholder="0.00"
                className="w-full min-h-[44px] pl-14 pr-4 py-2 bg-white border border-blue-300 rounded-xl text-blue-950 font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        )}

        {/* Live Balance Preview Card */}
        {originAccount && destinationAccount && parsedAmount > 0 && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 text-xs space-y-2">
            <p className="font-semibold text-slate-700">Vista previa de saldos resultantes:</p>
            <div className="flex items-center justify-between text-slate-600">
              <span>{originAccount.name}:</span>
              <span className="font-mono tabular-nums">
                {originAccount.currency} {originAccount.balance.toFixed(2)} →{' '}
                <strong
                  className={originNewBalance < 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}
                >
                  {originAccount.currency} {originNewBalance.toFixed(2)}
                </strong>
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>{destinationAccount.name}:</span>
              <span className="font-mono tabular-nums">
                {destinationAccount.currency} {destinationAccount.balance.toFixed(2)} →{' '}
                <strong className="text-emerald-700 font-bold">
                  {destinationAccount.currency} {destinationNewBalance.toFixed(2)}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Date and Optional Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DSInput
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />
          <DSInput
            label="Nota / Concepto (Opcional)"
            placeholder="Ej. Ahorro quincenal, pago de tarjeta..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            leftIcon={<FileText className="w-4 h-4" />}
          />
        </div>
      </form>
    </DSBottomSheet>
  );
};
