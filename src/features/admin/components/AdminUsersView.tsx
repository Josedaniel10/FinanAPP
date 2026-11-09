import React, { useState } from 'react';
import {
  useAdminUsersQuery,
  useAdminStatsQuery,
  useUnlockUserMutation,
  useDeleteUserMutation,
} from '../hooks/useAdminUsersQuery';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  Search,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ArrowLeftRight,
  Trash2,
  Crown,
  Info,
} from 'lucide-react';
import { DSButton, DSChip, DSCard, DSModal, DSInput } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';

export const AdminUsersView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading } = useAdminUsersQuery();
  const { data: stats } = useAdminStatsQuery();
  const unlockMutation = useUnlockUserMutation();
  const deleteMutation = useDeleteUserMutation();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOCKED' | 'ADMIN'>('ALL');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filter === 'LOCKED') return u.isLocked;
    if (filter === 'ADMIN') return u.role === 'ADMIN';
    return true;
  });

  const handleUnlock = async (userId: string, email: string) => {
    try {
      await unlockMutation.mutateAsync(userId);
      showToast({
        type: 'success',
        message: `Cuenta de ${email} desbloqueada exitosamente.`,
      });
    } catch {
      showToast({
        type: 'error',
        message: 'No se pudo desbloquear la cuenta.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteMutation.mutateAsync(userToDelete.id);
      showToast({
        type: 'success',
        message: `Usuario ${userToDelete.email} eliminado permanentemente.`,
      });
      setUserToDelete(null);
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err?.message || 'Error al eliminar el usuario.',
      });
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-700 mb-1">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Gestión y Seguridad
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Administración de Usuarios
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Control de acceso, gestión de cuentas y depuración del sistema
        </p>
      </div>

      {/* Sole Administrator Notice Banner */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
          <Crown className="w-5 h-5 text-amber-300" />
        </div>
        <div className="text-xs space-y-0.5 min-w-0">
          <p className="font-bold text-emerald-950 flex items-center gap-1.5">
            <span>Administrador Único del Sistema:</span>
            <span className="font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
              demo@finanapp.com
            </span>
          </p>
          <p className="text-emerald-800/80 leading-relaxed text-[11px]">
            Por directriz de seguridad de FinanAPP, esta es la única cuenta con privilegios de Administrador. Como admin, puedes gestionar las categorías predeterminadas globales, desbloquear cuentas y eliminar usuarios del sistema.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Total Usuarios</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats?.totalUsers ?? users.length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-600">Administrador</p>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1 flex items-center gap-1.5">
            <span>1</span>
            <span className="text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
              Único
            </span>
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-amber-600">Cuentas Bloqueadas</p>
          <p className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {users.filter((u) => u.isLocked).length}
          </p>
        </div>
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-[11px] font-semibold text-slate-500">Transacciones Totales</p>
          <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats?.totalTransactions ?? '—'}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <DSInput
        placeholder="Buscar por nombre o correo..."
        leftIcon={<Search className="w-4 h-4 text-slate-400" />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <DSChip
          label="Todos los Usuarios"
          isActive={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          count={users.length}
        />
        <DSChip
          label="Administrador"
          isActive={filter === 'ADMIN'}
          onClick={() => setFilter('ADMIN')}
          icon={<Crown className="w-3.5 h-3.5 text-amber-500" />}
          count={users.filter((u) => u.email === 'demo@finanapp.com').length}
        />
        <DSChip
          label="Bloqueados"
          isActive={filter === 'LOCKED'}
          onClick={() => setFilter('LOCKED')}
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          count={users.filter((u) => u.isLocked).length}
        />
      </div>

      {/* User Cards Feed */}
      {isLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs animate-pulse flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/3" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200/80">
          <p className="text-sm font-semibold text-slate-700">Sin usuarios coincidentes</p>
          <p className="text-xs text-slate-400 mt-1">
            No se encontraron usuarios para los filtros seleccionados.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => {
            const isSoleAdmin = u.email === 'demo@finanapp.com';

            return (
              <div
                key={u.id}
                className={`bg-white border rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                  isSoleAdmin
                    ? 'border-emerald-300 ring-2 ring-emerald-600/10 bg-gradient-to-r from-emerald-50/20 via-white to-white'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Left: User Info */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      isSoleAdmin
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isSoleAdmin ? (
                      <Crown className="w-5 h-5 text-amber-300" />
                    ) : (
                      u.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                      {isSoleAdmin ? (
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3 h-3 text-amber-300" /> Administrador Único
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          Usuario
                        </span>
                      )}
                      {u.isLocked && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Bloqueado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{u.email}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{u.accountCount || 1} cuenta(s)</span>
                      <span>·</span>
                      <span>{u.transactionCount || 0} movimientos</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                  {u.isLocked && (
                    <DSButton
                      size="sm"
                      variant="outline"
                      className="min-h-[44px] flex-1 sm:flex-none text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      leftIcon={<Unlock className="w-3.5 h-3.5" />}
                      onClick={() => handleUnlock(u.id, u.email)}
                      isLoading={unlockMutation.isPending}
                    >
                      Desbloquear
                    </DSButton>
                  )}

                  {isSoleAdmin ? (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-50 text-[11px] font-medium text-slate-400 border border-slate-100 select-none">
                      Cuenta Protegida
                    </div>
                  ) : (
                    <DSButton
                      size="sm"
                      variant="danger"
                      className="min-h-[44px] flex-1 sm:flex-none"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => setUserToDelete(u)}
                    >
                      Eliminar
                    </DSButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <DSModal
          isOpen={Boolean(userToDelete)}
          onClose={() => setUserToDelete(null)}
          title="Eliminar Cuenta de Usuario"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-950 text-sm">¿Confirmas la eliminación permanente?</p>
                <p className="mt-1 leading-relaxed text-rose-800">
                  Esta acción es irreversible y eliminará definitivamente a{' '}
                  <strong className="font-bold text-rose-950">{userToDelete.name}</strong> ({userToDelete.email}),
                  así como sus{' '}
                  <strong>{userToDelete.accountCount || 1} cuenta(s)</strong> y{' '}
                  <strong>{userToDelete.transactionCount || 0} movimiento(s)</strong> asociados.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <DSButton
                type="button"
                variant="outline"
                size="md"
                onClick={() => setUserToDelete(null)}
                disabled={deleteMutation.isPending}
              >
                Cancelar
              </DSButton>

              <DSButton
                type="button"
                variant="danger"
                size="md"
                isLoading={deleteMutation.isPending}
                leftIcon={<Trash2 className="w-4 h-4" />}
                onClick={handleConfirmDelete}
              >
                Eliminar Permanentemente
              </DSButton>
            </div>
          </div>
        </DSModal>
      )}
    </div>
  );
};
