import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { DSButton, DSInput, DSAlert } from '../../../design-system';
import { Lock, Mail, Eye, EyeOff, ShieldAlert, ArrowRight } from 'lucide-react';

const loginFormSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Ingrese un formato de correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login, isLoading, error, lockInfo, attemptsRemaining, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // Handled in store
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Iniciar Sesión
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ingresa tus credenciales para acceder a tu panel financiero
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
          <DSAlert
            type="error"
            message={error}
            onClose={clearError}
          />
        </div>
      )}

      {attemptsRemaining !== null && attemptsRemaining > 0 && !lockInfo?.isLocked && (
        <div className="mb-5">
          <DSAlert
            type="warning"
            message={`Credenciales incorrectas. Te quedan ${attemptsRemaining} intento(s) antes de que la cuenta se bloquee temporalmente.`}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DSInput
          label="Correo electrónico"
          type="email"
          isRequired
          placeholder="tu@correo.com"
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={isLoading || Boolean(lockInfo?.isLocked)}
          error={errors.email?.message}
          {...register('email')}
        />

        <DSInput
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          isRequired
          placeholder="••••••••"
          leftIcon={<Lock className="w-4 h-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          disabled={isLoading || Boolean(lockInfo?.isLocked)}
          error={errors.password?.message}
          {...register('password')}
        />

        <DSButton
          type="submit"
          fullWidth
          size="md"
          isLoading={isLoading}
          disabled={Boolean(lockInfo?.isLocked)}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </DSButton>
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
