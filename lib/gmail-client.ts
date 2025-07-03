import { google } from 'googleapis';
import { GMAIL_CONFIG } from './gmail-config';

export interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
      size: number;
    };
    parts?: Array<{
      headers: Array<{ name: string; value: string }>;
      body?: {
        data?: string;
        size: number;
      };
    }>;
  };
}

export interface EmailListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

export class GmailClient {
  private gmail: any;
  
  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret
    );
    
    auth.setCredentials({
      access_token: accessToken,
    });
    
    this.gmail = google.gmail({ version: GMAIL_CONFIG.apiVersion, auth });
  }
  
  /**
   * メール一覧を取得
   */
  async listMessages(query?: string, maxResults?: number, pageToken?: string): Promise<EmailListResponse> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults || GMAIL_CONFIG.maxResults,
        pageToken,
      });
      
      return response.data;
    } catch (error) {
      console.error('Error listing messages:', error);
      throw new Error('Failed to list messages');
    }
  }
  
  /**
   * 特定のメールを取得
   */
  async getMessage(messageId: string): Promise<EmailMessage> {
    try {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting message:', error);
      throw new Error('Failed to get message');
    }
  }
  
  /**
   * メールを送信
   */
  async sendMessage(to: string, subject: string, body: string, threadId?: string): Promise<any> {
    try {
      const raw = this.createRawMessage(to, subject, body, threadId);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw,
          threadId,
        },
      });
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }
  
  /**
   * メールの既読状態を変更
   */
  async markAsRead(messageId: string): Promise<void> {
    try {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new Error('Failed to mark message as read');
    }
  }
  
  /**
   * RAWメッセージの作成
   */
  private createRawMessage(to: string, subject: string, body: string, threadId?: string): string {
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ];
    
    if (threadId) {
      messageParts.splice(3, 0, `In-Reply-To: ${threadId}`);
    }
    
    const message = messageParts.join('\n');
    return Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  
  /**
   * ヘッダーから値を取得
   */
  static getHeaderValue(headers: Array<{ name: string; value: string }>, name: string): string {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  }
  
  /**
   * メール本文を抽出（改善版）
   */
  static extractEmailBody(message: EmailMessage): string {
    const { payload } = message;
    
    // 本文を抽出する再帰関数
    const extractBody = (part: any): { text: string; html: string } => {
      let result = { text: '', html: '' };
      
      if (part.mimeType === 'text/plain' && part.body?.data) {
        result.text = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        result.html = Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.parts) {
        // マルチパートの場合、各パートを再帰的に処理
        for (const subPart of part.parts) {
          const subResult = extractBody(subPart);
          if (subResult.text) result.text = subResult.text;
          if (subResult.html) result.html = subResult.html;
        }
      }
      
      return result;
    };
    
    // メッセージ全体から本文を抽出
    const bodyContent = extractBody(payload);
    
    // プレーンテキストを優先、なければHTMLからテキストを抽出
    if (bodyContent.text) {
      return bodyContent.text;
    } else if (bodyContent.html) {
      // HTMLタグを除去してテキストに変換
      return this.stripHtmlTags(bodyContent.html);
    }
    
    // どちらもない場合はスニペットを返す
    return message.snippet || '';
  }
  
  /**
   * HTMLタグを除去してプレーンテキストに変換
   */
  static stripHtmlTags(html: string): string {
    // 改行タグを改行文字に変換
    let text = html.replace(/<br\s*\/?>/gi, '\n')
                  .replace(/<\/p>/gi, '\n\n')
                  .replace(/<\/div>/gi, '\n');
    
    // HTMLタグを除去
    text = text.replace(/<[^>]*>/g, '');
    
    // HTMLエンティティをデコード
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/&amp;/g, '&');
    
    // 余分な空白行を整理
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n')
               .replace(/^\s+|\s+$/g, '');
    
    return text;
  }
} 