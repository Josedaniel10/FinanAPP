import { apiClient } from '../../../shared/lib/api-client';
import { Category, Account } from '../types';

export interface RawVoiceTransaction {
  tipo: 'gasto' | 'ingreso' | 'transferencia';
  monto: number;
  moneda: string;
  descripcion: string;
  comercio: string | null;
  categoria: string;
  fecha_movimiento: string;
  cuenta_origen: string | null;
  cuenta_destino: string | null;
  necesita_confirmacion: boolean;
}

export interface SuggestedPayload {
  type: 'EXPENSE' | 'INCOME' | 'TRANSFER';
  amount: number;
  description: string;
  categoryId?: string;
  categoryName: string;
  accountId?: string;
  accountName?: string;
  destinationAccountId?: string;
  destinationAccountName?: string;
  date: string;
  notes?: string;
  currency: string;
  paymentMethod?: 'CASH' | 'DEBIT_CARD' | 'CREDIT_CARD' | 'TRANSFER' | 'OTHER';
}

export interface VoiceTransactionResponse {
  raw: RawVoiceTransaction;
  suggestedPayload: SuggestedPayload;
  confidence: number;
  engineUsed: 'gemini-3.8-flash' | 'nlp-engine-local';
}

export const aiVoiceService = {
  async processVoice(params: {
    text?: string;
    audioData?: string;
    mimeType?: string;
    categories: Category[];
    accounts: Account[];
    preferredCurrency?: string;
    customDate?: string;
  }): Promise<VoiceTransactionResponse> {
    const simplifiedCategories = params.categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
    }));

    const simplifiedAccounts = params.accounts.map((a) => ({
      id: a.id,
      name: a.name,
      currency: a.currency,
      isDefault: a.isDefault,
    }));

    const response = await apiClient<{ success: boolean; data: VoiceTransactionResponse }>(
      '/ai/voice-transaction',
      {
        method: 'POST',
        data: {
          text: params.text,
          audioData: params.audioData,
          mimeType: params.mimeType,
          categories: simplifiedCategories,
          accounts: simplifiedAccounts,
          preferredCurrency: params.preferredCurrency,
          customDate: params.customDate,
        },
      }
    );

    return response.data;
  },

  async getContextInfo(): Promise<{
    currentDateFormatted: string;
    isoDate: string;
    supportedCategories: string[];
  }> {
    const response = await apiClient<{
      success: boolean;
      data: {
        currentDateFormatted: string;
        isoDate: string;
        supportedCategories: string[];
      };
    }>('/ai/context');
    return response.data;
  },
};
