import { Role } from '@prisma/client';
import { Request } from 'express';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: Role;
};

export type AuthenticatedRequest = Request & {
  user: AuthenticatedUser;
};