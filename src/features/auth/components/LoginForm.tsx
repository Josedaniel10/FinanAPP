import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Alert } from '../../../shared/components/Alert';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, lockInfo, attemptsRemaining, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      await login({ email, password });
    } catch {
      // Handled in context
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Iniciar Sesión
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ingresa tus credenciales para acceder a tu cuenta
        </p>
      </div>

      {lockInfo?.isLocked && (
        <div className="mb-5 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3 text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">
              Acceso restringido temporalmente
            </p>
            <p className="text-amber-700 mt-0.5 text-xs leading-relaxed">
              Por motivos de seguridad, la cuenta ha sido bloqueada tras 3 intentos fallidos consecutivos. Podrás intentar ingresar nuevamente en{' '}
              <span className="font-bold">
                {lockInfo.minutesRemaining} minuto(s)
              </span>
              .
            </p>
          </div>
        </div>
      )}

      {error && !lockInfo?.isLocked && (
        <div className="mb-5">
          <Alert
            type="error"
            message={error}
            onClose={clearError}
          />
        </div>
      )}

      {attemptsRemaining !== null && attemptsRemaining > 0 && !lockInfo?.isLocked && (
        <div className="mb-5">
          <Alert
            type="warning"
            message={`Credenciales incorrectas. Te quedan ${attemptsRemaining} intento(s) antes de que la cuenta se bloquee temporalmente.`}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Correo electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) clearError();
              }}
              placeholder="tu@correo.com"
              disabled={isLoading || Boolean(lockInfo?.isLocked)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Contraseña
            </label>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              placeholder="••••••••"
              disabled={isLoading || Boolean(lockInfo?.isLocked)}
              className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || Boolean(lockInfo?.isLocked)}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            <>
              <span>Iniciar Sesión</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          ¿No tienes una cuenta aún?{' '}
          <button
            onClick={onSwitchToRegister}
            type="button"
            className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline cursor-pointer"
          >
            Regístrate aquí
          </button>
        </p>
      </div>
    </div>
  );
};
