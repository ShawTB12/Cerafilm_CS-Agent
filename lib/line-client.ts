import { Client, Message, TextMessage, WebhookEvent, MessageEvent } from '@line/bot-sdk';
import { LINE_CONFIG, LineUser, LineMessage } from './line-config';

export class LineClient {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      channelAccessToken: LINE_CONFIG.channelAccessToken,
      channelSecret: LINE_CONFIG.channelSecret,
    });
  }
  
  /**
   * テキストメッセージを送信
   */
  async sendTextMessage(userId: string, text: string): Promise<any> {
    try {
      const message: TextMessage = {
        type: 'text',
        text: text,
      };
      
      const response = await this.client.pushMessage(userId, message);
      return response;
    } catch (error) {
      console.error('Error sending text message:', error);
      throw new Error('Failed to send text message');
    }
  }
  
  /**
   * 複数メッセージを送信
   */
  async sendMessages(userId: string, messages: Message[]): Promise<any> {
    try {
      const response = await this.client.pushMessage(userId, messages);
      return response;
    } catch (error) {
      console.error('Error sending messages:', error);
      throw new Error('Failed to send messages');
    }
  }
  
  /**
   * 返信メッセージを送信（replyTokenが必要）
   */
  async replyMessage(replyToken: string, messages: Message[]): Promise<any> {
    try {
      const response = await this.client.replyMessage(replyToken, messages);
      return response;
    } catch (error) {
      console.error('Error replying message:', error);
      throw new Error('Failed to reply message');
    }
  }
  
  /**
   * ユーザープロフィールを取得
   */
  async getUserProfile(userId: string): Promise<LineUser> {
    try {
      const profile = await this.client.getProfile(userId);
      return {
        userId: profile.userId,
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        statusMessage: profile.statusMessage,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to get user profile');
    }
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
    try {
      const response = await this.client.linkRichMenuToUser(userId, richMenuId);
      return response;
    } catch (error) {
      console.error('Error setting rich menu:', error);
      throw new Error('Failed to set rich menu');
    }
  }
  
  /**
   * グループ退出
   */
  async leaveGroup(groupId: string): Promise<any> {
    try {
      const response = await this.client.leaveGroup(groupId);
      return response;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw new Error('Failed to leave group');
    }
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