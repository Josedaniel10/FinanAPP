export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  failedLoginAttempts: number;
  lockUntil: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  data: {
    user: User;
    token: string;
  };
  message?: string;
}

export interface UserResponse {
  data: {
    user: User;
  };
}

export interface LockInfo {
  isLocked: boolean;
  minutesRemaining: number;
  lockUntil: number | null;
}
