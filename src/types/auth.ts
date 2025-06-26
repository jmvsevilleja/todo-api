// Authentication and authorization types
export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role?: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthContext {
  user: AuthUser;
  token: string;
  permissions?: string[];
}

// Middleware types
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  token: string;
}
