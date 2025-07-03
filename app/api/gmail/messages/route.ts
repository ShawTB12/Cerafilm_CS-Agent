import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GmailClient } from '@/lib/gmail-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in with Google.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const maxResults = searchParams.get('maxResults');
    const pageToken = searchParams.get('pageToken');

    const gmailClient = new GmailClient(session.accessToken);
    
    const messages = await gmailClient.listMessages(
      query || 'in:inbox',
      maxResults ? parseInt(maxResults) : undefined,
      pageToken || undefined
    );

    // 取得件数制限（デフォルト50件、最大100件）
    const actualMaxResults = maxResults ? parseInt(maxResults) : 50;
    const limitedMessages = (messages.messages || []).slice(0, Math.min(actualMaxResults, 100));
    
    // メッセージの詳細情報を並行して取得
    const messageDetails = await Promise.all(
      limitedMessages.map(async (msg) => {
        try {
          const detail = await gmailClient.getMessage(msg.id);
          const headers = detail.payload.headers;
          
          return {
            id: detail.id,
            threadId: detail.threadId,
            sender: GmailClient.getHeaderValue(headers, 'From'),
            subject: GmailClient.getHeaderValue(headers, 'Subject'),
            date: GmailClient.getHeaderValue(headers, 'Date'),
            snippet: detail.snippet,
            labelIds: detail.labelIds,
            unread: detail.labelIds.includes('UNREAD'),
            body: GmailClient.extractEmailBody(detail),
          };
        } catch (error) {
          console.error(`Error getting message details for ${msg.id}:`, error);
          return null;
        }
      })
    );

    return NextResponse.json({
      messages: messageDetails.filter(Boolean),
      nextPageToken: messages.nextPageToken,
      resultSizeEstimate: messages.resultSizeEstimate,
    });
  } catch (error) {
    console.error('Error in GET /api/gmail/messages:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch Gmail messages. Please check your authentication.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 