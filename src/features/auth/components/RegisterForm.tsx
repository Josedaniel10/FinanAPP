import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { DSButton, DSInput, DSAlert } from '../../../design-system';
import { Lock, Mail, User as UserIcon, Eye, EyeOff, ArrowRight } from 'lucide-react';

const registerFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(60, 'El nombre no puede exceder 60 caracteres'),
    email: z
      .string()
      .min(1, 'El correo electrónico es obligatorio')
      .email('Ingrese un formato de correo electrónico válido'),
    password: z
      .string()
      .min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z
      .string()
      .min(6, 'Debe confirmar su contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register: registerAuth, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
      });
    } catch {
      // Handled in authStore
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Crear una Cuenta
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Únete a FinanAPP y toma el control inteligente de tu dinero
        </p>
      </div>

      {error && (
        <div className="mb-5">
          <DSAlert
            type="error"
            title="Error al registrar"
            message={error}
            onClose={clearError}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <DSInput
          label="Nombre completo"
          type="text"
          isRequired
          placeholder="Ej. Juan Pérez"
          leftIcon={<UserIcon className="w-4 h-4" />}
          disabled={isLoading}
          error={errors.name?.message}
          {...register('name')}
        />

        <DSInput
          label="Correo electrónico"
          type="email"
          isRequired
          placeholder="tu@correo.com"
          leftIcon={<Mail className="w-4 h-4" />}
          disabled={isLoading}
          error={errors.email?.message}
          {...register('email')}
        />

        <DSInput
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          isRequired
          placeholder="Mínimo 6 caracteres"
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
          disabled={isLoading}
          error={errors.password?.message}
          {...register('password')}
        />

        <DSInput
          label="Confirmar contraseña"
          type={showPassword ? 'text' : 'password'}
          isRequired
          placeholder="Repite tu contraseña"
          leftIcon={<Lock className="w-4 h-4" />}
          disabled={isLoading}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <DSButton
          type="submit"
          fullWidth
          size="md"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {isLoading ? 'Registrando cuenta...' : 'Completar Registro'}
        </DSButton>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-500">
          ¿Ya tienes cuenta en FinanAPP?{' '}
          <button
            onClick={onSwitchToLogin}
            type="button"
            className="text-emerald-600 hover:text-emerald-700 font-semibold hover:underline cursor-pointer"
          >
            Inicia sesión aquí
          </button>
        </p>
      </div>
    </div>
  );
};
