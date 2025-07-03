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
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 認証後のリダイレクト先を適切に設定
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async jwt({ token, account }) {
      try {
        // Persist the OAuth access_token to the token right after signin
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
        }
        
        // Return previous token if the access token has not expired yet
        if (Date.now() < (token.expiresAt as number) * 1000) {
          return token;
        }
        
        // Access token has expired, try to update it
        return refreshAccessToken(token);
      } catch (error) {
        console.error('JWT callback error:', error);
        return { ...token, error: 'JWTError' };
      }
    },
    async session({ session, token }) {
      try {
        // Send properties to the client
        session.accessToken = token.accessToken as string;
        session.error = token.error as string;
        
        return session;
      } catch (error) {
        console.error('Session callback error:', error);
        return session;
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: GMAIL_CONFIG.nextAuthSecret,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * リフレッシュトークンを使用してアクセストークンを更新
 */
async function refreshAccessToken(token: any) {
  try {
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
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

// Session型の拡張
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
} 