import { NextRequest, NextResponse } from 'next/server';
import { LineClient } from '@/lib/line-client';
import { promises as fs } from 'fs';
import path from 'path';

// ファイルベースの永続化メッセージストレージ
const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

// メッセージをファイルから読み込み
async function loadMessages(): Promise<any[]> {
  try {
    // データディレクトリが存在しない場合は作成
    const dataDir = path.dirname(MESSAGES_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }

    // ファイルが存在しない場合は空配列を返す
    try {
      const data = await fs.readFile(MESSAGES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
}

// メッセージをファイルに保存
async function saveMessages(messages: any[]): Promise<void> {
  try {
    const dataDir = path.dirname(MESSAGES_FILE);
    try {
      await fs.access(dataDir);
    } catch {
      await fs.mkdir(dataDir, { recursive: true });
    }
    
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Error saving messages:', error);
  }
}

// メッセージ送信エンドポイント
export async function POST(request: NextRequest) {
  try {
    const { userId, text, messages } = await request.json();

    // バリデーション
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    if (!text && !messages) {
      return NextResponse.json(
        { error: 'Either text or messages is required' },
        { status: 400 }
      );
    }

    // 既存メッセージを読み込み
    const messageStore = await loadMessages();
    const lineClient = new LineClient();
    
    try {
      let result;
      if (text) {
        // テキストメッセージ送信
        result = await lineClient.sendTextMessage(userId, text);
        
        // 送信されたメッセージをストレージに追加
        const newMessage = {
          id: Date.now().toString(),
          userId,
          displayName: 'Cerafilm CS Staff',
          text,
          timestamp: new Date().toISOString(),
          type: 'bot',
          status: '送信済み',
          priority: '中',
        };
        messageStore.push(newMessage);
        
      } else if (messages) {
        // 複数メッセージ送信
        result = await lineClient.sendMessages(userId, messages);
        
        // 複数メッセージをストレージに追加
        messages.forEach((msg: any, index: number) => {
          const newMessage = {
            id: `${Date.now()}_${index}`,
            userId,
            displayName: 'Cerafilm CS Staff',
            text: msg.text || JSON.stringify(msg),
            timestamp: new Date().toISOString(),
            type: 'bot',
            status: '送信済み',
            priority: '中',
          };
          messageStore.push(newMessage);
        });
      }

      // メッセージを保存
      await saveMessages(messageStore);

      return NextResponse.json({
        success: true,
        result: result,
        message: 'メッセージが正常に送信されました',
      });
    } catch (lineError) {
      console.error('LINE API Error:', lineError);
      
      // 開発環境では、LINE APIエラーでも成功として扱う（モック）
      if (process.env.NODE_ENV === 'development') {
        const newMessage = {
          id: Date.now().toString(),
          userId,
          displayName: 'Cerafilm CS Staff',
          text,
          timestamp: new Date().toISOString(),
          type: 'bot',
          status: '送信済み（開発モード）',
          priority: '中',
        };
        messageStore.push(newMessage);
        await saveMessages(messageStore);
        
        return NextResponse.json({
          success: true,
          result: { messageId: 'dev_' + Date.now() },
          message: 'メッセージが送信されました（開発モード）',
        });
      }
      
      throw lineError;
    }
  } catch (error) {
    console.error('Error in POST /api/line/messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send LINE message',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// メッセージ履歴取得エンドポイント
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortOrder = searchParams.get('sort') || 'desc'; // desc: 新しい順, asc: 古い順

    console.log('Fetching messages:', { userId, limit, sortOrder });

    // メッセージを読み込み
    const messageStore = await loadMessages();

    // フィルタリング
    let filteredMessages = messageStore;
    if (userId) {
      filteredMessages = messageStore.filter(msg => msg.userId === userId);
    }

    // ソート
    filteredMessages.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime;
    });

    // 制限
    const limitedMessages = filteredMessages.slice(0, limit);

    // 統計情報
    const stats = {
      total: filteredMessages.length,
      unresolved: filteredMessages.filter(msg => msg.status === '未対応').length,
      resolved: filteredMessages.filter(msg => msg.status === '完了').length,
      inProgress: filteredMessages.filter(msg => msg.status === '対応中').length,
    };

    return NextResponse.json({
      messages: limitedMessages,
      stats,
      pagination: {
        total: filteredMessages.length,
        limit,
        hasMore: filteredMessages.length > limit,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/line/messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch LINE messages',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 新しいメッセージを追加する関数（Webhook用）
export async function addMessageToStore(message: any) {
  try {
    const messageStore = await loadMessages();
    
    const newMessage = {
      id: message.id || Date.now().toString(),
      userId: message.userId,
      displayName: message.displayName || 'Unknown User',
      text: message.text,
      timestamp: message.timestamp || new Date().toISOString(),
      type: message.type || 'user',
      status: message.status || '未対応',
      priority: message.priority || '中',
    };
    
    messageStore.push(newMessage);
    await saveMessages(messageStore);
    
    console.log('Message added to store:', newMessage);
    console.log('Total messages in store:', messageStore.length);
  } catch (error) {
    console.error('Error adding message to store:', error);
  }
} 