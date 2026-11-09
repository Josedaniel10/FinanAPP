import React, { useState, useEffect } from 'react';
import { Account, AccountType, CreateAccountDto } from '../services/account.service';
import { DSBottomSheet, DSButton, DSInput, DSSelect, DSAlert } from '../../../design-system';
import { CreditCard, DollarSign, Tag, Check, Star } from 'lucide-react';
import { showToast } from '../../../stores/toastStore';

import { useCurrency } from '../../../shared/hooks/useCurrency';
import { POPULAR_CURRENCIES, getCurrencyInfo } from '../../../shared/constants/currencies';
import { CurrencyAmountInput } from '../../../shared/components/CurrencyAmountInput';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dto: CreateAccountDto, accountId?: string) => Promise<void>;
  initialAccount?: Account | null;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: 'Efectivo / Billetera',
  BANK: 'Cuenta Bancaria (Corriente/Nómina)',
  SAVINGS: 'Cuenta de Ahorros',
  CREDIT: 'Tarjeta de Crédito',
  INVESTMENT: 'Fondo de Inversión / Acciones',
  OTHER: 'Otra Cuenta',
};

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAccount,
}) => {
  const { preferredCurrency } = useCurrency();
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('CASH');
  const [currency, setCurrency] = useState(preferredCurrency);
  const [balance, setBalance] = useState('0.00');
  const [isDefault, setIsDefault] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name);
      setType(initialAccount.type);
      setCurrency(initialAccount.currency || preferredCurrency);
      setBalance(String(initialAccount.balance));
      setIsDefault(Boolean(initialAccount.isDefault));
    } else {
      setName('');
      setType('CASH');
      setCurrency(preferredCurrency);
      setBalance('0.00');
      setIsDefault(false);
    }
    setError(null);
  }, [initialAccount, isOpen, preferredCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('El nombre de la cuenta es obligatorio.');
      return;
    }

    const parsedBalance = parseFloat(balance);
    if (isNaN(parsedBalance)) {
      setError('Por favor ingresa un saldo numérico válido.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(
        {
          name: name.trim(),
          type,
          currency,
          balance: parsedBalance,
          isDefault,
        },
        initialAccount?.id
      );

      showToast({
        type: 'success',
        message: initialAccount
          ? `Cuenta "${name}" actualizada correctamente.`
          : `Cuenta "${name}" creada exitosamente.`,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar la cuenta financiera.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DSBottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={initialAccount ? 'Editar Cuenta Financiera' : 'Nueva Cuenta Financiera'}
      subtitle="Administración de cuentas bancarias, efectivo, tarjetas y divisas"
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
            {initialAccount ? 'Guardar Cambios' : 'Crear Cuenta'}
          </DSButton>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <DSAlert type="error" message={error} onClose={() => setError(null)} />}

        {/* Account Name */}
        <DSInput
          label="Nombre de la Cuenta"
          required
          placeholder="Ej. Billetera Personal, Cuenta Nómina, BBVA Ahorros..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          leftIcon={<CreditCard className="w-4 h-4" />}
        />

        {/* Account Type */}
        <DSSelect
          label="Tipo de Cuenta"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
        >
          {Object.entries(ACCOUNT_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </DSSelect>

        {/* Currency & Initial Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DSSelect
            label="Moneda (Divisa)"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {POPULAR_CURRENCIES.map((curr) => (
              <option key={curr.code} value={curr.code}>
                {curr.flag} {curr.code} - {curr.name} ({curr.symbol})
              </option>
            ))}
          </DSSelect>

          <CurrencyAmountInput
            label={initialAccount ? 'Saldo Actual' : 'Saldo Inicial'}
            value={balance}
            onChange={setBalance}
            currency={currency}
            required
          />
        </div>

        {/* Default Account Checkbox with 48x48 touch hit target */}
        <div
          onClick={() => setIsDefault(!isDefault)}
          className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-slate-100/70 transition-colors cursor-pointer select-none"
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              isDefault ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
            }`}
          >
            {isDefault && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Cuenta Predeterminada</span>
              {isDefault && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Se seleccionará automáticamente al registrar nuevos movimientos rápidos.
            </p>
          </div>
        </div>
      </form>
    </DSBottomSheet>
  );
};
