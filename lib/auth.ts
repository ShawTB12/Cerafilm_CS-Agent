import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { GMAIL_CONFIG } from './gmail-config';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GMAIL_CONFIG.clientId,
      clientSecret: GMAIL_CONFIG.clientSecret,
      authorization: {
        params: {
          scope: [
            'openid',
            'email', 
            'profile',
            ...GMAIL_CONFIG.scopes
          ].join(' '),
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 認証後のリダイレクト先を適切に設定
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account, trigger }) {
      try {
        // アカウント情報の初期設定
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
          token.tokenType = account.token_type;
          token.scope = account.scope;
          console.log('New tokens stored:', { 
            hasAccessToken: !!token.accessToken,
            hasRefreshToken: !!token.refreshToken,
            expiresAt: token.expiresAt 
          });
        }
        
        // 手動更新トリガー
        if (trigger === 'update') {
          return refreshAccessToken(token);
        }
        
        // トークンの有効期限チェック（5分のマージンを設ける）
        const now = Math.floor(Date.now() / 1000);
        const expiryTime = (token.expiresAt as number) - 300; // 5分前
        
        if (now < expiryTime) {
          return token;
        }
        
        // アクセストークンの期限が切れている場合は更新
        console.log('Token expired, attempting refresh');
        return await refreshAccessToken(token);
      } catch (error) {
        console.error('JWT callback error:', error);
        return { ...token, error: 'JWTError' };
      }
    },
    async session({ session, token }) {
      try {
        // エラーがある場合は認証失敗とする
        if (token.error) {
          console.error('Session error:', token.error);
          return {
            ...session,
            error: token.error,
            accessToken: undefined,
          };
        }
        
        // プロパティをクライアントに送信
        session.accessToken = token.accessToken as string;
        session.refreshToken = token.refreshToken as string;
        session.expiresAt = token.expiresAt as number;
        session.error = token.error as string;
        
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return {
          ...session,
          error: 'SessionError',
        };
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: GMAIL_CONFIG.nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
  events: {
    async signOut({ session, token }) {
      // サインアウト時のクリーンアップ
      console.log('User signed out');
    },
    async session({ session, token }) {
      // セッション作成時のログ
      if (process.env.NODE_ENV === 'development') {
        console.log('Session created:', { 
          hasAccessToken: !!session.accessToken,
          expires: session.expires 
        });
      }
    },
  },
};

/**
 * リフレッシュトークンを使用してアクセストークンを更新（改善版）
 */
async function refreshAccessToken(token: any) {
  try {
    console.log('Refreshing access token');
    
    if (!token.refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const url = 'https://oauth2.googleapis.com/token';
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
      body: new URLSearchParams({
        client_id: GMAIL_CONFIG.clientId,
        client_secret: GMAIL_CONFIG.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('Token refresh failed:', refreshedTokens);
      throw new Error(`Token refresh failed: ${refreshedTokens.error_description || refreshedTokens.error}`);
    }

    console.log('Token refreshed successfully');
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      tokenType: refreshedTokens.token_type || token.tokenType,
      error: undefined, // エラーをクリア
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

/**
 * トークンの有効性を検証
 */
export async function validateToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`);
    return response.ok;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * 認証エラーかどうかを判定
 */
export function isAuthError(error: any): boolean {
  if (!error) return false;
  
  const errorMessages = [
    'invalid_token',
    'invalid_grant',
    'unauthorized',
    'authentication required',
    'token expired',
    'RefreshAccessTokenError',
    'JWTError',
    'SessionError'
  ];
  
  const errorString = error.toString().toLowerCase();
  return errorMessages.some(msg => errorString.includes(msg));
}

// Session型の拡張
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
    error?: string;
  }
} 