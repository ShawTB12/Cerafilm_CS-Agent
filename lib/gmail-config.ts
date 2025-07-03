// Gmail API 設定
export const GMAIL_CONFIG = {
  // Google OAuth 2.0 設定
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Gmail API スコープ
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify'
  ],
  
  // API設定
  apiVersion: 'v1',
  maxResults: 100, // 一度に取得する最大メール数（50→100に増量）
  
  // NextAuth設定
  nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
  nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
} as const;

// 設定値の検証
export function validateGmailConfig() {
  const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXTAUTH_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
} 