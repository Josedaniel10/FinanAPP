import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { transactionService } from '../../transactions/services/transaction.service';
import { Transaction } from '../../transactions/types';
import { reportService, ReportFilter, PeriodAnalytics } from '../services/report.service';
import { useAccountsQuery } from '../../accounts/hooks/useAccountsQuery';
import {
  FileSpreadsheet,
  PieChart,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  FileText,
  TrendingUp,
  Download,
  X,
  SlidersHorizontal,
  RotateCcw,
  BarChart3,
} from 'lucide-react';
import { DSButton, DSChip, DSInput } from '../../../design-system';
import { showToast } from '../../../stores/toastStore';
import { useCurrency } from '../../../shared/hooks/useCurrency';

// Visual Chart Components - Kept strictly to the most intuitive charts
import { CashFlowChart } from './charts/CashFlowChart';
import { CategoryDonutChart } from './charts/CategoryDonutChart';

type ViewTab = 'OVERVIEW' | 'LEDGER';

export const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { format, preferredCurrency } = useCurrency();
  const { data: accounts = [] } = useAccountsQuery();

  // Period state
  const [period, setPeriod] = useState<ReportFilter['period']>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Slicer filters
  const [selectedAccountId, setSelectedAccountId] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Advanced filters visibility toggle (hidden by default as requested)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Active view tab in Reports
  const [activeTab, setActiveTab] = useState<ViewTab>('OVERVIEW');

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

  // Apply secondary filters (Account, Type, Category, Search query)
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

      // Spotlight / Category filter
      if (selectedCategoryName) {
        const catName = tx.category?.name || 'General';
        if (catName.toLowerCase() !== selectedCategoryName.toLowerCase()) {
          return false;
        }
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
  }, [transactions, selectedAccountId, selectedType, selectedCategoryName, searchQuery]);

  // Compute full analytics for current date range
  const analytics: PeriodAnalytics = useMemo(() => {
    return reportService.computeAnalytics(filteredTransactions, dateRange.startDate, dateRange.endDate);
  }, [filteredTransactions, dateRange.startDate, dateRange.endDate]);

  // Active advanced filters counter
  const activeAdvancedFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedAccountId !== 'ALL') count++;
    if (selectedType !== 'ALL') count++;
    if (selectedCategoryName) count++;
    if (searchQuery.trim()) count++;
    if (period === 'CUSTOM' && (customStart || customEnd)) count++;
    return count;
  }, [selectedAccountId, selectedType, selectedCategoryName, searchQuery, period, customStart, customEnd]);

  const handleClearFilters = () => {
    setSelectedAccountId('ALL');
    setSelectedType('ALL');
    setSelectedCategoryName(null);
    setSearchQuery('');
    if (period === 'CUSTOM') {
      setPeriod('THIS_MONTH');
      setCustomStart('');
      setCustomEnd('');
    }
  };

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
        `reporte_financiero_${period.toLowerCase()}`,
        preferredCurrency
      );
      showToast({ type: 'success', message: 'Reporte PDF generado y descargado con éxito.' });
    } catch (err) {
      console.error('Error al generar PDF:', err);
      showToast({ type: 'error', message: 'No se pudo generar el archivo PDF.' });
    }
  };

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
            Visualiza tu flujo de caja, distribución de gastos y balance contable de forma clara y directa.
          </p>
        </div>

        {/* Clean Export Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <DSButton
            variant="outline"
            size="md"
            className="min-h-[42px]"
            leftIcon={<Download className="w-4 h-4 text-emerald-600" />}
            onClick={handleDownloadPDF}
          >
            Descargar PDF
          </DSButton>

          <DSButton
            variant="primary"
            size="md"
            className="min-h-[42px]"
            leftIcon={<FileSpreadsheet className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Exportar Excel ({filteredTransactions.length})
          </DSButton>
        </div>
      </div>

      {/* Period Selection & Slicers Bar (Clean & Minimalist, with Advanced Filters Button) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3.5 no-print">
        {/* Top line: Period Label + Currency + Toggle Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Periodo
            </span>
            <span className="text-xs text-slate-400 font-mono">
              ({dateRange.startDate} — {dateRange.endDate})
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {preferredCurrency}
            </span>

            {/* Advanced Filters Button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFilters((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                showAdvancedFilters || activeAdvancedFiltersCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Filtros avanzados</span>
              {activeAdvancedFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {activeAdvancedFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Clean Period Chips */}
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
            onClick={() => {
              setPeriod('CUSTOM');
              setShowAdvancedFilters(true);
            }}
          />
        </div>

        {/* Active Applied Filter Badges (Shown only when secondary filters are active) */}
        {activeAdvancedFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] text-slate-400 font-medium">Filtros aplicados:</span>
            {selectedAccountId !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                <span>Cuenta: {accounts.find((a) => a.id === selectedAccountId)?.name || 'Seleccionada'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedAccountId('ALL')}
                  className="hover:text-emerald-950 cursor-pointer"
                  title="Quitar filtro de cuenta"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedType !== 'ALL' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                <span>
                  Tipo: {selectedType === 'INCOME' ? 'Ingresos' : selectedType === 'EXPENSE' ? 'Gastos' : 'Transferencias'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedType('ALL')}
                  className="hover:text-emerald-950 cursor-pointer"
                  title="Quitar filtro de tipo"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedCategoryName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                <span>Categoría: {selectedCategoryName}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategoryName(null)}
                  className="hover:text-emerald-950 cursor-pointer"
                  title="Quitar filtro de categoría"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                <span>Texto: "{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-emerald-950 cursor-pointer"
                  title="Quitar búsqueda"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-2 ml-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer</span>
            </button>
          </div>
        )}

        {/* COLLAPSIBLE ADVANCED FILTERS: Only visible when clicking the button */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Opciones de Filtro Avanzado</span>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(false)}
                className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ocultar filtros</span>
              </button>
            </div>

            {/* Custom Date Pickers if period is CUSTOM */}
            {period === 'CUSTOM' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
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

            {/* Secondary Slicers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  Búsqueda por texto
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Descripción, concepto o notas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Clean Navigation: Overview vs Ledger (no-print) */}
      <div className="flex items-center justify-between no-print border-b border-slate-200/80 pb-2">
        <div className="flex items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Resumen & Gráficos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LEDGER')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'LEDGER'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Libro de Movimientos</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 ml-0.5">
              {filteredTransactions.length}
            </span>
          </button>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline font-medium">
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'movimiento' : 'movimientos'} registrados
        </span>
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

      {/* KPI Cards Row (Clean, crisp, legible) */}
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
            +{format(analytics.totalIncome)}
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
            -{format(analytics.totalExpenses)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Salidas del periodo</p>
        </div>

        {/* Net Savings & Savings Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
              Balance Neto
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
              {analytics.savingsRate}% ahorro
            </span>
          </div>
          <p
            className={`text-xl sm:text-2xl font-black font-mono tabular-nums mt-1 ${
              analytics.netSavings >= 0 ? 'text-blue-700' : 'text-rose-600'
            }`}
          >
            {format(analytics.netSavings)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {analytics.netSavings >= 0 ? 'Superávit a favor' : 'Déficit del periodo'}
          </p>
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
            {format(analytics.dailyAverageExpense)}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Ritmo de egreso diario</p>
        </div>
      </div>

      {/* =========================================================================
          SECTION 1: OVERVIEW & THE 2 ESSENTIAL CHARTS
      ========================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Chart 1: Cash Flow Evolution (Ingresos vs Gastos) */}
          <CashFlowChart
            monthlyData={analytics.monthlyTrend}
            dailyData={analytics.dailyTrend}
            cumulativeData={analytics.cumulativeTrend}
          />

          {/* Chart 2: Category Donut Chart (Spacious and clear distribution) */}
          <CategoryDonutChart
            categories={analytics.categoryBreakdown}
            totalExpenses={analytics.totalExpenses}
            onSelectCategory={(catName) => {
              if (selectedCategoryName === catName) {
                setSelectedCategoryName(null);
              } else {
                setSelectedCategoryName(catName);
                showToast({ type: 'info', message: `Filtrando vista por: ${catName}` });
              }
            }}
            selectedCategoryName={selectedCategoryName || undefined}
          />

          {/* Insight Cards: Highest Expense & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Highest Expense Highlight */}
            {analytics.highestExpenseTransaction ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Mayor Gasto Registrado</span>
                  </div>
                  <h4 className="text-lg font-bold">
                    {analytics.highestExpenseTransaction.description}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1">
                    {analytics.highestExpenseTransaction.category?.name || 'General'} •{' '}
                    {analytics.highestExpenseTransaction.date} •{' '}
                    {analytics.highestExpenseTransaction.account?.name || 'Cuenta'}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Importe</span>
                  <span className="text-2xl font-black font-mono text-rose-400 tabular-nums">
                    -{format(analytics.highestExpenseTransaction.amount)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                <Sparkles className="w-6 h-6 text-slate-300 mb-1" />
                <span>No hay gastos individuales registrados en este periodo</span>
              </div>
            )}

            {/* Quick Metrics Summary */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
                  Resumen Contable del Periodo
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Movimientos Contabilizados</span>
                    <span className="text-lg font-black font-mono text-slate-900 tabular-nums">
                      {filteredTransactions.length}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <span className="text-[11px] text-slate-500 block">Transferencias entre Cuentas</span>
                    <span className="text-lg font-black font-mono text-blue-700 tabular-nums">
                      {format(analytics.totalTransfers)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Saldo del periodo:</span>
                <span className="font-bold font-mono text-slate-900">
                  {format(analytics.netSavings)}
                </span>
              </div>
            </div>
          </div>

          {/* Monthly Trend Table (Shown if multi-month to complement the Cash Flow chart) */}
          {analytics.monthlyTrend.length > 1 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Comparativa Mensual de Flujo</span>
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
                          +{format(m.income)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-rose-600 font-bold">
                          -{format(m.expense)}
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-black ${
                            m.savings >= 0 ? 'text-blue-600' : 'text-rose-600'
                          }`}
                        >
                          {format(m.savings)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 2: TRANSACTION LEDGER (Available via Tab or always in Print)
      ========================================================================== */}
      {(activeTab === 'LEDGER' || typeof window !== 'undefined') && (
        <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden ${activeTab !== 'LEDGER' ? 'hidden print:block' : ''}`}>
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
            <>
              {/* MOBILE VIEW (md:hidden): Compact transaction cards */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const isTransfer = tx.type === 'TRANSFER';
                  return (
                    <div key={tx.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                            {tx.description || tx.category?.name || (isIncome ? 'Ingreso' : 'Gasto')}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                            <span>{tx.date}</span>
                            <span>·</span>
                            <span>{tx.account?.name || 'Cuenta'}</span>
                            {tx.category?.name && (
                              <>
                                <span>·</span>
                                <span className="text-slate-600 font-medium">{tx.category.name}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-xs sm:text-sm font-bold font-mono tabular-nums block ${
                              isTransfer
                                ? 'text-blue-700'
                                : isIncome
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {isIncome ? '+' : isTransfer ? '⇄ ' : '-'} {format(tx.amount)}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                              isTransfer
                                ? 'bg-blue-100 text-blue-800'
                                : isIncome
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isTransfer ? 'Transferencia' : isIncome ? 'Ingreso' : 'Gasto'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP VIEW (hidden md:block): Full Detailed Table */}
              <div className="hidden md:block overflow-x-auto">
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
                            {isIncome ? '+' : isTransfer ? '⇄ ' : '-'} {format(tx.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Accounting Reconciliation Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              FinanAPP Resumen Contable • Suma Ingresos: +{format(analytics.totalIncome)} | Suma Gastos: -{format(analytics.totalExpenses)}
            </span>
            <span className="font-bold text-slate-800 font-mono">
              Saldo Neto: {format(analytics.netSavings)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

