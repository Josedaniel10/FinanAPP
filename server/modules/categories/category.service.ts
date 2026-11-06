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

  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const existingDuplicate = await this.repo.findByNameAndType(
      userId,
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
      userId,
      name: dto.name.trim(),
      type: dto.type,
      icon: dto.icon || 'Tag',
      color: dto.color || '#059669',
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCategoryDto
  ): Promise<Category> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(404, 'Categoría no encontrada.');
    }

    if (existing.userId === null) {
      throw new AppError(
        403,
        'Las categorías predefinidas del sistema no pueden modificarse.'
      );
    }

    if (existing.userId !== userId) {
      throw new AppError(404, 'Categoría no encontrada o no autorizada.');
    }

    const targetName = dto.name !== undefined ? dto.name.trim() : existing.name;
    const targetType = dto.type !== undefined ? dto.type : existing.type;

    if (targetName !== existing.name || targetType !== existing.type) {
      const duplicate = await this.repo.findByNameAndType(
        userId,
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

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new AppError(404, 'Categoría no encontrada.');
    }

    if (existing.userId === null) {
      throw new AppError(
        403,
        'Las categorías predefinidas del sistema están protegidas y no pueden eliminarse.'
      );
    }

    if (existing.userId !== userId) {
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
  }
}

export const categoryService = new CategoryService();
