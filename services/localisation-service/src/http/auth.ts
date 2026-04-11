import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const KEYCLOAK_URL = process.env.KEYCLOAK_ISSUER || 'http://localhost:9080/realms/fleet-management';
const JWKS_URI = `${KEYCLOAK_URL}/protocol/openid-connect/certs`;

const client = jwksClient({
  jwksUri: JWKS_URI,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err, null);
    } else {
      const signingKey = key?.getPublicKey();
      callback(null, signingKey);
    }
  });
}

export const checkAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) {
      console.error('JWT Verification Error:', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    (req as any).user = decoded;
    next();
  });
};

export const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRoles = user.realm_access?.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: `Forbidden: requires roles ${roles.join(' or ')}` });
    }

    next();
  };
};
