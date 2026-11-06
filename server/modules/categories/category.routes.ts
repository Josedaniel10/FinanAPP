import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { authenticateToken } from '../../middlewares/auth.middleware.js';
import { validateBody } from '../../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from './category.schema.js';

const router = Router();

// All category routes require valid JWT token
router.use(authenticateToken);

router.get('/', (req, res, next) => {
  categoryController.getAll(req, res).catch(next);
});

router.post('/', validateBody(createCategorySchema), (req, res, next) => {
  categoryController.create(req, res).catch(next);
});

router.get('/:id', (req, res, next) => {
  categoryController.getById(req, res).catch(next);
});

router.put('/:id', validateBody(updateCategorySchema), (req, res, next) => {
  categoryController.update(req, res).catch(next);
});

router.delete('/:id', (req, res, next) => {
  categoryController.delete(req, res).catch(next);
});

export default router;
