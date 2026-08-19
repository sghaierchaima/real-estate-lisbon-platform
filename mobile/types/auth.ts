export type UserRole =
  | "ADMIN"
  | "BUYER"
  | "PROFESSIONAL";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  avatarUrl: string | null;
};