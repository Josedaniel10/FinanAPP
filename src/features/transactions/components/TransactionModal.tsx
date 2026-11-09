import React, { useState, useEffect } from 'react';
import {
  Transaction,
  TransactionType,
  Category,
  Account,
  RecurrenceType,
  PaymentMethodType,
  CreateTransactionPayload,
} from '../types';
import {
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  Plus,
} from 'lucide-react';
import { CategoryModal } from '../../categories/components/CategoryModal';
import { categoryService } from '../../categories/services/category.service';
import { CreateCategoryPayload } from '../../categories/types';
import { DSBottomSheet, DSButton, DSInput, DSSelect, DSAlert } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';
import { useCurrency } from '../../../shared/hooks/useCurrency';
import { getCurrencyInfo } from '../../../shared/constants/currencies';
import { CurrencyAmountInput } from '../../../shared/components/CurrencyAmountInput';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateTransactionPayload, editId?: string) => Promise<void>;
  categories: Category[];
  accounts: Account[];
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  onCategoryCreated?: (category: Category) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories: initialCategories,
  accounts,
  initialTransaction,
  defaultType = 'EXPENSE',
  onCategoryCreated,
}) => {
  const { preferredCurrency } = useCurrency();
  const [localCategories, setLocalCategories] = useState<Category[]>(initialCategories);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [destinationAmount, setDestinationAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0] || '');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('NONE');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const activeCurrency = selectedAccount?.currency || preferredCurrency;
  const activeSymbol = getCurrencyInfo(activeCurrency).symbol;

  useEffect(() => {
    setLocalCategories(initialCategories);
  }, [initialCategories]);

  const availableCategories = localCategories.filter((c) =>
    type === 'TRANSFER' ? true : c.type === type
  );

  const handleInlineCreateCategory = async (payload: CreateCategoryPayload) => {
    const res = await categoryService.createCategory(payload);
    const newCat = res.data;
    setLocalCategories((prev) => [...prev, newCat]);
    setCategoryId(newCat.id);
    if (onCategoryCreated) {
      onCategoryCreated(newCat);
    }
    setIsCategoryModalOpen(false);
    showToast({ type: 'success', message: `Categoría "${newCat.name}" creada.` });
  };

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(String(initialTransaction.amount));
      setDescription(initialTransaction.description);
      setCategoryId(initialTransaction.categoryId);
      setAccountId(initialTransaction.accountId);
      setDestinationAccountId(initialTransaction.destinationAccountId || '');
      setDestinationAmount(
        initialTransaction.destinationAmount ? String(initialTransaction.destinationAmount) : ''
      );
      setDate(initialTransaction.date);
      setRecurrence(initialTransaction.recurrence || 'NONE');
      setPaymentMethod(initialTransaction.paymentMethod || 'CASH');
      setNotes(initialTransaction.notes || '');
    } else {
      setType(defaultType);
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0] || '');
      setRecurrence('NONE');
      setPaymentMethod('CASH');
      setNotes('');
      setDestinationAccountId('');
      setDestinationAmount('');

      if (accounts.length > 0) {
        const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
        setAccountId(defaultAcc.id);
        const secondAcc = accounts.find((a) => a.id !== defaultAcc.id);
        if (secondAcc) setDestinationAccountId(secondAcc.id);
      }
      if (initialCategories.length > 0) {
        const matchingCat = initialCategories.find(
          (c) => defaultType === 'TRANSFER' || c.type === defaultType
        );
        if (matchingCat) setCategoryId(matchingCat.id);
      }
    }
    setError(null);
  }, [initialTransaction, isOpen, defaultType, accounts, initialCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Por favor ingresa un monto válido mayor a 0');
      return;
    }

    if (!description.trim()) {
      setError('Por favor ingresa una descripción para el movimiento');
      return;
    }

    if (!categoryId) {
      setError('Por favor selecciona una categoría');
      return;
    }

    if (type === 'TRANSFER') {
      if (!destinationAccountId) {
        setError('Debes seleccionar una cuenta de destino para la transferencia');
        return;
      }
      if (destinationAccountId === accountId) {
        setError('La cuenta de destino no puede ser igual a la cuenta de origen');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTransactionPayload = {
        amount: parsedAmount,
        type,
        categoryId,
        accountId: accountId || undefined,
        destinationAccountId: type === 'TRANSFER' ? destinationAccountId : undefined,
        destinationAmount:
          type === 'TRANSFER' && destinationAmount ? parseFloat(destinationAmount) : undefined,
        date,
        description: description.trim(),
        recurrence,
        paymentMethod,
        notes: notes.trim() || undefined,
      };

      await onSave(payload, initialTransaction?.id);
      showToast({
        type: 'success',
        message: initialTransaction ? 'Movimiento actualizado correctamente' : 'Movimiento registrado con éxito',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al guardar el movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <DSBottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={initialTransaction ? 'Editar Movimiento' : 'Nuevo Movimiento'}
        subtitle="Registro táctil rápido de ingresos, gastos y transferencias"
        maxHeight="75"
        footer={
          <div className="flex gap-3">
            <DSButton
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 min-h-[48px]"
            >
              Cancelar
            </DSButton>
            <DSButton
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              onClick={handleSubmit}
              className="flex-1 min-h-[48px]"
            >
              {initialTransaction ? 'Guardar Cambios' : 'Registrar'}
            </DSButton>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <DSAlert type="error" message={error} onClose={() => setError(null)} />}

          {/* Type Selector (Horizontal Segmented Buttons with 44px min height) */}
          <div className="p-1 bg-slate-100 rounded-2xl grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingDown className="w-4 h-4" />
              <span>Gasto</span>
            </button>

            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'TRANSFER'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transferir</span>
            </button>
          </div>

          {/* Amount Input with live currency guidance */}
          <CurrencyAmountInput
            label="Monto"
            value={amount}
            onChange={setAmount}
            currency={activeCurrency}
            min={0.01}
            required
          />

          {/* Description */}
          <DSInput
            label="Descripción"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej. Supermercado, Alquiler, Salario..."
          />

          {/* Accounts: Origin and optional Destination for Transfer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DSSelect
              label={type === 'TRANSFER' ? 'Cuenta Origen' : 'Cuenta'}
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              leftIcon={<CreditCard className="w-4 h-4" />}
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency} {acc.balance.toFixed(2)})
                </option>
              ))}
            </DSSelect>

            {type === 'TRANSFER' && (
              <DSSelect
                label="Cuenta Destino"
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                leftIcon={<ArrowLeftRight className="w-4 h-4" />}
              >
                <option value="">Seleccionar destino...</option>
                {accounts
                  .filter((a) => a.id !== accountId)
                  .map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {acc.balance.toFixed(2)})
                    </option>
                  ))}
              </DSSelect>
            )}
          </div>

          {/* Category Selector with Inline Quick Add Button */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Categoría
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 min-h-[36px] px-2 rounded-lg cursor-pointer hover:bg-emerald-50"
              >
                <Plus className="w-3.5 h-3.5" /> Nueva
              </button>
            </div>
            <DSSelect
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              leftIcon={<Tag className="w-4 h-4" />}
            >
              <option value="">Seleccionar categoría...</option>
              {availableCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </DSSelect>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DSInput
              label="Fecha"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              leftIcon={<Calendar className="w-4 h-4" />}
            />

            <DSSelect
              label="Método de Pago"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
            >
              <option value="CASH">Efectivo</option>
              <option value="DEBIT_CARD">Tarjeta de Débito</option>
              <option value="CREDIT_CARD">Tarjeta de Crédito</option>
              <option value="TRANSFER">Transferencia</option>
              <option value="OTHER">Otro</option>
            </DSSelect>
          </div>
        </form>
      </DSBottomSheet>

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleInlineCreateCategory}
        defaultType={type === 'INCOME' ? 'INCOME' : 'EXPENSE'}
      />
    </>
  );
};
