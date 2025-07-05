import { google } from 'googleapis';
import { GMAIL_CONFIG } from './gmail-config';
import { isAuthError } from './auth';

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

export interface GmailClientOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export class GmailClient {
  private gmail: any;
  private auth: any;
  private accessToken: string;
  private maxRetries: number;
  private retryDelay: number;
  
  constructor(accessToken: string, options: GmailClientOptions = {}) {
    this.accessToken = accessToken;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.auth = new google.auth.OAuth2(
      GMAIL_CONFIG.clientId,
      GMAIL_CONFIG.clientSecret
    );
    
    this.auth.setCredentials({
      access_token: accessToken,
    });
    
    this.gmail = google.gmail({ version: GMAIL_CONFIG.apiVersion, auth: this.auth });
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
        if (isAuthError(error)) {
          throw new Error(`Authentication failed: ${error?.message || error}`);
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
   * アクセストークンを更新
   */
  updateAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
    this.auth.setCredentials({
      access_token: accessToken,
    });
  }
  
  /**
   * 接続テスト
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.executeWithRetry(async () => {
        const response = await this.gmail.users.getProfile({ userId: 'me' });
        return response.data;
      }, 'Connection test');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
  
  /**
   * メール一覧を取得
   */
  async listMessages(query?: string, maxResults?: number, pageToken?: string): Promise<EmailListResponse> {
    return this.executeWithRetry(async () => {
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: maxResults || GMAIL_CONFIG.maxResults,
        pageToken,
      });
      
      return response.data;
    }, 'List messages');
  }
  
  /**
   * 特定のメールを取得
   */
  async getMessage(messageId: string): Promise<EmailMessage> {
    return this.executeWithRetry(async () => {
      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });
      
      return response.data;
    }, `Get message ${messageId}`);
  }
  
  /**
   * メールを送信
   */
  async sendMessage(to: string, subject: string, body: string, threadId?: string): Promise<any> {
    return this.executeWithRetry(async () => {
      const raw = this.createRawMessage(to, subject, body, threadId);
      
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw,
          threadId,
        },
      });
      
      return response.data;
    }, 'Send message');
  }
  
  /**
   * メールの既読状態を変更
   */
  async markAsRead(messageId: string): Promise<void> {
    await this.executeWithRetry(async () => {
      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD'],
        },
      });
    }, `Mark message ${messageId} as read`);
  }
  
  /**
   * バッチでメッセージを取得（効率化）
   */
  async getMessagesBatch(messageIds: string[]): Promise<EmailMessage[]> {
    return this.executeWithRetry(async () => {
      const promises = messageIds.map(id => this.getMessage(id));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<EmailMessage> => result.status === 'fulfilled')
        .map(result => result.value);
    }, 'Get messages batch');
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
                  .replace(/<\/p>/gi, '\n')
                  .replace(/<p[^>]*>/gi, '')
                  .replace(/<\/div>/gi, '\n')
                  .replace(/<div[^>]*>/gi, '');
    
    // 他のHTMLタグを除去
    text = text.replace(/<[^>]*>/g, '');
    
    // HTMLエンティティをデコード
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&amp;/g, '&')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'");
    
    // 余分な空白と改行を整理
    text = text.replace(/\n\s*\n/g, '\n\n')
               .replace(/[ \t]+/g, ' ')
               .trim();
    
    return text;
  }
} 