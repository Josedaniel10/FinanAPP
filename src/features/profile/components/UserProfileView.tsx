import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../../auth/hooks/useAuth';
import { authService } from '../../auth/services/auth.service';
import { useAccountsQuery } from '../../accounts/hooks/useAccountsQuery';
import { useSavingsGoalsQuery } from '../../savings/hooks/useSavingsQuery';
import {
  User,
  ShieldCheck,
  Mail,
  Calendar,
  Lock,
  LogOut,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  PiggyBank,
  Wallet,
  UserCheck,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { DSButton, DSInput, DSCard } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';
import { useUIStore } from '../../../stores/uiStore';

export const UserProfileView: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const { setActiveTab } = useUIStore();
  const { data: accounts = [] } = useAccountsQuery();
  const { data: savingsGoals = [] } = useSavingsGoalsQuery();

  // Name update form
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast({ type: 'warning', message: 'El nombre no puede estar vacío.' });
      return;
    }
    setIsUpdatingName(true);
    try {
      await authService.updateProfile(name.trim());
      await refreshUser();
      showToast({ type: 'success', message: 'Nombre de usuario actualizado con éxito.' });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Error al actualizar el nombre.' });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast({ type: 'warning', message: 'Ingresa tu contraseña actual.' });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ type: 'warning', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ type: 'warning', message: 'Las nuevas contraseñas no coinciden.' });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ type: 'success', message: 'Contraseña actualizada con éxito.' });
    } catch (err: any) {
      showToast({ type: 'error', message: err.message || 'Error al cambiar contraseña.' });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Reciente';

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('dashboard')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </button>
        <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold">
          Cuenta Verificada
        </span>
      </div>

      {/* Main Profile Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar with gradient & role indicator */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-4xl flex items-center justify-center shadow-md shadow-emerald-500/20">
              {userInitial}
            </div>
            {user?.role === 'ADMIN' && (
              <div
                className="absolute -bottom-2 -right-2 bg-emerald-700 text-white p-1.5 rounded-xl shadow-xs"
                title="Cuenta Administradora"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                {user?.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold self-center sm:self-auto ${
                  user?.role === 'ADMIN'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {user?.role === 'ADMIN' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administrador del Sistema</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Usuario Estándar</span>
                  </>
                )}
              </span>
            </div>

            <p className="text-sm text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{user?.email}</span>
            </p>

            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Miembro activo desde {formattedDate}</span>
            </p>
          </div>
        </div>

        {/* User Account Snapshot Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cuentas</span>
            </div>
            <p className="text-lg font-black font-mono text-slate-900">
              {accounts.length} <span className="text-xs font-normal text-slate-400">activas</span>
            </p>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <PiggyBank className="w-3.5 h-3.5 text-purple-600" />
              <span>Metas Ahorro</span>
            </div>
            <p className="text-lg font-black font-mono text-slate-900">
              {savingsGoals.length} <span className="text-xs font-normal text-slate-400">metas</span>
            </p>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estado</span>
            </div>
            <p className="text-sm font-bold text-emerald-700 mt-0.5">
              Verificado & Activo
            </p>
          </div>

          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Lock className="w-3.5 h-3.5 text-blue-600" />
              <span>Seguridad</span>
            </div>
            <p className="text-sm font-bold text-blue-700 mt-0.5">
              Sesión Encriptada
            </p>
          </div>
        </div>
      </div>

      {/* Account Settings Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Info Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <User className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base">Información Personal</h3>
          </div>
          <p className="text-xs text-slate-500">
            Modifica tu nombre visible en la plataforma y reportes financieros.
          </p>

          <form onSubmit={handleUpdateName} className="space-y-4">
            <DSInput
              label="Nombre Completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 text-xs cursor-not-allowed select-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                El correo electrónico está vinculado a tu cuenta y no puede modificarse.
              </p>
            </div>

            <DSButton
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isUpdatingName}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Guardar Cambios
            </DSButton>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <KeyRound className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-base">Seguridad & Contraseña</h3>
          </div>
          <p className="text-xs text-slate-500">
            Actualiza tus credenciales de acceso para mantener la cuenta resguardada.
          </p>

          <form onSubmit={handleChangePassword} className="space-y-3.5">
            <DSInput
              label="Contraseña Actual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />

            <DSInput
              label="Nueva Contraseña"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />

            <DSInput
              label="Confirmar Nueva Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
            />

            <DSButton
              type="submit"
              variant="outline"
              size="md"
              className="w-full"
              isLoading={isUpdatingPassword}
              leftIcon={<Lock className="w-4 h-4 text-emerald-600" />}
            >
              Actualizar Contraseña
            </DSButton>
          </form>
        </div>
      </div>

      {/* Dedicated Logout Section (Transferred from header) */}
      <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-950">
              Cerrar Sesión Segura
            </h4>
            <p className="text-xs text-rose-700/90 mt-0.5">
              Finaliza la sesión actual en este navegador. Tus cuentas, metas y movimientos permanecerán seguros y respaldados.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            showToast({ type: 'info', message: 'Has cerrado sesión exitosamente.' });
            logout();
          }}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0 min-h-[44px]"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </motion.div>
  );
};
