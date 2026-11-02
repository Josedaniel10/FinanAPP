export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockUntil: number | null; // Timestamp until which account is locked
  createdAt: string;
  updatedAt: string;
}

export type UserWithoutPassword = Omit<User, 'passwordHash'>;

export interface AuthSessionResponse {
  user: UserWithoutPassword;
  token: string;
}
