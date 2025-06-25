import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';
import { config } from '../config';

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(
    payload, 
    config.jwt.secret, 
    { 
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience
    }
  );
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret, {
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  }) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};

// Utility function to extract token from Authorization header
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};