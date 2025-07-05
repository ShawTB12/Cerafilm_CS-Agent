// Google Calendar API 設定
export const CALENDAR_CONFIG = {
  // Google OAuth 2.0 設定（Gmailと共通）
  clientId: process.env.GOOGLE_CLIENT_ID || '',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  
  // Calendar API スコープ
  scopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ],
  
  // API設定
  apiVersion: 'v3',
  timeZone: 'Asia/Tokyo',
  maxResults: 250, // 一度に取得する最大イベント数
  
  // カレンダー設定
  primaryCalendarId: 'primary', // プライマリカレンダー
  
  // 電話予約専用カレンダー設定
  callCalendarName: 'Cerafilm CS 電話予約',
  callEventColor: '7', // カレンダーの色（青色）
} as const;

// 設定値の検証
export function validateCalendarConfig() {
  const requiredVars = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
}

// カレンダーイベントの種類
export enum EventType {
  CALL_RESERVATION = 'call_reservation',
  GENERAL = 'general'
}

// 電話予約の優先度
export enum CallPriority {
  HIGH = '高',
  MEDIUM = '中',
  LOW = '低'
}

// 電話予約の状態
export enum CallStatus {
  SCHEDULED = '予約済み',
  COMPLETED = '完了',
  CANCELLED = 'キャンセル',
  NO_SHOW = '連絡なし'
} 