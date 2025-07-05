// Gmail API 設定
export const GMAIL_CONFIG = {
  // Google OAuth 2.0 設定
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Gmail API + Calendar API スコープ
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
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
  
  // 設定値の形式チェック
  if (!GMAIL_CONFIG.clientId.includes('.googleusercontent.com')) {
    console.warn('GOOGLE_CLIENT_ID may not be valid format');
  }
  
  if (GMAIL_CONFIG.clientSecret.length < 24) {
    console.warn('GOOGLE_CLIENT_SECRET may be too short');
  }
  
  return true;
}

// ランタイムでの設定値の健全性チェック
export function checkGmailConfigHealth(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  try {
    validateGmailConfig();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  
  // 接続設定の検証
  if (!GMAIL_CONFIG.scopes.includes('https://www.googleapis.com/auth/gmail.readonly')) {
    warnings.push('Gmail readonly scope is missing');
  }
  
  if (!GMAIL_CONFIG.scopes.includes('https://www.googleapis.com/auth/gmail.send')) {
    warnings.push('Gmail send scope is missing');
  }
  
  // NextAuth設定の検証
  if (!GMAIL_CONFIG.nextAuthUrl.startsWith('http')) {
    warnings.push('NEXTAUTH_URL should start with http(s)');
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
  };
} 