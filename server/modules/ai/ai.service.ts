import { GoogleGenAI } from '@google/genai';
import {
  VoiceTransactionResult,
  VoiceTransactionResponse,
  SuggestedTransactionPayload,
} from './ai.types.js';

interface CategoryContext {
  id: string;
  name: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
}

interface AccountContext {
  id: string;
  name: string;
  currency?: string;
  isDefault?: boolean;
}

export function formatContextDateSpanish(d: Date = new Date()): { formatted: string; iso: string } {
  const days = [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ];
  const months = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ];

  const dayName = days[d.getDay()];
  const dayNum = d.getDate();
  const monthName = months[d.getMonth()];
  const year = d.getFullYear();

  const formatted = `${dayName} ${dayNum} de ${monthName} de ${year}`;
  const iso = d.toISOString().split('T')[0];
  return { formatted, iso };
}

export class AIService {
  private genAIClient: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
      this.genAIClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  private getGenAI(): GoogleGenAI | null {
    if (!this.genAIClient) {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (apiKey) {
        this.genAIClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });
      }
    }
    return this.genAIClient;
  }

  /**
   * Process voice input using Gemini multimodal audio/text or cognitive fallback rules
   */
  async processVoiceInput(params: {
    text?: string;
    audioData?: string;
    mimeType?: string;
    categories?: CategoryContext[];
    accounts?: AccountContext[];
    preferredCurrency?: string;
    customDate?: string;
  }): Promise<VoiceTransactionResponse> {
    const trimmedText = params.text?.trim() || '';
    const hasAudio = Boolean(params.audioData);

    if (!trimmedText && !hasAudio) {
      throw new Error('Debes proporcionar una grabación de audio o texto para procesar.');
    }

    const baseDate = params.customDate ? new Date(params.customDate) : new Date();
    const { formatted: formattedDate, iso: isoDate } = formatContextDateSpanish(baseDate);

    const client = this.getGenAI();

    if (client) {
      try {
        const geminiPromise = this.callGemini({
          transcription: trimmedText,
          audioData: params.audioData,
          mimeType: params.mimeType,
          formattedDate,
          isoDate,
          categories: params.categories,
          accounts: params.accounts,
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout excedido')), 8000)
        );

        const rawResult = await Promise.race([geminiPromise, timeoutPromise]);
        const suggestedPayload = this.mapToFinanAppPayload(
          rawResult,
          params.categories,
          params.accounts,
          params.preferredCurrency
        );
        return {
          raw: rawResult,
          suggestedPayload,
          confidence: rawResult.necesita_confirmacion ? 0.65 : 0.95,
          engineUsed: 'gemini-3.8-flash',
        };
      } catch (err: any) {
        console.warn('⚠️ [Gemini API] Fallback a motor local:', err.message || err);
      }
    }

    // Cognitive Local Fallback (requires text)
    if (trimmedText) {
      const localResult = this.parseWithCognitiveRules(
        trimmedText,
        baseDate,
        params.categories,
        params.accounts
      );
      const suggestedPayload = this.mapToFinanAppPayload(
        localResult,
        params.categories,
        params.accounts,
        params.preferredCurrency
      );

      return {
        raw: localResult,
        suggestedPayload,
        confidence: localResult.necesita_confirmacion ? 0.6 : 0.9,
        engineUsed: 'nlp-engine-local',
      };
    }

    // If audio was sent but could not be transcribed (e.g. Gemini key not configured) and text was empty,
    // return a safe structure needing confirmation instead of crashing the server with a 500 error
    const defaultDate = isoDate;
    const defaultRaw: VoiceTransactionResult = {
      tipo: 'gasto',
      monto: 0,
      moneda: 'DEFAULT',
      descripcion: 'Movimiento por voz',
      comercio: null,
      categoria: 'Otros',
      fecha_movimiento: defaultDate,
      cuenta_origen: null,
      cuenta_destino: null,
      necesita_confirmacion: true,
    };

    const suggestedPayload = this.mapToFinanAppPayload(
      defaultRaw,
      params.categories,
      params.accounts,
      params.preferredCurrency
    );

    return {
      raw: defaultRaw,
      suggestedPayload,
      confidence: 0.2,
      engineUsed: 'nlp-engine-local',
    };
  }

  async processVoiceTranscription(
    text: string,
    options: {
      categories?: CategoryContext[];
      accounts?: AccountContext[];
      preferredCurrency?: string;
      customDate?: string;
    } = {}
  ): Promise<VoiceTransactionResponse> {
    return this.processVoiceInput({
      text,
      ...options,
    });
  }

  private async callGemini(args: {
    transcription?: string;
    audioData?: string;
    mimeType?: string;
    formattedDate: string;
    isoDate: string;
    categories?: CategoryContext[];
    accounts?: AccountContext[];
  }): Promise<VoiceTransactionResult> {
    const { transcription, audioData, mimeType, formattedDate, isoDate, categories, accounts } = args;
    const client = this.getGenAI()!;
    const catList = categories && categories.length > 0
      ? categories.map((c) => c.name).join(', ')
      : 'Alimentos, Transporte, Vivienda, Entretenimiento, Servicios, Salud, Educación, Ingresos, Transferencia, Otros';

    const accList = accounts && accounts.length > 0
      ? accounts.map((a) => a.name).join(', ')
      : '';

    const systemInstruction = `Eres el motor de Procesamiento de Lenguaje Natural (PLN) de "FinanzasPro", una aplicación móvil de finanzas personales. Tu único objetivo es procesar la transcripción de voz o audio de un usuario que desea registrar un movimiento financiero (ingreso, gasto o transferencia) y transformarlo en un objeto JSON estructurado y listo para la base de datos.

### FECHA ACTUAL DEL CONTEXTO:
${formattedDate} (Fecha ISO: ${isoDate})

### REGLAS DE EXPERIENCIA DE USUARIO (UX) Y DISEÑO COGNITIVO:
1. Minimiza el esfuerzo: El usuario no habla con etiquetas. Si dice "Me compré un café en Starbucks por 4.50", asume que la categoría es "Alimentos y Bebidas" o "Cafetería", el comercio es "Starbucks" y el tipo es "gasto".
2. Manejo del tiempo relativo: Si el usuario dice "ayer", "el viernes pasado" o "hace una hora", calcula la fecha exacta basándote en la fecha actual proporcionada (${isoDate}). Si no menciona el tiempo, asume la fecha y hora actuales.
3. Inteligencia de Categorías: Clasifica el movimiento en una de estas categorías estándar: [Alimentos, Transporte, Vivienda, Entretenimiento, Servicios, Salud, Educación, Ingresos, Transferencia, Otros]. O en una de las categorías disponibles del usuario si encaja mejor: [${catList}]. Si es muy ambiguo, usa "Otros".
4. Flexibilidad de Moneda: Si no se menciona la moneda, déjala como "DEFAULT". Si se menciona (ej. "veinte dólares", "diez euros", "pesos"), usa el código ISO (USD, EUR, MXN, etc.).
5. Limpieza de Texto: Limpia palabras de relleno ("eh", "bueno", "registra ahí", "porfa", "anota", "oye") para extraer la descripción real concisa y profesional.
${accList ? `6. Cuentas del usuario: [${accList}]. Asigna cuenta_origen y/o cuenta_destino si el usuario las menciona.` : ''}

### ESQUEMA DE SALIDA:
Debes responder ÚNICAMENTE con un objeto JSON que siga esta estructura, sin texto adicional, sin bloques de código Markdown, solo el JSON:

{
  "tipo": "gasto" | "ingreso" | "transferencia",
  "monto": float,
  "moneda": "string (ISO o DEFAULT)",
  "descripcion": "string (limpia)",
  "comercio": "string o null",
  "categoria": "string",
  "fecha_movimiento": "YYYY-MM-DD",
  "cuenta_origen": "string o null",
  "cuenta_destino": "string o null (solo para transferencias)",
  "necesita_confirmacion": boolean
}`;

    const parts: any[] = [];
    if (audioData) {
      parts.push({
        inlineData: {
          mimeType: (mimeType || 'audio/webm').split(';')[0].trim(),
          data: audioData,
        },
      });
    }

    if (transcription) {
      parts.push({
        text: `Transcripción de voz preliminar del usuario: "${transcription}". Escucha el audio si está disponible y extrae el JSON estructurado.`,
      });
    } else {
      parts.push({
        text: 'Escucha con atención el audio de voz grabado por el usuario describiendo un movimiento financiero y extrae el JSON estructurado.',
      });
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text || '';
    const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      tipo: parsed.tipo === 'ingreso' ? 'ingreso' : parsed.tipo === 'transferencia' ? 'transferencia' : 'gasto',
      monto: typeof parsed.monto === 'number' ? parsed.monto : parseFloat(parsed.monto) || 0,
      moneda: parsed.moneda || 'DEFAULT',
      descripcion: parsed.descripcion || transcription || 'Movimiento por voz',
      comercio: parsed.comercio ?? null,
      categoria: parsed.categoria || 'Otros',
      fecha_movimiento: parsed.fecha_movimiento || isoDate,
      cuenta_origen: parsed.cuenta_origen ?? null,
      cuenta_destino: parsed.cuenta_destino ?? null,
      necesita_confirmacion: Boolean(parsed.necesita_confirmacion),
    };
  }

  /**
   * Rule-based cognitive parser compliant with the 5 prompt rules
   */
  private parseWithCognitiveRules(
    text: string,
    baseDate: Date,
    categories?: CategoryContext[],
    accounts?: AccountContext[]
  ): VoiceTransactionResult {
    const rawLower = text.toLowerCase();
    const normLower = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // 1. Clean filler words
    let cleanText = text
      .replace(/^(eh|bueno|oye|porfa|por favor|registra ahí|anota ahí|pon ahí|guarda ahí|registra|anota|agrega)\s+/i, '')
      .replace(/\s+(porfa|por favor)$/i, '')
      .trim();

    // 2. Relative date calculation
    let fechaMovimiento = baseDate.toISOString().split('T')[0];
    if (normLower.includes('anteayer') || normLower.includes('antes de ayer')) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - 2);
      fechaMovimiento = d.toISOString().split('T')[0];
    } else if (normLower.includes('ayer')) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() - 1);
      fechaMovimiento = d.toISOString().split('T')[0];
    } else if (normLower.includes('el viernes pasado')) {
      const d = new Date(baseDate);
      const day = d.getDay();
      const diff = (day >= 5 ? day - 5 : day + 2) || 7;
      d.setDate(d.getDate() - diff);
      fechaMovimiento = d.toISOString().split('T')[0];
    }

    // 3. Currency detection
    let moneda = 'DEFAULT';
    if (/\b(dolares|dolar|usd|\$us)\b/i.test(normLower)) {
      moneda = 'USD';
    } else if (/\b(euros|euro|eur|€)\b/i.test(normLower)) {
      moneda = 'EUR';
    } else if (/\b(cop|pesos colombianos)\b/i.test(normLower)) {
      moneda = 'COP';
    } else if (/\b(pesos|mxn|clp)\b/i.test(normLower)) {
      moneda = 'COP';
    }

    // 4. Robust Amount detection (handles "15000", "15.000", "1.500.000", "20 mil", "4.50", "arriendo")
    let monto = 0;
    let necesitaConfirmacion = false;

    // Check textual millions: "1.5 millones", "un millon y medio", "un millon"
    if (/\bun millon y medio\b/i.test(normLower) || /\b1\.5 millones\b/i.test(normLower)) {
      monto = 1500000;
    } else if (/\bun millon\b/i.test(normLower)) {
      monto = 1000000;
    } else if (normLower.match(/(\d+(?:[.,]\d+)?)\s*millon(?:es)?/i)) {
      const match = normLower.match(/(\d+(?:[.,]\d+)?)\s*millon(?:es)?/i)!;
      monto = Math.round(parseFloat(match[1].replace(',', '.')) * 1000000);
    } else if (/\b\d{1,3}(?:\.\d{3}){2,}\b/.test(normLower)) {
      // e.g. "1.500.000" multi-thousands dot notation in COP
      const match = normLower.match(/\b\d{1,3}(?:\.\d{3}){2,}\b/)!;
      monto = parseFloat(match[0].replace(/\./g, ''));
    } else if (/\b(\d{1,3})\.(\d{3})\b/.test(normLower)) {
      // e.g. "15.000", "20.000", "25.000" in Latin America
      const match = normLower.match(/\b(\d{1,3})\.(\d{3})\b/)!;
      monto = parseInt(match[1], 10) * 1000 + parseInt(match[2], 10);
    } else if (/\b(\d{1,3}),(\d{3})\b/.test(normLower)) {
      // e.g. "15,000", "20,000"
      const match = normLower.match(/\b(\d{1,3}),(\d{3})\b/)!;
      monto = parseInt(match[1], 10) * 1000 + parseInt(match[2], 10);
    } else if (/\bmil doscientos\b/i.test(normLower)) {
      monto = 1200;
    } else if (/\bmil quinientos\b/i.test(normLower)) {
      monto = 1500;
    } else if (/\bquince mil\b/i.test(normLower)) {
      monto = 15000;
    } else if (/\bveinte mil\b/i.test(normLower)) {
      monto = 20000;
    } else if (/\bveinticinco mil\b/i.test(normLower)) {
      monto = 25000;
    } else if (/\btreinta mil\b/i.test(normLower)) {
      monto = 30000;
    } else if (/\bcincuenta mil\b/i.test(normLower)) {
      monto = 50000;
    } else if (/\bcien mil\b/i.test(normLower)) {
      monto = 100000;
    } else if (/\bdiez mil\b/i.test(normLower)) {
      monto = 10000;
    } else if (/(?:(\d+(?:[.,]\d+)?)\s*mil|\bmil\b)\s*(\d+)?/i.test(normLower)) {
      const match = normLower.match(/(?:(\d+(?:[.,]\d+)?)\s*mil|\bmil\b)\s*(\d+)?/i)!;
      const factor = match[1] ? parseFloat(match[1].replace(',', '.')) : 1;
      const remainder = match[2] ? parseFloat(match[2]) : 0;
      monto = Math.round(factor * 1000) + remainder;
    } else if (/\b\d{4,}\b/.test(normLower)) {
      // Literal integers with 4+ digits like "15000", "20000", "1500000"
      const match = normLower.match(/\b\d{4,}\b/)!;
      monto = parseInt(match[0], 10);
    } else if (/\b\d+(?:[.,]\d{1,2})\b/.test(normLower)) {
      // Standard small decimals like "4.50"
      const match = normLower.match(/\b\d+(?:[.,]\d{1,2})\b/)!;
      monto = parseFloat(match[0].replace(',', '.'));
    } else {
      const match = normLower.match(/\b\d+\b/);
      if (match) {
        monto = parseFloat(match[0]);
      }
    }

    if (monto <= 0 || isNaN(monto)) {
      monto = 0;
      necesitaConfirmacion = true;
    }

    // 5. Merchant extraction
    let comercio: string | null = null;
    const knownMerchants = [
      'Starbucks',
      'Oxxo',
      'Walmart',
      'Amazon',
      'Uber',
      'Didi',
      'Netflix',
      'Spotify',
      'McDonald\'s',
      'Burger King',
      'Apple',
      'Zara',
      'Chedraui',
      'Soriana',
      'Costco',
      'Farmacia Guadalajara',
      'Farmacias del Ahorro',
      'CFE',
      'Telmex',
      'Totalplay',
      'Empresa',
    ];

    for (const m of knownMerchants) {
      const reg = new RegExp(`\\b${m}\\b`, 'i');
      if (reg.test(text)) {
        comercio = m;
        break;
      }
    }

    // 6. Type & Category
    let tipo: 'gasto' | 'ingreso' | 'transferencia' = 'gasto';
    let categoria = 'Otros';

    const isIngreso = /\b(pagaron|quincena|sueldo|salario|ingreso|cobre|nomina|gane|venta|deposito)\b/i.test(normLower);
    const isTransfer = /\b(transferi|transferencia|traspase|traspaso|pase|envie a mi)\b/i.test(normLower);

    if (isTransfer) {
      tipo = 'transferencia';
      categoria = 'Transferencia';
    } else if (isIngreso) {
      tipo = 'ingreso';
      categoria = 'Ingresos';
    } else {
      tipo = 'gasto';
      if (/\b(cafe|botanas|comida|almuerzo|cena|desayuno|oxxo|starbucks|restaurante|super|supermercado|despensa)\b/i.test(normLower)) {
        categoria = 'Alimentos';
      } else if (/\b(uber|didi|gasolina|taxi|metro|camion|peaje|transporte)\b/i.test(normLower)) {
        categoria = 'Transporte';
      } else if (/\b(internet|luz|agua|gas|telefono|cfe|servicio|servicios)\b/i.test(normLower)) {
        categoria = 'Servicios';
      } else if (/\b(cine|pelicula|concierto|netflix|spotify|videojuego|salida)\b/i.test(normLower)) {
        categoria = 'Entretenimiento';
      } else if (/\b(renta|alquiler|arriendo|arriendos|casa|departamento|mantenimiento)\b/i.test(normLower)) {
        categoria = 'Vivienda';
      } else if (/\b(doctor|medicina|farmacia|consulta|dentista|hospital|salud)\b/i.test(normLower)) {
        categoria = 'Salud';
      } else if (/\b(curso|colegiatura|universidad|libro|escuela|educacion)\b/i.test(normLower)) {
        categoria = 'Educación';
      }
    }

    // 7. Clean description extraction
    let descripcion = cleanText;
    if (/\b(quincena|sueldo|salario|nomina)\b/i.test(normLower)) {
      descripcion = 'Pago de quincena';
    } else if (/\barriendo\b/i.test(normLower)) {
      descripcion = 'Pago de arriendo';
    } else if (/\binternet\b/i.test(normLower)) {
      descripcion = 'Pago de internet';
    } else if (/\btransporte\b/i.test(normLower)) {
      descripcion = 'Transporte';
    } else if (/\b(botanas|botana)\b/i.test(normLower)) {
      descripcion = 'Botanas';
    } else if (/\b(cafe)\b/i.test(normLower)) {
      descripcion = 'Café';
    } else {
      if (comercio) {
        descripcion = descripcion.replace(
          new RegExp(`(en\\s+el\\s+|en\\s+la\\s+|en\\s+|de\\s+la\\s+|de\\s+)${comercio}`, 'i'),
          ''
        );
      }
      descripcion = descripcion
        .replace(/^(ayer|anteayer|el viernes pasado|hoy)\s+/i, '')
        .replace(
          /^(gasté|gaste|pagué|pague|compré|compre|me compré un|me compré una|me compré|me compre|pagaron|me pagaron)\s+/i,
          ''
        )
        .replace(/[\d.,]+\s*(mil)?\s*(pesos|dólares|dolares|euros|usd|eur)?/gi, '')
        .replace(/(para\s+las|para\s+los|para\s+el|para\s+la|para)\s+/gi, '')
        .replace(/por\s+[\d.,]+/gi, '')
        .replace(/\bpor\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!descripcion || descripcion.length < 3) {
        if (comercio) {
          descripcion = `Compra en ${comercio}`;
        } else {
          descripcion = 'Movimiento registrado por voz';
        }
      }
    }

    // Capitalize first letter
    descripcion = descripcion.charAt(0).toUpperCase() + descripcion.slice(1);

    // 8. Accounts matching
    let cuentaOrigen: string | null = null;
    let cuentaDestino: string | null = null;

    if (accounts && accounts.length > 0) {
      for (const acc of accounts) {
        const accRegex = new RegExp(`\\b${acc.name}\\b`, 'i');
        if (accRegex.test(rawLower)) {
          if (!cuentaOrigen) {
            cuentaOrigen = acc.name;
          } else if (tipo === 'transferencia' && !cuentaDestino) {
            cuentaDestino = acc.name;
          }
        }
      }
    }

    return {
      tipo,
      monto,
      moneda,
      descripcion,
      comercio,
      categoria,
      fecha_movimiento: fechaMovimiento,
      cuenta_origen: cuentaOrigen,
      cuenta_destino: cuentaDestino,
      necesita_confirmacion: necesitaConfirmacion,
    };
  }

  /**
   * Map raw AI result to FinanApp database schema
   */
  private mapToFinanAppPayload(
    raw: VoiceTransactionResult,
    categories?: CategoryContext[],
    accounts?: AccountContext[],
    preferredCurrency: string = 'MXN'
  ): SuggestedTransactionPayload {
    const type: 'EXPENSE' | 'INCOME' | 'TRANSFER' =
      raw.tipo === 'ingreso'
        ? 'INCOME'
        : raw.tipo === 'transferencia'
        ? 'TRANSFER'
        : 'EXPENSE';

    // Match category by name or semantic similarity
    let matchedCat: CategoryContext | undefined;
    if (categories && categories.length > 0) {
      matchedCat = categories.find(
        (c) =>
          c.name.toLowerCase() === raw.categoria.toLowerCase() ||
          raw.categoria.toLowerCase().includes(c.name.toLowerCase()) ||
          c.name.toLowerCase().includes(raw.categoria.toLowerCase())
      );
      if (!matchedCat) {
        matchedCat = categories.find((c) => c.type === type);
      }
    }

    // Match accounts
    let originAcc: AccountContext | undefined;
    let destAcc: AccountContext | undefined;

    if (accounts && accounts.length > 0) {
      if (raw.cuenta_origen) {
        originAcc = accounts.find((a) =>
          a.name.toLowerCase().includes(raw.cuenta_origen!.toLowerCase())
        );
      }
      if (!originAcc) {
        originAcc = accounts.find((a) => a.isDefault) || accounts[0];
      }

      if (type === 'TRANSFER') {
        if (raw.cuenta_destino) {
          destAcc = accounts.find((a) =>
            a.name.toLowerCase().includes(raw.cuenta_destino!.toLowerCase())
          );
        }
        if (!destAcc) {
          destAcc = accounts.find((a) => a.id !== originAcc?.id);
        }
      }
    }

    const effectiveCurrency =
      raw.moneda !== 'DEFAULT'
        ? raw.moneda
        : originAcc?.currency || preferredCurrency;

    const notesParts: string[] = [];
    if (raw.comercio) {
      notesParts.push(`Comercio: ${raw.comercio}`);
    }
    notesParts.push('Registrado mediante Asistente de Voz IA');

    return {
      type,
      amount: raw.monto,
      description: raw.descripcion,
      categoryId: matchedCat?.id,
      categoryName: matchedCat?.name || raw.categoria,
      accountId: originAcc?.id,
      accountName: originAcc?.name,
      destinationAccountId: destAcc?.id,
      destinationAccountName: destAcc?.name,
      date: raw.fecha_movimiento,
      notes: notesParts.join(' • '),
      currency: effectiveCurrency,
      paymentMethod:
        type === 'TRANSFER'
          ? 'TRANSFER'
          : raw.comercio
          ? 'DEBIT_CARD'
          : 'CASH',
    };
  }
}

export const aiService = new AIService();
