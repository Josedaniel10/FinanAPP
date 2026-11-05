import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { transactionService } from '../../transactions/services/transaction.service';
import { Transaction } from '../../transactions/types';
import { reportService, ReportFilter, PeriodAnalytics } from '../services/report.service';
import { useAccountsQuery } from '../../accounts/hooks/useAccountsQuery';
import {
  FileSpreadsheet,
  Printer,
  PieChart,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Receipt,
  FileText,
  TrendingUp,
  Download,
} from 'lucide-react';
import { DSButton, DSChip, DSInput } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';

export const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { data: accounts = [] } = useAccountsQuery();

  // Period state
  const [period, setPeriod] = useState<ReportFilter['period']>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Slicer filters
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data fetching state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Compute active date range
  const dateRange = useMemo(() => {
    if (period === 'CUSTOM') {
      return {
        startDate: customStart || '2026-01-01',
        endDate: customEnd || new Date().toISOString().split('T')[0] || '',
      };
    }
    return reportService.getDateRangeForPeriod(period);
  }, [period, customStart, customEnd]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const res = await transactionService.getTransactions({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      setTransactions(res.data);
    } catch (err) {
      console.error('Error al cargar transacciones del reporte:', err);
      showToast({ type: 'error', message: 'No se pudieron cargar los datos del reporte.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange.startDate, dateRange.endDate]);

  // Apply secondary filters (Account, Type, Search query)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Account filter
      if (selectedAccountId !== 'ALL') {
        const matchesOrigin = tx.accountId === selectedAccountId || tx.account?.id === selectedAccountId;
        const matchesDest = tx.destinationAccountId === selectedAccountId || tx.destinationAccount?.id === selectedAccountId;
        if (!matchesOrigin && !matchesDest) return false;
      }

      // Type filter
      if (selectedType !== 'ALL' && tx.type !== selectedType) {
        return false;
      }

      // Search keyword filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const descMatch = (tx.description || '').toLowerCase().includes(q);
        const catMatch = (tx.category?.name || '').toLowerCase().includes(q);
        const notesMatch = (tx.notes || '').toLowerCase().includes(q);
        const accMatch = (tx.account?.name || '').toLowerCase().includes(q);
        if (!descMatch && !catMatch && !notesMatch && !accMatch) return false;
      }

      return true;
    });
  }, [transactions, selectedAccountId, selectedType, searchQuery]);

  // Compute full analytics for current date range
  const analytics: PeriodAnalytics = useMemo(() => {
    return reportService.computeAnalytics(filteredTransactions, dateRange.startDate, dateRange.endDate);
  }, [filteredTransactions, dateRange.startDate, dateRange.endDate]);

  // Financial health assessment (Rule 50/30/20)
  const financialHealth = useMemo(() => {
    const rate = analytics.savingsRate;
    if (analytics.totalIncome === 0 && analytics.totalExpenses === 0) {
      return {
        level: 'NEUTRAL',
        title: 'Sin actividad en el periodo',
        description: 'No se registraron movimientos contables en el rango de fechas seleccionado.',
        icon: Sparkles,
        color: 'text-slate-600 bg-slate-50 border-slate-200',
      };
    }
    if (analytics.netSavings < 0) {
      return {
        level: 'DANGER',
        title: 'Déficit Financiero Operativo',
        description: `Los egresos superan a los ingresos en $${Math.abs(analytics.netSavings).toLocaleString('es-ES', { minimumFractionDigits: 2 })}. Se recomienda revisar gastos discrecionales.`,
        icon: AlertOctagon,
        color: 'text-rose-700 bg-rose-50 border-rose-200',
      };
    }
    if (rate >= 20) {
      return {
        level: 'EXCELLENT',
        title: 'Excelente Salud Financiera (Regla 50/30/20)',
        description: `Tu tasa de ahorro es del ${rate}%, superando el umbral óptimo del 20% sugerido en finanzas personales.`,
        icon: CheckCircle2,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      };
    }
    return {
      level: 'MODERATE',
      title: 'Ahorro Moderado Positivo',
      description: `Generaste un superávit del ${rate}% (${analytics.netSavings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}). Optimiza consumos para alcanzar el 20%.`,
      icon: AlertTriangle,
      color: 'text-amber-700 bg-amber-50 border-amber-200',
    };
  }, [analytics]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast({ type: 'warning', message: 'No hay transacciones en el periodo para exportar.' });
      return;
    }
    reportService.exportToCSV(filteredTransactions, `reporte_${period.toLowerCase()}`);
    showToast({ type: 'success', message: `Exportadas ${filteredTransactions.length} transacciones a CSV.` });
  };

  const handleDownloadPDF = () => {
    if (filteredTransactions.length === 0) {
      showToast({ type: 'warning', message: 'No hay datos en el periodo para generar el reporte.' });
      return;
    }
    try {
      reportService.exportToPDF(
        filteredTransactions,
        analytics,
        user,
        dateRange.startDate,
        dateRange.endDate,
        `reporte_financiero_${period.toLowerCase()}`
      );
      showToast({ type: 'success', message: 'Reporte PDF generado y descargado con éxito.' });
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showToast({ type: 'error', message: 'No se pudo generar el archivo PDF.' });
    }
  };

  const HealthIcon = financialHealth.icon;

  return (
    <div className="space-y-6">
      {/* Print-specific stylesheet ensuring crisp executive PDF generation */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; font-size: 11pt !important; }
          header, nav, footer, .no-print { display: none !important; }
          .printable-report { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .page-break { page-break-after: always; }
          .shadow-xs, .shadow-2xs, .shadow-md { box-shadow: none !important; }
          .border { border: 1px solid #e2e8f0 !important; }
        }
      `}</style>

      {/* Header and Export Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 mb-1">
            <PieChart className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Inteligencia Financiera
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Reportes & Analíticas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Análisis profundo de flujo de caja, tasa de ahorro, patrones de consumo y exportación oficial
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <DSButton
            variant="outline"
            size="md"
            className="min-h-[44px]"
            leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
            onClick={handleDownloadPDF}
          >
            Descargar PDF
          </DSButton>

          <DSButton
            variant="primary"
            size="md"
            className="min-h-[44px]"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Exportar Excel ({filteredTransactions.length})
          </DSButton>
        </div>
      </div>

      {/* Period Selection & Slicers Bar (no-print) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4 no-print">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Periodo de Análisis
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {dateRange.startDate} al {dateRange.endDate}
          </span>
        </div>

        {/* Period Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <DSChip
            label="Este Mes"
            isActive={period === 'THIS_MONTH'}
            onClick={() => setPeriod('THIS_MONTH')}
          />
          <DSChip
            label="Mes Anterior"
            isActive={period === 'LAST_MONTH'}
            onClick={() => setPeriod('LAST_MONTH')}
          />
          <DSChip
            label="Últimos 3 Meses"
            isActive={period === 'LAST_3_MONTHS'}
            onClick={() => setPeriod('LAST_3_MONTHS')}
          />
          <DSChip
            label="Este Año"
            isActive={period === 'THIS_YEAR'}
            onClick={() => setPeriod('THIS_YEAR')}
          />
          <DSChip
            label="Todo el Historial"
            isActive={period === 'ALL'}
            onClick={() => setPeriod('ALL')}
          />
          <DSChip
            label="Personalizado"
            isActive={period === 'CUSTOM'}
            onClick={() => setPeriod('CUSTOM')}
          />
        </div>

        {period === 'CUSTOM' && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DSInput
              label="Fecha Desde"
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <DSInput
              label="Fecha Hasta"
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
        )}

        {/* Secondary Slicers: Account, Type & Quick Search */}
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Account Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Filtrar por Cuenta
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Todas las cuentas</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tipo de Movimiento
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="INCOME">Solo Ingresos (+)</option>
              <option value="EXPENSE">Solo Gastos (-)</option>
              <option value="TRANSFER">Solo Transferencias (⇄)</option>
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Búsqueda Rápida
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar descripción o categoría..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Executive Printable Document Header (Only appears on PDF / Print) */}
      <div className="hidden print:block mb-6 border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900">FinanAPP - Reporte Ejecutivo</h1>
            <p className="text-xs text-slate-500">
              Plataforma de Control Financiero Personal • Usuario: {user?.name} ({user?.email})
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Fecha de Emisión: {new Date().toLocaleDateString('es-ES')}</p>
            <p className="font-mono">
              Periodo: {dateRange.startDate} al {dateRange.endDate}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health Diagnostic Banner */}
      <div className={`p-4 rounded-3xl border flex items-start gap-3 shadow-2xs ${financialHealth.color}`}>
        <HealthIcon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h4 className="text-xs font-bold leading-tight">{financialHealth.title}</h4>
          <p className="text-xs opacity-90 mt-0.5">{financialHealth.description}</p>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-mono font-bold block">Tasa: {analytics.savingsRate}%</span>
          <span className="text-[10px] opacity-75">Ahorro sobre ingresos</span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Income */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
              Total Ingresos
            </p>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-emerald-700 mt-1">
            +${analytics.totalIncome.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Entradas del periodo</p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">
              Total Gastos
            </p>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-rose-700 mt-1">
            -${analytics.totalExpenses.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Salidas del periodo</p>
        </div>

        {/* Net Savings & Savings Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
              Ahorro Neto
            </p>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                analytics.savingsRate >= 20
                  ? 'bg-emerald-100 text-emerald-800'
                  : analytics.netSavings >= 0
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {analytics.savingsRate}% tasa
            </span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black font-mono tabular-nums mt-1 ${
              analytics.netSavings >= 0 ? 'text-blue-700' : 'text-rose-600'
            }`}
          >
            ${analytics.netSavings.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Superávit / Déficit neto</p>
        </div>

        {/* Daily Average Expense */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Gasto Promedio Diario
            </p>
            <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 mt-1">
            ${analytics.dailyAverageExpense.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Ritmo de egreso diario</p>
        </div>
      </div>

      {/* Visual Analytics Grid: Category Breakdown & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Expense Breakdown */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Distribución de Gastos por Categoría</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {analytics.categoryBreakdown.length} categorías
            </span>
          </div>

          {analytics.categoryBreakdown.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay gastos registrados con los filtros seleccionados.
            </div>
          ) : (
            <div className="space-y-3.5">
              {analytics.categoryBreakdown.map((cat) => (
                <div key={cat.categoryName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.categoryColor }}
                      />
                      <span>{cat.categoryName}</span>
                      <span className="text-slate-400 font-normal">({cat.count} mov.)</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      ${cat.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}{' '}
                      <span className="text-slate-400 font-normal">({cat.percentage}%)</span>
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.categoryColor,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Methods & Highest Expense Highlight */}
        <div className="space-y-6">
          {/* Payment Methods */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Volumen por Método de Pago</span>
            </h3>

            {analytics.paymentMethodBreakdown.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No hay movimientos con método de pago registrado.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {analytics.paymentMethodBreakdown.map((pm) => (
                  <div
                    key={pm.method}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{pm.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{pm.count} transacciones</p>
                    </div>
                    <p className="text-sm font-black font-mono text-slate-900 mt-2">
                      ${pm.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Highest Expense Highlight */}
          {analytics.highestExpenseTransaction && (
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                <span>Mayor Gasto del Periodo</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-bold">
                    {analytics.highestExpenseTransaction.description}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {analytics.highestExpenseTransaction.category?.name || 'General'} •{' '}
                    {analytics.highestExpenseTransaction.date}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-2xl font-black text-rose-400">
                    -${analytics.highestExpenseTransaction.amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend Table (If more than 1 month in range) */}
      {analytics.monthlyTrend.length > 1 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
          <h3 className="font-bold text-base text-slate-900 flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Comparativa Mensual de Flujo de Caja</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Mes</th>
                  <th className="py-2.5 px-3 text-right">Ingresos</th>
                  <th className="py-2.5 px-3 text-right">Gastos</th>
                  <th className="py-2.5 px-3 text-right">Ahorro Neto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {analytics.monthlyTrend.map((m) => (
                  <tr key={m.monthLabel} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-800">
                      {m.monthLabel}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 font-bold">
                      +${m.income.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-rose-600 font-bold">
                      -${m.expense.toFixed(2)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-black ${
                        m.savings >= 0 ? 'text-blue-600' : 'text-rose-600'
                      }`}
                    >
                      ${m.savings.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Transaction Table (Print-friendly and export-verifiable) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>Libro Diario de Movimientos del Periodo</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Registros contabilizados incluidos en este informe ({filteredTransactions.length} movimientos)
            </p>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No se encontraron movimientos registrados con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Cuenta</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const isTransfer = tx.type === 'TRANSFER';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {tx.description}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="text-slate-600">
                          {tx.category?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isTransfer
                              ? 'bg-blue-100 text-blue-800'
                              : isIncome
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isTransfer ? 'Transferencia' : isIncome ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {tx.account?.name || 'Cuenta'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-mono font-bold whitespace-nowrap ${
                          isTransfer
                            ? 'text-blue-700'
                            : isIncome
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {isIncome ? '+' : isTransfer ? '⇄ ' : '-'} $
                        {tx.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Accounting Reconciliation Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            FinanAPP Resumen Contable • Suma Ingresos: +$
            {analytics.totalIncome.toFixed(2)} | Suma Gastos: -$
            {analytics.totalExpenses.toFixed(2)}
          </span>
          <span className="font-bold text-slate-800">
            Saldo Neto: ${analytics.netSavings.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};
