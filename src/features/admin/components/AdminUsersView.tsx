import React, { useState } from 'react';
import {
  useAdminUsersQuery,
  useAdminStatsQuery,
  useUnlockUserMutation,
  useUpdateUserRoleMutation,
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
  UserCheck,
  CreditCard,
  ArrowLeftRight,
} from 'lucide-react';
import { DSButton, DSChip, DSCard, DSModal, DSInput } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';

export const AdminUsersView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { data: users = [], isLoading, refetch } = useAdminUsersQuery();
  const { data: stats } = useAdminStatsQuery();
  const unlockMutation = useUnlockUserMutation();
  const roleMutation = useUpdateUserRoleMutation();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LOCKED' | 'ADMIN'>('ALL');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

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

  const handleToggleRole = async (userId: string, currentRole: 'ADMIN' | 'USER', email: string) => {
    if (currentUser?.id === userId) {
      showToast({
        type: 'warning',
        message: 'No puedes cambiar tu propio rol desde aquí.',
      });
      return;
    }

    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await roleMutation.mutateAsync({ userId, role: newRole });
      showToast({
        type: 'success',
        message: `Rol de ${email} actualizado a ${newRole}.`,
      });
    } catch {
      showToast({
        type: 'error',
        message: 'Error al actualizar el rol del usuario.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-emerald-700 mb-1">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Consola de Gobernanza
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          Administración de Usuarios
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Control de acceso, roles RBAC y desbloqueo de credenciales en MongoDB Atlas
        </p>
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
          <p className="text-[11px] font-semibold text-emerald-600">Administradores</p>
          <p className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {stats?.adminCount ?? users.filter((u) => u.role === 'ADMIN').length}
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
          label="Administradores"
          isActive={filter === 'ADMIN'}
          onClick={() => setFilter('ADMIN')}
          icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
          count={users.filter((u) => u.role === 'ADMIN').length}
        />
        <DSChip
          label="Bloqueados"
          isActive={filter === 'LOCKED'}
          onClick={() => setFilter('LOCKED')}
          icon={<AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
          count={users.filter((u) => u.isLocked).length}
        />
      </div>

      {/* Mobile Touch Cards Feed */}
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
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              {/* Left: User Info */}
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    u.role === 'ADMIN'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-slate-900 truncate">{u.name}</p>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        u.role === 'ADMIN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role}
                    </span>
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

              {/* Right: Actions with 48x48 Touch Area */}
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

                {currentUser?.id !== u.id && (
                  <DSButton
                    size="sm"
                    variant="secondary"
                    className="min-h-[44px] flex-1 sm:flex-none"
                    leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                    onClick={() => handleToggleRole(u.id, u.role, u.email)}
                    isLoading={roleMutation.isPending}
                  >
                    {u.role === 'ADMIN' ? 'Hacer Usuario' : 'Hacer Admin'}
                  </DSButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
