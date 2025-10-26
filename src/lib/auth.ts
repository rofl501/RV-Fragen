import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Ensure JWT_SECRET is set - fail fast if not configured
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable is required and must be at least 32 characters long!');
}
const JWT_SECRET: string = process.env.JWT_SECRET;

if (!process.env.ADMIN_USERNAME) {
  throw new Error('ADMIN_USERNAME environment variable is required!');
}
const ADMIN_USERNAME: string = process.env.ADMIN_USERNAME;

// Decode password hash from Base64 (to avoid $ character issues in .env)
const ADMIN_PASSWORD_HASH_BASE64 = process.env.ADMIN_PASSWORD_HASH_BASE64 || '';
const ADMIN_PASSWORD_HASH = ADMIN_PASSWORD_HASH_BASE64 
  ? Buffer.from(ADMIN_PASSWORD_HASH_BASE64, 'base64').toString('utf-8')
  : '';

export interface AdminToken {
  username: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

/**
 * Verify admin credentials
 */
export async function verifyAdmin(username: string, password: string): Promise<boolean> {
  if (username !== ADMIN_USERNAME) {
    return false;
  }
  
  // If no hash is set, reject (security)
  if (!ADMIN_PASSWORD_HASH || ADMIN_PASSWORD_HASH.length < 10) {
    console.error('Admin password hash not configured!');
    return false;
  }
  
  try {
    const result = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    return result;
  } catch (error) {
    console.error('Error verifying admin password:', error);
    return false;
  }
}

/**
 * Generate JWT token for admin
 */
export function generateAdminToken(username: string): string {
  return jwt.sign(
    { username, isAdmin: true },
    JWT_SECRET,
    { expiresIn: '7d' } // 7 days validity
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): AdminToken | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (typeof decoded === 'object' && decoded !== null && 'isAdmin' in decoded) {
      const adminToken = decoded as AdminToken;
      return adminToken.isAdmin ? adminToken : null;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Hash password (for initial setup)
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

