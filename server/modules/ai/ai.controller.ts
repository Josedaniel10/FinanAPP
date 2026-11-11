import { Request, Response, NextFunction } from 'express';
import { aiService, formatContextDateSpanish } from './ai.service.js';

export const aiController = {
  async processVoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { text, audioData, mimeType, categories, accounts, preferredCurrency, customDate } =
        req.body;

      if ((!text || typeof text !== 'string' || !text.trim()) && !audioData) {
        res.status(400).json({
          success: false,
          error: 'Por favor proporciona una grabación de audio o texto para procesar.',
        });
        return;
      }

      const result = await aiService.processVoiceInput({
        text,
        audioData,
        mimeType,
        categories,
        accounts,
        preferredCurrency,
        customDate,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (err: any) {
      console.error('Error en aiController.processVoice:', err.message || err);
      res.status(400).json({
        success: false,
        error: err.message || 'No se pudo procesar la instrucción de voz.',
      });
    }
  },

  async getContextInfo(_req: Request, res: Response): Promise<void> {
    const { formatted, iso } = formatContextDateSpanish();
    res.json({
      success: true,
      data: {
        currentDateFormatted: formatted,
        isoDate: iso,
        supportedCategories: [
          'Alimentos',
          'Transporte',
          'Vivienda',
          'Entretenimiento',
          'Servicios',
          'Salud',
          'Educación',
          'Ingresos',
          'Transferencia',
          'Otros',
        ],
      },
    });
  },
};
