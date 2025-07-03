// LINE Messaging API 設定
export const LINE_CONFIG = {
  // LINE Bot 設定
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
  
  // Webhook設定
  webhookUrl: process.env.LINE_WEBHOOK_URL || 'http://localhost:3000/api/line/webhook',
  
  // API設定
  apiVersion: 'v2',
  maxMessages: 100, // 一度に取得する最大メッセージ数
  
  // アプリ設定
  appName: 'Cerafilm CS LINE Bot',
} as const;

// 設定値の検証
export function validateLineConfig() {
  const requiredVars = ['LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// メッセージタイプの定義
export type LineMessageType = 'text' | 'image' | 'audio' | 'video' | 'file' | 'location' | 'sticker';

// ユーザー情報の型定義
export interface LineUser {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

// メッセージの型定義
export interface LineMessage {
  id: string;
  type: LineMessageType;
  text?: string;
  timestamp: Date;
  source: {
    userId: string;
    type: 'user' | 'group' | 'room';
  };
} 