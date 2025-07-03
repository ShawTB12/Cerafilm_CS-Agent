import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// エラーハンドリングを追加したハンドラー
const handler = NextAuth(authOptions);

// Next.js 15のApp Router形式でエクスポート
export const GET = handler;
export const POST = handler; 