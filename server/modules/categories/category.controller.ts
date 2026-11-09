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
    const userRole = req.user?.role;
    const dto = req.body as CreateCategoryDto;
    const category = await categoryService.create(userId, dto, userRole);

    res.status(201).json({
      success: true,
      message: dto.isDefault && userRole === 'ADMIN'
        ? 'Categoría predeterminada global creada exitosamente.'
        : 'Categoría creada exitosamente.',
      data: category,
    });
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const userRole = req.user?.role;
    const { id } = req.params;
    const dto = req.body as UpdateCategoryDto;
    const category = await categoryService.update(id, userId, dto, userRole);

    res.status(200).json({
      success: true,
      message: 'Categoría actualizada exitosamente.',
      data: category,
    });
  }

  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const userRole = req.user?.role;
    const { id } = req.params;
    const result = await categoryService.delete(id, userId, userRole);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  async restore(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await categoryService.restore(id, userId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  async getExcluded(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const excluded = await categoryService.getExcluded(userId);

    res.status(200).json({
      success: true,
      data: excluded,
    });
  }
}

export const categoryController = new CategoryController();
