import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// エラーハンドリングを追加したハンドラー
const handler = NextAuth(authOptions);

// リクエストをラップしてエラーログを追加
const wrappedHandler = async (req: Request, context: any) => {
  try {
    console.log('NextAuth API called:', req.method, req.url);
    return await handler(req, context);
  } catch (error) {
    console.error('NextAuth handler error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Next.js 15のApp Router形式でエクスポート
export const GET = wrappedHandler;
export const POST = wrappedHandler; 