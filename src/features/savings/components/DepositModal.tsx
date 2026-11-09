import React, { useState, useEffect } from 'react';
import { SavingsGoal } from '../services/savings.service';
import { useAccountsQuery } from '../../accounts/hooks/useAccountsQuery';
import { useContributeSavingsGoalMutation } from '../hooks/useSavingsQuery';
import { DSBottomSheet, DSButton, DSInput, DSSelect, DSAlert } from '../../../design-system';
import { PiggyBank, DollarSign, CreditCard, Sparkles, Check } from 'lucide-react';
import { showToast } from '../../../stores/toastStore';
import { useCurrency } from '../../../shared/hooks/useCurrency';
import { CurrencyAmountInput } from '../../../shared/components/CurrencyAmountInput';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { format, preferredCurrency, currencySymbol } = useCurrency();
  const { data: accounts = [] } = useAccountsQuery();
  const contributeMutation = useContributeSavingsGoalMutation();

  const [amount, setAmount] = useState('');
  const [shouldDeduct, setShouldDeduct] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setError(null);
      setShouldDeduct(Boolean(goal?.accountId));
      if (goal?.accountId) {
        setSelectedAccountId(goal.accountId);
      } else if (accounts.length > 0) {
        const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
        setSelectedAccountId(defaultAcc.id);
      }
    }
  }, [isOpen, goal, accounts]);

  if (!goal) return null;

  const parsedAmount = parseFloat(amount) || 0;
  const newCurrentAmount = goal.currentAmount + parsedAmount;
  const remainingBefore = Math.max(0, goal.targetAmount - goal.currentAmount);
  const remainingAfter = Math.max(0, goal.targetAmount - newCurrentAmount);
  const percentBefore = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
  const percentAfter = Math.min(100, Math.round((newCurrentAmount / goal.targetAmount) * 100));

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parsedAmount <= 0) {
      setError('Por favor ingresa un monto a aportar mayor a 0.');
      return;
    }

    if (shouldDeduct && selectedAccount && parsedAmount > selectedAccount.balance) {
      setError(
        `Saldo insuficiente en ${selectedAccount.name}. Saldo disponible: ${selectedAccount.currency} $${selectedAccount.balance.toFixed(2)}`
      );
      return;
    }

    try {
      await contributeMutation.mutateAsync({
        id: goal.id,
        amount: parsedAmount,
        deductFromAccountId: shouldDeduct ? selectedAccountId : undefined,
      });

      showToast({
        type: 'success',
        message:
          newCurrentAmount >= goal.targetAmount
            ? `🎉 ¡Felicidades! Has completado tu meta "${goal.name}".`
            : `¡Aporte de $${parsedAmount.toFixed(2)} registrado para "${goal.name}"!`,
      });

      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar el aporte a la meta.');
    }
  };

  return (
    <DSBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Aportar a Meta de Ahorro"
      subtitle={`Meta: ${goal.name}`}
      maxHeight="65"
      footer={
        <div className="flex gap-3">
          <DSButton
            type="button"
            variant="outline"
            size="md"
            className="flex-1 min-h-[48px]"
            onClick={onClose}
            disabled={contributeMutation.isPending}
          >
            Cancelar
          </DSButton>
          <DSButton
            type="submit"
            variant="primary"
            size="md"
            className="flex-1 min-h-[48px]"
            isLoading={contributeMutation.isPending}
            onClick={handleSubmit}
          >
            Confirmar Aporte
          </DSButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <DSAlert type="error" message={error} onClose={() => setError(null)} />}

        {/* Current Goal Progress Card */}
        <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Objetivo: {format(goal.targetAmount)}</span>
            <span className="font-semibold text-slate-700">Faltan: {format(remainingBefore)}</span>
          </div>

          <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden my-2">
            <div
              className="h-full bg-emerald-600 rounded-full transition-all duration-300"
              style={{ width: `${percentBefore}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-mono font-bold text-slate-900">
              {format(goal.currentAmount)} acumulados
            </span>
            <span className="font-bold text-emerald-700">{percentBefore}% completado</span>
          </div>
        </div>

        {/* Deposit Amount Input with live currency guidance */}
        <CurrencyAmountInput
          label="Monto a Aportar"
          value={amount}
          onChange={setAmount}
          currency={preferredCurrency}
          min={0.01}
          required
        />

        {/* Option to deduct from an account */}
        <div className="space-y-2">
          <div
            onClick={() => setShouldDeduct(!shouldDeduct)}
            className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors cursor-pointer select-none"
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                shouldDeduct ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
              }`}
            >
              {shouldDeduct && <Check className="w-4 h-4 stroke-[3]" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900">
                Descontar este monto de una cuenta financiera
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Resta el dinero de tu saldo disponible de forma automática.
              </p>
            </div>
          </div>

          {shouldDeduct && (
            <DSSelect
              label="Cuenta Origen del Aporte"
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency} ${acc.balance.toFixed(2)})
                </option>
              ))}
            </DSSelect>
          )}
        </div>

        {/* Live Simulation Preview */}
        {parsedAmount > 0 && (
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Simulación de avance:</span>
            </div>
            <p className="text-emerald-800">
              Tu ahorro aumentará a{' '}
              <strong className="font-mono">{format(newCurrentAmount)}</strong> ({percentAfter}
              % del objetivo).
            </p>
            {remainingAfter === 0 && (
              <p className="text-emerald-700 font-bold">
                🎉 ¡Este aporte completará tu meta financiera al 100%!
              </p>
            )}
          </div>
        )}
      </form>
    </DSBottomSheet>
  );
};
