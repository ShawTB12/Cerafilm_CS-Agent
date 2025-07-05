import { Client, Message, TextMessage, WebhookEvent, MessageEvent } from '@line/bot-sdk';
import { LINE_CONFIG, LineUser, LineMessage } from './line-config';

export interface LineClientOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export class LineClient {
  private client: Client;
  private maxRetries: number;
  private retryDelay: number;
  
  constructor(options: LineClientOptions = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.client = new Client({
      channelAccessToken: LINE_CONFIG.channelAccessToken,
      channelSecret: LINE_CONFIG.channelSecret,
    });
  }

  /**
   * APIリクエストを実行（リトライ機能付き）
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await operation();
        if (attempt > 1) {
          console.log(`${operationName} succeeded on attempt ${attempt}`);
        }
        return result;
      } catch (error: any) {
        lastError = error;
        
        console.error(`${operationName} failed on attempt ${attempt}:`, error?.message || error);
        
        // 認証エラーの場合は即座に失敗
        if (this.isAuthError(error)) {
          throw new Error(`LINE API Authentication failed: ${error?.message || error}`);
        }
        
        // 最後の試行でない場合はリトライ
        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1); // 指数バックオフ
          console.log(`Retrying ${operationName} in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`${operationName} failed after ${this.maxRetries} attempts: ${lastError?.message || lastError}`);
  }

  /**
   * 遅延処理
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 認証エラーかどうかを判定
   */
  private isAuthError(error: any): boolean {
    if (!error) return false;
    
    const errorMessages = [
      'invalid_token',
      'unauthorized',
      'authentication failed',
      'invalid access token',
      'channel access token',
    ];
    
    const errorString = error.toString().toLowerCase();
    return errorMessages.some(msg => errorString.includes(msg));
  }

  /**
   * LINE API接続テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      // BOT情報を取得して接続テスト
      await this.executeWithRetry(async () => {
        const response = await fetch('https://api.line.me/v2/bot/info', {
          headers: {
            'Authorization': `Bearer ${LINE_CONFIG.channelAccessToken}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      }, 'Connection test');
      
      return true;
    } catch (error) {
      console.error('LINE API connection test failed:', error);
      return false;
    }
  }

  /**
   * アクセストークンの有効性を検証
   */
  async validateAccessToken(): Promise<boolean> {
    try {
      const response = await fetch('https://api.line.me/v2/oauth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LINE_CONFIG.channelAccessToken}`,
        },
      });
      
      return response.ok;
    } catch (error) {
      console.error('LINE access token validation failed:', error);
      return false;
    }
  }
  
  /**
   * テキストメッセージを送信
   */
  async sendTextMessage(userId: string, text: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const message: TextMessage = {
        type: 'text',
        text: text,
      };
      
      const response = await this.client.pushMessage(userId, message);
      return response;
    }, 'Send text message');
  }
  
  /**
   * 複数メッセージを送信
   */
  async sendMessages(userId: string, messages: Message[]): Promise<any> {
    return this.executeWithRetry(async () => {
      const response = await this.client.pushMessage(userId, messages);
      return response;
    }, 'Send messages');
  }
  
  /**
   * 返信メッセージを送信（replyTokenが必要）
   */
  async replyMessage(replyToken: string, messages: Message[]): Promise<any> {
    return this.executeWithRetry(async () => {
      const response = await this.client.replyMessage(replyToken, messages);
      return response;
    }, 'Reply message');
  }
  
  /**
   * ユーザープロフィールを取得
   */
  async getUserProfile(userId: string): Promise<LineUser> {
    return this.executeWithRetry(async () => {
      const profile = await this.client.getProfile(userId);
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
      };
    }, 'Get user profile');
  }
  
  /**
   * Webhookイベントの検証
   */
  static validateSignature(body: string, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('SHA256', LINE_CONFIG.channelSecret)
        .update(body, 'utf8')
        .digest('base64');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error validating signature:', error);
      return false;
    }
  }
  
  /**
   * Webhookイベントを処理
   */
  static async processWebhookEvent(event: WebhookEvent): Promise<LineMessage | null> {
    try {
      if (event.type === 'message' && event.message.type === 'text') {
        const messageEvent = event as MessageEvent;
        
        return {
          id: messageEvent.message.id,
          type: 'text',
          text: (messageEvent.message as any).text,
          timestamp: new Date(messageEvent.timestamp),
          source: {
            userId: messageEvent.source.userId || '',
            type: messageEvent.source.type,
          },
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error processing webhook event:', error);
      return null;
    }
  }
  
  /**
   * メッセージの既読確認
   */
  async markAsRead(userId: string): Promise<void> {
    try {
      // LINEでは明示的な既読機能はないため、ログのみ
      console.log(`Message marked as read for user: ${userId}`);
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }
  
  /**
   * リッチメニューの設定
   */
  async setRichMenu(userId: string, richMenuId: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const response = await this.client.linkRichMenuToUser(userId, richMenuId);
      return response;
    }, 'Set rich menu');
  }
  
  /**
   * グループ退出
   */
  async leaveGroup(groupId: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const response = await this.client.leaveGroup(groupId);
      return response;
    }, 'Leave group');
  }
  
  /**
   * テンプレートメッセージの作成
   */
  static createQuickReplyMessage(text: string, quickReplies: string[]): Message {
    const quickReplyItems = quickReplies.map(reply => ({
      type: 'action' as const,
      action: {
        type: 'message' as const,
        label: reply,
        text: reply,
      },
    }));
    
    return {
      type: 'text',
      text: text,
      quickReply: {
        items: quickReplyItems,
      },
    };
  }
  
  /**
   * スタンプメッセージの作成
   */
  static createStickerMessage(packageId: string, stickerId: string): Message {
    return {
      type: 'sticker',
      packageId: packageId,
      stickerId: stickerId,
    };
  }
} 