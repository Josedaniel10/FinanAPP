import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../auth/hooks/useAuth';
import { authService } from '../../auth/services/auth.service';
import { POPULAR_CURRENCIES, CurrencyInfo } from '../../../shared/constants/currencies';
import { showToast } from '../../../stores/toastStore';
import { useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Coins,
  Wallet,
  ArrowRight,
  Check,
  CheckCircle2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { DSButton, DSInput } from '../../../design-system';
import { CurrencyAmountInput } from '../../../shared/components/CurrencyAmountInput';

export const OnboardingModal: React.FC = () => {
  const { user, setUser, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedCurrency, setSelectedCurrency] = useState<string>(
    user?.preferredCurrency || 'USD'
  );
  const [accountName, setAccountName] = useState('Cuenta Principal');
  const [initialBalance, setInitialBalance] = useState<string>('0');
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user has already completed onboarding, don't show
  if (!user || user.hasCompletedOnboarding) {
    return null;
  }

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const parsedBalance = parseFloat(initialBalance.replace(/,/g, '')) || 0;
      const res = await authService.completeOnboarding({
        preferredCurrency: selectedCurrency,
        accountName: accountName.trim() || 'Cuenta Principal',
        initialBalance: parsedBalance,
      });

      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await refreshUser();
      }

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budgets'] });

      showToast({
        type: 'success',
        message: `¡Bienvenido! Tu cuenta ha sido configurada en ${selectedCurrency}.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        message: err.message || 'Error al completar la configuración inicial.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCurrencyObj =
    POPULAR_CURRENCIES.find((c) => c.code === selectedCurrency) || POPULAR_CURRENCIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-teal-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Configuración Rápida de Bienvenida</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                ¡Hola, {user.name.split(' ')[0]}!
              </h2>
              <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-md">
                Personalicemos tu experiencia financiera en segundos para que todos tus balances,
                cuentas y reportes hablen tu mismo idioma.
              </p>
            </div>
            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 items-center justify-center text-white shrink-0 shadow-inner">
              <TrendingUp className="w-7 h-7 text-emerald-200" />
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-6 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                step === 1
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
              <span>Moneda Principal</span>
            </button>
            <div className="w-4 h-[1px] bg-white/30" />
            <button
              type="button"
              onClick={() => setStep(2)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
                step === 2
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-white/80 hover:bg-white/10'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                2
              </span>
              <span>Tu Primera Cuenta</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Selecciona tu Moneda Preferida
                  </label>
                  <p className="text-xs text-slate-500">
                    Todos los formularios de cuentas, transacciones y reportes se adaptarán por defecto
                    a esta divisa. Podrás cambiarla cuando desees desde tu perfil.
                  </p>
                </div>

                {/* Currency Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {POPULAR_CURRENCIES.map((c) => {
                    const isSelected = selectedCurrency === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setSelectedCurrency(c.code)}
                        className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 ring-2 ring-emerald-600/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0" role="img" aria-label={c.name}>
                            {c.flag}
                          </span>
                          <div className="min-w-0">
                            <p className="font-black text-xs tracking-tight flex items-center gap-1">
                              <span>{c.code}</span>
                              <span className="text-slate-400 font-mono text-[11px]">
                                ({c.symbol})
                              </span>
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[100px]">
                              {c.name}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Selected Currency Summary Card */}
                <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center gap-3 text-xs text-slate-600">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-emerald-700 shrink-0 shadow-2xs">
                    {selectedCurrencyObj.symbol}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900">
                      {selectedCurrencyObj.name} ({selectedCurrencyObj.code})
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Símbolo predeterminado:{' '}
                      <strong className="font-mono text-emerald-700">
                        {selectedCurrencyObj.symbol}
                      </strong>{' '}
                      • Compatible con cuentas multidivisa.
                    </p>
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="pt-2 flex justify-end">
                  <DSButton
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setStep(2)}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continuar al Paso 2
                  </DSButton>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1">
                    Tu Cuenta Principal de Inicio
                  </label>
                  <p className="text-xs text-slate-500">
                    Configura el nombre y el saldo inicial con el que arrancas en{' '}
                    <span className="font-bold text-emerald-700">
                      {selectedCurrencyObj.code} ({selectedCurrencyObj.symbol})
                    </span>
                    .
                  </p>
                </div>

                <div className="space-y-4 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80">
                  <DSInput
                    label="Nombre de tu Primera Cuenta"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Ej: Billetera Diaria, Cuenta de Ahorros..."
                    helperText="Puedes agregar más cuentas bancarias o de efectivo en cualquier momento."
                  />

                  <CurrencyAmountInput
                    label="Saldo Inicial"
                    value={initialBalance}
                    onChange={setInitialBalance}
                    currency={selectedCurrency}
                    min={0}
                    helperText="Si inicias desde cero puedes dejarlo en 0."
                  />
                </div>

                {/* Step 2 Actions */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 py-2 px-3 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Volver a Moneda
                  </button>

                  <DSButton
                    type="button"
                    variant="primary"
                    size="md"
                    isLoading={isSubmitting}
                    onClick={handleComplete}
                    leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  >
                    Comenzar a Administrar Mis Finanzas
                  </DSButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
