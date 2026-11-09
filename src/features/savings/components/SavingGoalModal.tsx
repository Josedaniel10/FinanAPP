import React, { useState, useEffect } from 'react';
import { SavingsGoal, CreateSavingsGoalDto, savingsService } from '../services/savings.service';
import { useAccountsQuery } from '../../accounts/hooks/useAccountsQuery';
import { DSBottomSheet, DSButton, DSInput, DSSelect, DSAlert } from '../../../design-system';
import { PiggyBank, Target, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { showToast } from '../../../stores/toastStore';
import { useQueryClient } from '@tanstack/react-query';
import { SAVINGS_KEYS } from '../hooks/useSavingsQuery';
import { useCurrency } from '../../../shared/hooks/useCurrency';
import { CurrencyAmountInput } from '../../../shared/components/CurrencyAmountInput';

interface SavingGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoal?: SavingsGoal | null;
}

const PRESET_COLORS = [
  '#059669', // Emerald
  '#2563EB', // Blue
  '#7C3AED', // Violet
  '#D97706', // Amber
  '#E11D48', // Rose
  '#0D9488', // Teal
];

export const SavingGoalModal: React.FC<SavingGoalModalProps> = ({
  isOpen,
  onClose,
  initialGoal,
}) => {
  const { preferredCurrency, currencySymbol } = useCurrency();
  const queryClient = useQueryClient();
  const { data: accounts = [] } = useAccountsQuery();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#059669');
  const [accountId, setAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialGoal) {
      setName(initialGoal.name);
      setTargetAmount(String(initialGoal.targetAmount));
      setCurrentAmount(String(initialGoal.currentAmount || 0));
      setTargetDate(initialGoal.targetDate || '');
      setColor(initialGoal.color || '#059669');
      setAccountId(initialGoal.accountId || '');
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('');
      setColor('#059669');
      setAccountId('');
    }
    setError(null);
  }, [initialGoal, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre de la meta es obligatorio.');
      return;
    }

    const parsedTarget = parseFloat(targetAmount);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setError('Por favor ingresa un monto objetivo válido mayor a 0.');
      return;
    }

    const parsedCurrent = parseFloat(currentAmount) || 0;

    setIsSubmitting(true);
    try {
      const payload: CreateSavingsGoalDto = {
        name: name.trim(),
        targetAmount: parsedTarget,
        currentAmount: parsedCurrent,
        targetDate: targetDate || undefined,
        color,
        accountId: accountId || undefined,
      };

      if (initialGoal) {
        await savingsService.update(initialGoal.id, payload);
        showToast({
          type: 'success',
          message: `Meta "${name}" actualizada correctamente.`,
        });
      } else {
        await savingsService.create(payload);
        showToast({
          type: 'success',
          message: `Meta de ahorro "${name}" creada con éxito.`,
        });
      }

      queryClient.invalidateQueries({ queryKey: SAVINGS_KEYS.all });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la meta de ahorro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DSBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialGoal ? 'Editar Meta de Ahorro' : 'Nueva Meta de Ahorro'}
      subtitle="Define tus objetivos financieros a corto y largo plazo"
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
          >
            {initialGoal ? 'Guardar Cambios' : 'Crear Meta'}
          </DSButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <DSAlert type="error" message={error} onClose={() => setError(null)} />}

        {/* Goal Name */}
        <DSInput
          label="Nombre de la Meta"
          required
          placeholder="Ej. Fondo de Emergencia, Vacaciones 2027, Laptop Nueva..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<Target className="w-4 h-4" />}
        />

        {/* Target Amount & Initial Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CurrencyAmountInput
            label="Monto Objetivo"
            value={targetAmount}
            onChange={setTargetAmount}
            currency={preferredCurrency}
            min={0.01}
            required
          />

          <CurrencyAmountInput
            label={initialGoal ? 'Ahorro Actual' : 'Aporte Inicial'}
            value={currentAmount}
            onChange={setCurrentAmount}
            currency={preferredCurrency}
            min={0}
          />
        </div>

        {/* Target Date & Linked Account */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DSInput
            label="Fecha Límite (Opcional)"
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            leftIcon={<Calendar className="w-4 h-4" />}
          />

          <DSSelect
            label="Cuenta Vinculada (Opcional)"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            <option value="">Ninguna cuenta específica</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.currency} ${acc.balance.toFixed(2)})
              </option>
            ))}
          </DSSelect>
        </div>

        {/* Color Palette Selector */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
            Color Identificador
          </label>
          <div className="flex items-center gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-transform cursor-pointer flex items-center justify-center ${
                  color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>
      </form>
    </DSBottomSheet>
  );
};
