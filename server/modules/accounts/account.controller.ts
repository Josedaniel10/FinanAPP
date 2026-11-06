import { Response } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware.js';
import { accountService } from './account.service.js';

export class AccountController {
  async getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const accounts = await accountService.getUserAccounts(req.user!.id);
    res.json({ success: true, data: accounts });
  }

  async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const account = await accountService.createAccount(req.user!.id, req.body);
    res.status(201).json({ success: true, data: account });
  }

  async updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const account = await accountService.updateAccount(
      req.user!.id,
      req.params.id,
      req.body
    );
    res.json({ success: true, data: account });
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    await accountService.deleteAccount(req.user!.id, req.params.id);
    res.json({ success: true, message: 'Cuenta eliminada exitosamente.' });
  }
}

export const accountController = new AccountController();
