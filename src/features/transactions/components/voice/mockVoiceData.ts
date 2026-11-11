/**
 * Mock data & example chips for Voice AI Modal
 * Allows testing all 7 states without backend dependency
 */

import { VoiceTransactionResponse } from '../../services/ai-voice.service';

export interface PromptChip {
  id: string;
  label: string;
  categoryHint: string;
  mockAmount: number;
  mockType: 'EXPENSE' | 'INCOME' | 'TRANSFER';
}

export const VOICE_EXAMPLE_CHIPS: PromptChip[] = [
  {
    id: 'chip-1',
    label: 'Gasté 20 mil en transporte',
    categoryHint: 'Transporte',
    mockAmount: 20000,
    mockType: 'EXPENSE',
  },
  {
    id: 'chip-2',
    label: 'Me pagaron 1.500.000',
    categoryHint: 'Ingresos',
    mockAmount: 1500000,
    mockType: 'INCOME',
  },
  {
    id: 'chip-3',
    label: 'Ayer pagué el arriendo',
    categoryHint: 'Vivienda',
    mockAmount: 950000,
    mockType: 'EXPENSE',
  },
];

export const MOCK_CONFIRMATION_DATA: VoiceTransactionResponse = {
  raw: {
    tipo: 'gasto',
    monto: 25000,
    moneda: 'COP',
    descripcion: 'Almuerzo con compañeros',
    comercio: 'Restaurante',
    categoria: 'Alimentos',
    fecha_movimiento: new Date().toISOString().split('T')[0],
    cuenta_origen: 'Bancolombia Ahorros',
    cuenta_destino: null,
    necesita_confirmacion: false,
  },
  suggestedPayload: {
    type: 'EXPENSE',
    amount: 25000,
    description: 'Almuerzo con compañeros',
    categoryName: 'Alimentos',
    accountName: 'Bancolombia Ahorros',
    date: new Date().toISOString().split('T')[0],
    currency: 'COP',
  },
  confidence: 0.95,
  engineUsed: 'gemini-3.8-flash',
};

export const MOCK_MISSING_DATA: VoiceTransactionResponse = {
  raw: {
    tipo: 'gasto',
    monto: 0,
    moneda: 'COP',
    descripcion: 'Pago de servicio de internet',
    comercio: 'Claro / Tigo',
    categoria: 'Servicios',
    fecha_movimiento: new Date().toISOString().split('T')[0],
    cuenta_origen: null,
    cuenta_destino: null,
    necesita_confirmacion: true,
  },
  suggestedPayload: {
    type: 'EXPENSE',
    amount: 0,
    description: 'Pago de servicio de internet',
    categoryName: 'Servicios',
    date: new Date().toISOString().split('T')[0],
    currency: 'COP',
  },
  confidence: 0.65,
  engineUsed: 'gemini-3.8-flash',
};
