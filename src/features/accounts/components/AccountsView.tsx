import React, { useState } from 'react';
import {
  useAccountsQuery,
  useCreateAccountMutation,
  useDeleteAccountMutation,
} from '../hooks/useAccountsQuery';
import { Account, AccountType, CreateAccountDto, accountService } from '../services/account.service';
import { AccountModal, ACCOUNT_TYPE_LABELS } from './AccountModal';
import { TransferModal } from './TransferModal';
import {
  CreditCard,
  Wallet,
  Landmark,
  PiggyBank,
  TrendingUp,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Star,
  Coins,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { DSButton, DSChip, DSCard, DSModal, DSAlert } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';
import { useQueryClient } from '@tanstack/react-query';
import { ACCOUNT_KEYS } from '../hooks/useAccountsQuery';
import { useCurrency } from '../../../shared/hooks/useCurrency';

export const AccountsView: React.FC = () => {
  const { format, preferredCurrency } = useCurrency();
  const queryClient = useQueryClient();
  const { data: accounts = [], isLoading } = useAccountsQuery();
  const createAccountMutation = useCreateAccountMutation();
  const deleteAccountMutation = useDeleteAccountMutation();

  // Modals state
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferOriginId, setTransferOriginId] = useState<string | undefined>();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | AccountType>('ALL');

  const filteredAccounts = accounts.filter((acc) => {
    if (filterType === 'ALL') return true;
    return acc.type === filterType;
  });

  // Calculate high-level summary metrics
  const totalBalance = accounts.reduce((acc, a) => acc + (a.balance || 0), 0);
  const bankAndSavingsBalance = accounts
    .filter((a) => a.type === 'BANK' || a.type === 'SAVINGS')
    .reduce((acc, a) => acc + (a.balance || 0), 0);
  const cashBalance = accounts
    .filter((a) => a.type === 'CASH')
    .reduce((acc, a) => acc + (a.balance || 0), 0);

  const handleSaveAccount = async (dto: CreateAccountDto, accountId?: string) => {
    if (accountId) {
      await accountService.update(accountId, dto);
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all });
    } else {
      await createAccountMutation.mutateAsync(dto);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteAccountMutation.mutateAsync(id);
      showToast({ type: 'success', message: 'Cuenta eliminada correctamente.' });
      setDeleteConfirmId(null);
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Error al eliminar la cuenta.' });
    }
  };

  const handleSetDefault = async (account: Account) => {
    if (account.isDefault) return;
    try {
      await accountService.update(account.id, { isDefault: true });
      queryClient.invalidateQueries({ queryKey: ACCOUNT_KEYS.all });
      showToast({
        type: 'success',
        message: `"${account.name}" designada como cuenta predeterminada.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', message: err?.message || 'Error al actualizar cuenta.' });
    }
  };

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'CASH':
        return <Wallet className="w-5 h-5 text-emerald-600" />;
      case 'BANK':
        return <Landmark className="w-5 h-5 text-blue-600" />;
      case 'SAVINGS':
        return <PiggyBank className="w-5 h-5 text-purple-600" />;
      case 'CREDIT':
        return <CreditCard className="w-5 h-5 text-rose-600" />;
      case 'INVESTMENT':
        return <TrendingUp className="w-5 h-5 text-amber-600" />;
      default:
        return <Coins className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <CreditCard className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Gestión Patrimonial
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Cuentas Financieras
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Control de liquidez en efectivo, cuentas bancarias, tarjetas y transferencias entre divisas
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <DSButton
            variant="outline"
            size="md"
            className="min-h-[44px]"
            leftIcon={<ArrowLeftRight className="w-4 h-4 text-emerald-600" />}
            onClick={() => {
              setTransferOriginId(undefined);
              setIsTransferModalOpen(true);
            }}
            disabled={accounts.length < 2}
          >
            Transferir
          </DSButton>

          <DSButton
            variant="primary"
            size="md"
            className="min-h-[44px]"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setEditingAccount(null);
              setIsAccountModalOpen(true);
            }}
          >
            Nueva Cuenta
          </DSButton>
        </div>
      </div>

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Saldo Total Agregado
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {format(totalBalance)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
            Bancos y Ahorro
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-blue-700 mt-1">
            {format(bankAndSavingsBalance)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Efectivo Líquido
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-700 mt-1">
            {format(cashBalance)}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total de Cuentas
          </p>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
            {accounts.length}
          </p>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <DSChip
          label="Todas"
          isActive={filterType === 'ALL'}
          onClick={() => setFilterType('ALL')}
          count={accounts.length}
        />
        <DSChip
          label="Bancarias"
          isActive={filterType === 'BANK'}
          onClick={() => setFilterType('BANK')}
          icon={<Landmark className="w-3.5 h-3.5 text-blue-600" />}
          count={accounts.filter((a) => a.type === 'BANK').length}
        />
        <DSChip
          label="Efectivo"
          isActive={filterType === 'CASH'}
          onClick={() => setFilterType('CASH')}
          icon={<Wallet className="w-3.5 h-3.5 text-emerald-600" />}
          count={accounts.filter((a) => a.type === 'CASH').length}
        />
        <DSChip
          label="Ahorros"
          isActive={filterType === 'SAVINGS'}
          onClick={() => setFilterType('SAVINGS')}
          icon={<PiggyBank className="w-3.5 h-3.5 text-purple-600" />}
          count={accounts.filter((a) => a.type === 'SAVINGS').length}
        />
        <DSChip
          label="Crédito"
          isActive={filterType === 'CREDIT'}
          onClick={() => setFilterType('CREDIT')}
          icon={<CreditCard className="w-3.5 h-3.5 text-rose-600" />}
          count={accounts.filter((a) => a.type === 'CREDIT').length}
        />
        <DSChip
          label="Inversión"
          isActive={filterType === 'INVESTMENT'}
          onClick={() => setFilterType('INVESTMENT')}
          icon={<TrendingUp className="w-3.5 h-3.5 text-amber-600" />}
          count={accounts.filter((a) => a.type === 'INVESTMENT').length}
        />
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-2xs animate-pulse space-y-3"
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-200" />
              <div className="h-5 bg-slate-200 rounded w-1/2" />
              <div className="h-7 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-3xl border border-slate-200/90 my-4">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">Sin cuentas registradas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No tienes cuentas activas bajo el filtro seleccionado. Añade tu primera cuenta para organizar tus finanzas.
          </p>
          <div className="mt-4">
            <DSButton
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setEditingAccount(null);
                setIsAccountModalOpen(true);
              }}
            >
              Crear Nueva Cuenta
            </DSButton>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((account) => (
            <div
              key={account.id}
              className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between ${
                account.isDefault
                  ? 'border-emerald-300 ring-1 ring-emerald-500/10'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              {/* Card Header */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                    {getAccountIcon(account.type)}
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {account.isDefault ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" /> Predeterminada
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetDefault(account)}
                        className="text-[11px] font-medium text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                        title="Hacer cuenta predeterminada"
                      >
                        Establecer por defecto
                      </button>
                    )}
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {account.currency}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 tracking-tight truncate">
                  {account.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ACCOUNT_TYPE_LABELS[account.type] || account.type}
                </p>

                {/* Big Formatted Balance */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                    Saldo Disponible
                  </span>
                  <span
                    className={`text-2xl font-black font-mono tabular-nums tracking-tight block mt-0.5 ${
                      account.balance < 0
                        ? 'text-rose-600'
                        : account.balance === 0
                        ? 'text-slate-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {format(account.balance, account.currency, { showCode: true })}
                  </span>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTransferOriginId(account.id);
                    setIsTransferModalOpen(true);
                  }}
                  disabled={accounts.length < 2}
                  className="min-h-[44px] flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Transferir</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAccount(account);
                      setIsAccountModalOpen(true);
                    }}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="Editar cuenta"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(account.id)}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    aria-label="Eliminar cuenta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        initialAccount={editingAccount}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferOriginId(undefined);
        }}
        accounts={accounts}
        defaultOriginAccountId={transferOriginId}
      />

      {/* Delete Account Confirmation Dialog */}
      <DSModal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="¿Eliminar cuenta financiera?"
        subtitle="Si eliminas esta cuenta, otra se asignará por defecto si es necesario."
        footer={
          <div className="flex gap-2 w-full">
            <DSButton
              variant="outline"
              size="md"
              className="flex-1 min-h-[48px]"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteAccountMutation.isPending}
            >
              Cancelar
            </DSButton>
            <DSButton
              variant="danger"
              size="md"
              className="flex-1 min-h-[48px]"
              isLoading={deleteAccountMutation.isPending}
              onClick={() => deleteConfirmId && handleDeleteAccount(deleteConfirmId)}
            >
              Eliminar Cuenta
            </DSButton>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Estás seguro de que deseas eliminar esta cuenta financiera? Esta acción no se puede deshacer. Nota: No es posible eliminar tu única cuenta financiera.
        </p>
      </DSModal>
    </div>
  );
};
