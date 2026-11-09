import { AppError } from '../../errors/app-error.js';
import { categoryRepository, CategoryRepository } from './category.repository.js';
import { CreateCategoryDto, UpdateCategoryDto } from './category.schema.js';
import { Category } from './category.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { BudgetModel } from '../budgets/budget.model.js';

export class CategoryService {
  constructor(private readonly repo: CategoryRepository = categoryRepository) {}

  async findAll(userId: string): Promise<Category[]> {
    return this.repo.findAllForUser(userId);
  }

  async findById(id: string, userId: string): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new AppError(404, 'Categoría no encontrada.');
    }

    // Must be a system category or belong to this user
    if (category.userId !== null && category.userId !== userId) {
      throw new AppError(404, 'Categoría no encontrada o no autorizada.');
    }

    return category;
  }

  async create(
    userId: string,
    dto: CreateCategoryDto,
    userRole?: string
  ): Promise<Category> {
    const isTargetDefault = Boolean(dto.isDefault && userRole === 'ADMIN');
    const targetUserId = isTargetDefault ? null : userId;

    const existingDuplicate = await this.repo.findByNameAndType(
      targetUserId || userId,
      dto.name,
      dto.type
    );

    if (existingDuplicate) {
      const typeLabel = dto.type === 'INCOME' ? 'Ingreso' : 'Gasto';
      throw new AppError(
        409,
        `Ya existe una categoría llamada "${dto.name.trim()}" registrada como ${typeLabel}.`
      );
    }

    return this.repo.create({
      userId: targetUserId,
      name: dto.name.trim(),
      type: dto.type,
      icon: dto.icon || 'Tag',
      color: dto.color || '#059669',
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCategoryDto,
    userRole?: string
  ): Promise<Category> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(404, 'Categoría no encontrada.');
    }

    const isAdmin = userRole === 'ADMIN';

    if (existing.userId === null) {
      if (!isAdmin) {
        throw new AppError(
          403,
          'Las categorías predefinidas del sistema solo pueden ser modificadas por el Administrador.'
        );
      }
    } else if (existing.userId !== userId && !isAdmin) {
      throw new AppError(404, 'Categoría no encontrada o no autorizada.');
    }

    const targetName = dto.name !== undefined ? dto.name.trim() : existing.name;
    const targetType = dto.type !== undefined ? dto.type : existing.type;

    if (targetName !== existing.name || targetType !== existing.type) {
      const duplicate = await this.repo.findByNameAndType(
        existing.userId || userId,
        targetName,
        targetType,
        id
      );
      if (duplicate) {
        const typeLabel = targetType === 'INCOME' ? 'Ingreso' : 'Gasto';
        throw new AppError(
          409,
          `Ya existe otra categoría llamada "${targetName}" registrada como ${typeLabel}.`
        );
      }
    }

    const updated = await this.repo.update(id, dto);
    if (!updated) {
      throw new AppError(500, 'Error al actualizar la categoría.');
    }

    return updated;
  }

  async delete(
    id: string,
    userId: string,
    userRole?: string
  ): Promise<{ message: string }> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(404, 'Categoría no encontrada.');
    }

    const isAdmin = userRole === 'ADMIN';

    if (existing.userId === null) {
      // System default category
      if (isAdmin) {
        // Global deletion by administrator for all users
        const txCount = await TransactionModel.countDocuments({ categoryId: id });
        if (txCount > 0) {
          throw new AppError(
            400,
            `No se puede eliminar la categoría predeterminada "${existing.name}" porque tiene ${txCount} movimiento(s) asociado(s) en el sistema. Reasigna los movimientos primero.`
          );
        }

        const budgetCount = await BudgetModel.countDocuments({ categoryId: id });
        if (budgetCount > 0) {
          throw new AppError(
            400,
            `No se puede eliminar la categoría predeterminada "${existing.name}" porque tiene ${budgetCount} presupuesto(s) activo(s) en el sistema.`
          );
        }

        await this.repo.delete(id);
        return {
          message: `Categoría predeterminada "${existing.name}" eliminada globalmente para todos los usuarios.`,
        };
      } else {
        // Normal user deleting default category for themselves
        const userTxCount = await TransactionModel.countDocuments({
          userId,
          categoryId: id,
        });
        if (userTxCount > 0) {
          throw new AppError(
            400,
            `No puedes eliminar la categoría "${existing.name}" de tu lista porque tienes ${userTxCount} movimiento(s) registrado(s) con ella. Reasígnalos primero.`
          );
        }

        const userBudgetCount = await BudgetModel.countDocuments({
          userId,
          categoryId: id,
        });
        if (userBudgetCount > 0) {
          throw new AppError(
            400,
            `No puedes eliminar la categoría "${existing.name}" de tu lista porque tienes un presupuesto activo asociado.`
          );
        }

        await this.repo.excludeCategoryForUser(userId, id);
        return {
          message: `Categoría predeterminada "${existing.name}" eliminada de tu cuenta personal.`,
        };
      }
    }

    // Custom user category
    if (existing.userId !== userId && !isAdmin) {
      throw new AppError(404, 'Categoría no encontrada o no autorizada.');
    }

    // Check if category is in use by transactions
    const txCount = await TransactionModel.countDocuments({ categoryId: id });
    if (txCount > 0) {
      throw new AppError(
        400,
        `No se puede eliminar la categoría "${existing.name}" porque tiene ${txCount} movimiento(s) asociado(s). Reasigna o elimina los movimientos primero.`
      );
    }

    // Check if category is in use by budgets
    const budgetCount = await BudgetModel.countDocuments({ categoryId: id });
    if (budgetCount > 0) {
      throw new AppError(
        400,
        `No se puede eliminar la categoría "${existing.name}" porque tiene ${budgetCount} presupuesto(s) activo(s). Reasigna o elimina los presupuestos primero.`
      );
    }

    await this.repo.delete(id);
    return {
      message: `Categoría "${existing.name}" eliminada correctamente.`,
    };
  }

  async restore(id: string, userId: string): Promise<{ message: string }> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(404, 'Categoría no encontrada.');
    }
    await this.repo.restoreCategoryForUser(userId, id);
    return {
      message: `Categoría predeterminada "${existing.name}" restaurada en tu cuenta personal.`,
    };
  }

  async getExcluded(userId: string): Promise<Category[]> {
    return this.repo.getExcludedCategoriesForUser(userId);
  }
}

export const categoryService = new CategoryService();
