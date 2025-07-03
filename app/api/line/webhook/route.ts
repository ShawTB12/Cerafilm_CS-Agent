import { NextRequest, NextResponse } from 'next/server';
import { WebhookEvent } from '@line/bot-sdk';
import { LineClient } from '@/lib/line-client';
import { LINE_CONFIG } from '@/lib/line-config';
import { addMessageToStore } from '@/app/api/line/messages/route';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.text();
    
    console.log('Webhook request body:', body);
    
    // 署名検証（開発環境では一時的に無効化）
    const signature = request.headers.get('x-line-signature');
    const isDevelopment = process.env.NODE_ENV === 'development' && 
      process.env.LINE_CHANNEL_ACCESS_TOKEN === 'development_test_token';
    
    // 署名検証を一時的に無効化（実際のLINE連携テスト用）
    if (false && !isDevelopment && (!signature || !LineClient.validateSignature(body, signature))) {
      console.error('Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }
    
    console.log('LINE Webhook received:', { 
      hasSignature: !!signature, 
      bodyLength: body.length,
      isDevelopment 
    });
    
    // Webhookイベントを解析
    let events: WebhookEvent[];
    try {
      const parsedBody = JSON.parse(body);
      events = parsedBody.events || [];
      console.log('Parsed events:', events);
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON body', details: parseError },
        { status: 400 }
      );
    }
    
    const lineClient = new LineClient();
    
    // 各イベントを処理
    for (const event of events) {
      console.log('Processing LINE event:', event);
      
      try {
        if (event.type === 'message' && event.message.type === 'text') {
          const { replyToken, source } = event;
          const messageText = (event.message as any).text;
          const userId = source.userId;
          
          console.log('Processing text message:', { userId, messageText, replyToken });
          
          // ユーザープロフィールを取得（開発環境ではモック）
          let userProfile;
          try {
            if (isDevelopment) {
              userProfile = { 
                userId: userId || '', 
                displayName: `テストユーザー${Math.floor(Math.random() * 100)}` 
              };
            } else {
              userProfile = await lineClient.getUserProfile(userId || '');
            }
          } catch (error) {
            console.warn('Could not get user profile, using fallback:', error);
            userProfile = { userId: userId || '', displayName: 'Unknown User' };
          }
          
          console.log('User profile:', userProfile);
          
          // ユーザーのメッセージをストアに保存
          const userMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId || '',
            displayName: userProfile.displayName || 'Unknown User',
            text: messageText,
            timestamp: new Date().toISOString(),
            type: 'user',
            status: '未対応',
            priority: determinePriority(messageText),
          };
          
          console.log('Adding user message to store:', userMessage);
          await addMessageToStore(userMessage);
          
          // AI自動応答ロジック（簡易版）
          let replyText = await generateAutoReply(messageText, userProfile.displayName || '');
          console.log('Generated reply:', replyText);
          
          // 返信メッセージを送信（開発環境ではスキップ）
          if (!isDevelopment) {
            try {
              await lineClient.replyMessage(replyToken, [
                {
                  type: 'text',
                  text: replyText,
                },
              ]);
              console.log('Reply sent successfully');
            } catch (replyError) {
              console.error('Failed to send reply:', replyError);
            }
          } else {
            console.log('Development mode: Skipping LINE API reply');
          }
          
          // BOTの返信もストアに保存
          const botMessage = {
            id: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId || '',
            displayName: 'Cerafilm CS Bot',
            text: replyText,
            timestamp: new Date().toISOString(),
            type: 'bot',
            status: '回答済み',
            priority: '中',
          };
          
          console.log('Adding bot message to store:', botMessage);
          await addMessageToStore(botMessage);
          
        } else if (event.type === 'follow') {
          console.log('Processing follow event');
          
          const { replyToken, source } = event;
          const userId = source.userId;
          
          let userProfile;
          try {
            if (isDevelopment) {
              userProfile = { 
                userId: userId || '', 
                displayName: `新規フォロワー${Math.floor(Math.random() * 100)}` 
              };
            } else {
              userProfile = await lineClient.getUserProfile(userId || '');
            }
          } catch (error) {
            userProfile = { userId: userId || '', displayName: 'New Follower' };
          }
          
          const welcomeMessage = `Cerafilm CSへようこそ！🎉\n\nお困りのことがございましたら、お気軽にメッセージをお送りください。\n\n営業時間: 平日 9:00-18:00\n緊急時: 24時間対応\n\nよろしくお願いいたします！`;
          
          if (!isDevelopment) {
            try {
              await lineClient.replyMessage(replyToken, [
                {
                  type: 'text',
                  text: welcomeMessage,
                },
              ]);
            } catch (replyError) {
              console.error('Failed to send welcome message:', replyError);
            }
          }
          
          // フォローイベントをストアに保存
          await addMessageToStore({
            id: `follow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId || '',
            displayName: userProfile.displayName || 'New Follower',
            text: '[フォローイベント] ユーザーがアカウントをフォローしました',
            timestamp: new Date().toISOString(),
            type: 'system',
            status: '完了',
            priority: '低',
          });
          
          // ウェルカムメッセージもストアに保存
          await addMessageToStore({
            id: `welcome_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId || '',
            displayName: 'Cerafilm CS Bot',
            text: welcomeMessage,
            timestamp: new Date().toISOString(),
            type: 'bot',
            status: '送信済み',
            priority: '低',
          });
          
          console.log('Follow event processed for user:', source.userId);
          
        } else if (event.type === 'unfollow') {
          console.log('Processing unfollow event');
          
          const { source } = event;
          const userId = source.userId;
          
          // アンフォローイベントをストアに保存
          await addMessageToStore({
            id: `unfollow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: userId || '',
            displayName: 'Unknown User',
            text: '[アンフォローイベント] ユーザーがアカウントをアンフォローしました',
            timestamp: new Date().toISOString(),
            type: 'system',
            status: '完了',
            priority: '低',
          });
          
          console.log('Unfollow event processed for user:', source.userId);
        } else {
          console.log('Unhandled event type:', event.type);
        }
      } catch (eventError) {
        console.error('Error processing individual event:', eventError, 'Event:', event);
        // 個別のイベントエラーは全体の処理を止めない
      }
    }
    
    console.log('Webhook processing completed successfully');
    return NextResponse.json({ status: 'ok', processed: events.length });
    
  } catch (error) {
    console.error('Error in LINE webhook:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * メッセージの優先度を判定
 */
function determinePriority(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // 緊急キーワード
  const urgentKeywords = ['緊急', '至急', 'エラー', '不具合', '動かない', '壊れた', '返金'];
  if (urgentKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return '高';
  }
  
  // 低優先度キーワード
  const lowPriorityKeywords = ['ありがとう', 'よろしく', 'こんにちは', 'お疲れ'];
  if (lowPriorityKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return '低';
  }
  
  return '中';
}

/**
 * AI自動応答の生成（簡易版）
 */
async function generateAutoReply(message: string, userName: string): Promise<string> {
  const lowerMessage = message.toLowerCase();
  
  // キーワードベースの自動応答
  if (lowerMessage.includes('こんにちは') || lowerMessage.includes('はじめまして')) {
    return `${userName}様、こんにちは！\n\nCerafilm カスタマーサクセスチームです。\nお困りのことがございましたら、お気軽にお声かけください🙂`;
  }
  
  if (lowerMessage.includes('返品') || lowerMessage.includes('交換')) {
    return `${userName}様\n\n返品・交換についてお問い合わせいただき、ありがとうございます。\n\n以下の手順で承ります：\n\n1. 商品到着から30日以内\n2. 未使用・未開封状態\n3. 返品申請フォームの提出\n\n詳細はこちら：\nhttps://cerafilm.com/returns\n\nご不明な点がございましたら、お気軽にお問い合わせください。`;
  }
  
  if (lowerMessage.includes('配送') || lowerMessage.includes('送料')) {
    return `${userName}様\n\n配送についてお問い合わせいただき、ありがとうございます。\n\n📦 配送について\n・全国一律送料無料（5,000円以上）\n・通常1-3営業日でお届け\n・配送状況は追跡番号で確認可能\n\n配送に関してご不明な点がございましたら、お気軽にお問い合わせください。`;
  }
  
  if (lowerMessage.includes('問い合わせ') || lowerMessage.includes('サポート')) {
    return `${userName}様\n\nお問い合わせいただき、ありがとうございます。\n\n📞 サポート窓口\n電話: 0120-XXX-XXX\n営業時間: 平日 9:00-18:00\n\n📧 メールサポート\nsupport@cerafilm.com\n\n🔗 よくあるご質問\nhttps://cerafilm.com/faq\n\n専門スタッフが対応いたします。`;
  }
  
  if (lowerMessage.includes('ありがとう')) {
    return `${userName}様\n\nこちらこそ、ありがとうございます！😊\n\n他にもご不明な点やお困りのことがございましたら、いつでもお気軽にお声かけください。\n\nCerafilm一同、${userName}様のお役に立てるよう努めさせていただきます。`;
  }
  
  // デフォルト応答
  return `${userName}様\n\nメッセージをいただき、ありがとうございます。\n\n担当者より詳しくご回答いたしますので、少々お待ちください。\n\n緊急のお問い合わせの場合は、お電話（0120-XXX-XXX）でのご連絡をお勧めいたします。\n\nCerafilm CS チーム`;
} 