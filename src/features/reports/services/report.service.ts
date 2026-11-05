import { apiClient } from '../../../shared/lib/api-client';
import { Transaction, FinancialSummary } from '../../transactions/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportFilter {
  period: 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_3_MONTHS' | 'THIS_YEAR' | 'ALL' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  accountId?: string;
  type?: 'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

export interface PeriodAnalytics {
  totalIncome: number;
  totalExpenses: number;
  totalTransfers: number;
  netSavings: number;
  savingsRate: number; // percentage (0 - 100)
  dailyAverageExpense: number;
  transactionsCount: number;
  highestExpenseTransaction?: Transaction;
  categoryBreakdown: {
    categoryName: string;
    categoryColor: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  paymentMethodBreakdown: {
    method: string;
    label: string;
    total: number;
    count: number;
    percentage: number;
  }[];
  monthlyTrend: {
    monthLabel: string;
    income: number;
    expense: number;
    savings: number;
  }[];
}

export const reportService = {
  // Resolve dates for standard period presets
  getDateRangeForPeriod(period: ReportFilter['period']): { startDate: string; endDate: string } {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const formatDate = (d: Date) => d.toISOString().split('T')[0] || '';

    switch (period) {
      case 'THIS_MONTH': {
        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
      case 'LAST_MONTH': {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
      case 'LAST_3_MONTHS': {
        const start = new Date(year, month - 2, 1);
        const end = new Date(year, month + 1, 0);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
      case 'THIS_YEAR': {
        const start = new Date(year, 0, 1);
        const end = new Date(year, 11, 31);
        return { startDate: formatDate(start), endDate: formatDate(end) };
      }
      case 'ALL':
      default:
        return { startDate: '2020-01-01', endDate: '2030-12-31' };
    }
  },

  computeAnalytics(transactions: Transaction[], startDate: string, endDate: string): PeriodAnalytics {
    let totalIncome = 0;
    let totalExpenses = 0;
    let totalTransfers = 0;
    let highestExpenseTx: Transaction | undefined;

    const catMap = new Map<string, { categoryName: string; categoryColor: string; total: number; count: number }>();
    const pmMap = new Map<string, { label: string; total: number; count: number }>();
    const monthMap = new Map<string, { monthLabel: string; income: number; expense: number }>();

    const paymentMethodLabels: Record<string, string> = {
      CASH: 'Efectivo',
      DEBIT_CARD: 'Tarjeta Débito',
      CREDIT_CARD: 'Tarjeta Crédito',
      TRANSFER: 'Transferencia',
      OTHER: 'Otro',
    };

    for (const tx of transactions) {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        totalExpenses += tx.amount;
        if (!highestExpenseTx || tx.amount > highestExpenseTx.amount) {
          highestExpenseTx = tx;
        }

        // Category breakdown for expenses
        const catName = tx.category?.name || 'General';
        const catColor = tx.category?.color || '#059669';
        const catData = catMap.get(catName) || {
          categoryName: catName,
          categoryColor: catColor,
          total: 0,
          count: 0,
        };
        catData.total += tx.amount;
        catData.count += 1;
        catMap.set(catName, catData);
      } else if (tx.type === 'TRANSFER') {
        totalTransfers += tx.amount;
      }

      // Payment method breakdown
      const pm = tx.paymentMethod || 'OTHER';
      const pmData = pmMap.get(pm) || {
        label: paymentMethodLabels[pm] || pm,
        total: 0,
        count: 0,
      };
      pmData.total += tx.amount;
      pmData.count += 1;
      pmMap.set(pm, pmData);

      // Monthly trend grouping (YYYY-MM)
      const monthKey = tx.date.substring(0, 7);
      const monthData = monthMap.get(monthKey) || {
        monthLabel: monthKey,
        income: 0,
        expense: 0,
      };
      if (tx.type === 'INCOME') monthData.income += tx.amount;
      if (tx.type === 'EXPENSE') monthData.expense += tx.amount;
      monthMap.set(monthKey, monthData);
    }

    const netSavings = totalIncome - totalExpenses;
    const savingsRate =
      totalIncome > 0 ? Math.max(0, Math.min(100, Math.round((netSavings / totalIncome) * 100))) : 0;

    // Calculate days between start and end
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const dayCount = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    const dailyAverageExpense = totalExpenses > 0 ? Math.round((totalExpenses / dayCount) * 100) / 100 : 0;

    // Format category breakdown with percentages
    const categoryBreakdown = Array.from(catMap.values())
      .map((c) => ({
        ...c,
        total: Math.round(c.total * 100) / 100,
        percentage: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Format payment method breakdown with percentages
    const totalTransactionsAmount = totalIncome + totalExpenses + totalTransfers;
    const paymentMethodBreakdown = Array.from(pmMap.entries())
      .map(([method, p]) => ({
        method,
        label: p.label,
        total: Math.round(p.total * 100) / 100,
        count: p.count,
        percentage: totalTransactionsAmount > 0 ? Math.round((p.total / totalTransactionsAmount) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Format monthly trend sorted chronologically
    const monthlyTrend = Array.from(monthMap.values())
      .map((m) => ({
        monthLabel: m.monthLabel,
        income: Math.round(m.income * 100) / 100,
        expense: Math.round(m.expense * 100) / 100,
        savings: Math.round((m.income - m.expense) * 100) / 100,
      }))
      .sort((a, b) => a.monthLabel.localeCompare(b.monthLabel));

    return {
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      totalTransfers: Math.round(totalTransfers * 100) / 100,
      netSavings: Math.round(netSavings * 100) / 100,
      savingsRate,
      dailyAverageExpense,
      transactionsCount: transactions.length,
      highestExpenseTransaction: highestExpenseTx,
      categoryBreakdown,
      paymentMethodBreakdown,
      monthlyTrend,
    };
  },

  // Export structured CSV compatible with Microsoft Excel and Google Sheets
  exportToCSV(transactions: Transaction[], fileNamePrefix = 'reporte_financiero'): void {
    const headers = [
      'Fecha',
      'Descripción',
      'Tipo',
      'Categoría',
      'Monto',
      'Moneda',
      'Cuenta Origen',
      'Cuenta Destino',
      'Método de Pago',
      'Notas',
    ];

    const typeLabels: Record<string, string> = {
      INCOME: 'Ingreso',
      EXPENSE: 'Gasto',
      TRANSFER: 'Transferencia',
    };

    const paymentMethodLabels: Record<string, string> = {
      CASH: 'Efectivo',
      DEBIT_CARD: 'Tarjeta de Débito',
      CREDIT_CARD: 'Tarjeta de Crédito',
      TRANSFER: 'Transferencia',
      OTHER: 'Otro',
    };

    const rows = transactions.map((t) => [
      t.date,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      typeLabels[t.type] || t.type,
      `"${(t.category?.name || 'General').replace(/"/g, '""')}"`,
      t.amount.toFixed(2),
      t.account?.currency || 'USD',
      `"${(t.account?.name || 'Cuenta').replace(/"/g, '""')}"`,
      `"${(t.destinationAccount?.name || '').replace(/"/g, '""')}"`,
      paymentMethodLabels[t.paymentMethod || 'OTHER'] || t.paymentMethod,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    // Use semicolon as delimiter for Excel compatibility in Spanish locales
    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const todayStr = new Date().toISOString().split('T')[0];

    link.setAttribute('href', url);
    link.setAttribute('download', `${fileNamePrefix}_finanapp_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Export structured PDF with executive design and auto-download
  exportToPDF(
    transactions: Transaction[],
    analytics: PeriodAnalytics,
    user: { name?: string; email?: string } | null,
    startDate: string,
    endDate: string,
    fileNamePrefix = 'reporte_financiero'
  ): void {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor = [5, 150, 105]; // #059669 emerald
    const darkColor = [15, 23, 42]; // #0f172a slate-900
    const grayColor = [100, 116, 139]; // #64748b slate-500

    // Header Accent Bar
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 8, 'F');

    // Header Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('FinanAPP', 14, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text('Informe Financiero & Análisis Contable', 14, 26);

    // Meta details on the right
    doc.setFontSize(8);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, 196, 18, { align: 'right' });
    doc.text(`Periodo: ${startDate} al ${endDate}`, 196, 23, { align: 'right' });
    doc.text(`Usuario: ${user?.name || 'Usuario'} (${user?.email || 'N/A'})`, 196, 28, { align: 'right' });

    // Decorative line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, 32, 196, 32);

    // KPI Summary Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text('Resumen Ejecutivo del Periodo', 14, 39);

    autoTable(doc, {
      startY: 42,
      head: [['Total Ingresos', 'Total Gastos', 'Ahorro Neto', 'Tasa Ahorro', 'Gasto Prom. Diario']],
      body: [[
        `+$${analytics.totalIncome.toFixed(2)}`,
        `-$${analytics.totalExpenses.toFixed(2)}`,
        `$${analytics.netSavings.toFixed(2)}`,
        `${analytics.savingsRate}%`,
        `$${analytics.dailyAverageExpense.toFixed(2)}`,
      ]],
      theme: 'grid',
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'center',
      },
      bodyStyles: {
        textColor: [15, 23, 42],
        fontSize: 8.5,
        fontStyle: 'bold',
        halign: 'center',
      },
      margin: { left: 14, right: 14 },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 7;

    // Category Breakdown (if any)
    if (analytics.categoryBreakdown.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
      doc.text('Distribución de Gastos por Categoría', 14, currentY);

      const catRows = analytics.categoryBreakdown.slice(0, 8).map((c) => [
        c.categoryName,
        c.count.toString(),
        `$${c.total.toFixed(2)}`,
        `${c.percentage}%`,
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['Categoría', 'N° Movimientos', 'Monto Total', 'Porcentaje']],
        body: catRows,
        theme: 'striped',
        headStyles: {
          fillColor: [5, 150, 105],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
        },
        bodyStyles: {
          fontSize: 7.5,
          textColor: [51, 65, 85],
        },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right', fontStyle: 'bold' },
          3: { halign: 'right' },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 7;
    }

    // Detailed Transactions Ledger
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`Libro Diario de Movimientos (${transactions.length} registros)`, 14, currentY);

    const typeLabels: Record<string, string> = {
      INCOME: 'Ingreso',
      EXPENSE: 'Gasto',
      TRANSFER: 'Transferencia',
    };

    const tableRows = transactions.map((t) => [
      t.date,
      t.description || '',
      typeLabels[t.type] || t.type,
      t.category?.name || 'General',
      t.account?.name || 'Cuenta',
      `${t.type === 'INCOME' ? '+' : t.type === 'TRANSFER' ? '⇄ ' : '-'} $${t.amount.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Fecha', 'Descripción', 'Tipo', 'Categoría', 'Cuenta', 'Monto']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [51, 65, 85],
      },
      columnStyles: {
        0: { cellWidth: 22 },
        2: { cellWidth: 24 },
        3: { cellWidth: 32 },
        4: { cellWidth: 28 },
        5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `FinanAPP © ${new Date().getFullYear()} • Documento Contable de Uso Personal • Página ${data.pageNumber} de ${pageCount}`,
          105,
          290,
          { align: 'center' }
        );
      },
    });

    const todayStr = new Date().toISOString().split('T')[0];
    doc.save(`${fileNamePrefix}_${todayStr}.pdf`);
  },

  // Trigger printer / PDF export dialog fallback
  printReport(): void {
    window.print();
  },
};
