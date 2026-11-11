export interface VoiceTransactionResult {
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

export interface SuggestedTransactionPayload {
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
  raw: VoiceTransactionResult;
  suggestedPayload: SuggestedTransactionPayload;
  confidence: number;
  engineUsed: 'gemini-3.8-flash' | 'nlp-engine-local';
}
