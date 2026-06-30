import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  companyId: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getJwtSecret()) as TokenPayload;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return secret;
}
