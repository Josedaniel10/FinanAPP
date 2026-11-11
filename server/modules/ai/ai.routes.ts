import { Router } from 'express';
import { aiController } from './ai.controller.js';

const router = Router();

router.post('/voice-transaction', aiController.processVoice);
router.get('/context', aiController.getContextInfo);

export default router;
