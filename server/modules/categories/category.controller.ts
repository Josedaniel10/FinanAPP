import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { categoryService } from './category.service.js';
import { CreateCategoryDto, UpdateCategoryDto } from './category.schema.js';

export class CategoryController {
  async getAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const categories = await categoryService.findAll(userId);

    res.status(200).json({
      success: true,
      data: categories,
    });
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const category = await categoryService.findById(id, userId);

    res.status(200).json({
      success: true,
      data: category,
    });
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const dto = req.body as CreateCategoryDto;
    const category = await categoryService.create(userId, dto);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente.',
      data: category,
    });
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const dto = req.body as UpdateCategoryDto;
    const category = await categoryService.update(id, userId, dto);

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente.',
      data: category,
    });
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    await categoryService.delete(id, userId);

    res.status(200).json({
      success: true,
      message: 'Categoría eliminada exitosamente.',
    });
  }
}

export const categoryController = new CategoryController();
