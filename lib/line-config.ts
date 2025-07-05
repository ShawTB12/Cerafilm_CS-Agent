// LINE Bot API 設定
export const LINE_CONFIG = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'development_test_token',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'development_test_secret',
  
  // API エンドポイント
  apiEndpoint: 'https://api.line.me/v2/bot',
  
  // Webhook設定
  webhookUrl: process.env.LINE_WEBHOOK_URL || 'https://your-domain.com/api/line/webhook',
  
  // メッセージ制限
  maxMessageLength: 5000,
  maxQuickReplyItems: 13,
  
  // 自動応答設定
  autoReplyEnabled: process.env.LINE_AUTO_REPLY_ENABLED === 'true',
  autoReplyDelay: 1000, // 1秒
} as const;

// 型定義
export interface LineUser {
  userId: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LineMessage {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'file' | 'location' | 'sticker';
  text?: string;
  timestamp: Date;
  source: {
    userId: string;
    type: string;
  };
}

// 設定値の検証
export function validateLineConfig() {
  const requiredVars = ['LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // 開発環境での特別な処理
  if (process.env.NODE_ENV === 'development' && 
      LINE_CONFIG.channelAccessToken === 'development_test_token') {
    console.warn('Using development test token for LINE API');
    return true;
  }
  
  // 設定値の形式チェック
  if (!LINE_CONFIG.channelAccessToken.startsWith('Bearer ') && 
      LINE_CONFIG.channelAccessToken.length < 50) {
    console.warn('LINE_CHANNEL_ACCESS_TOKEN may not be valid format');
  }
  
  if (LINE_CONFIG.channelSecret.length < 32) {
    console.warn('LINE_CHANNEL_SECRET may be too short');
  }
  
  return true;
}

// ランタイムでの設定値の健全性チェック
export function checkLineConfigHealth(): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  isDevelopment: boolean;
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  try {
    validateLineConfig();
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  
  // 開発環境での追加チェック
  if (isDevelopment && LINE_CONFIG.channelAccessToken === 'development_test_token') {
    warnings.push('Using development test token - API calls will be simulated');
  }
  
  // プロダクション環境での追加チェック
  if (!isDevelopment) {
    if (LINE_CONFIG.channelAccessToken.includes('test') || 
        LINE_CONFIG.channelAccessToken.includes('dev')) {
      warnings.push('Channel access token appears to be for testing');
    }
  }
  
  return {
    isValid: errors.length === 0,
    warnings,
    errors,
    isDevelopment,
  };
} 