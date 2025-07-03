import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GmailClient } from '@/lib/gmail-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const gmailClient = new GmailClient(session.accessToken);
    const message = await gmailClient.getMessage(resolvedParams.id);
    
    const headers = message.payload.headers;
    
    const formattedMessage = {
      id: message.id,
      threadId: message.threadId,
      sender: GmailClient.getHeaderValue(headers, 'From'),
      subject: GmailClient.getHeaderValue(headers, 'Subject'),
      date: GmailClient.getHeaderValue(headers, 'Date'),
      to: GmailClient.getHeaderValue(headers, 'To'),
      cc: GmailClient.getHeaderValue(headers, 'Cc'),
      snippet: message.snippet,
      labelIds: message.labelIds,
      unread: message.labelIds.includes('UNREAD'),
      body: GmailClient.extractEmailBody(message),
      internalDate: message.internalDate,
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error('Error in GET /api/gmail/messages/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const { action } = await request.json();
    const gmailClient = new GmailClient(session.accessToken);

    if (action === 'markAsRead') {
      await gmailClient.markAsRead(resolvedParams.id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in PATCH /api/gmail/messages/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 