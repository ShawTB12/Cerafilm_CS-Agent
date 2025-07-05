import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { GmailClient } from '@/lib/gmail-client';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return createErrorResponse('Authentication required. Please sign in with Google.', 401);
    }

    const { to, subject, body, threadId } = await request.json();

    // バリデーション
    if (!to || !subject || !body) {
      return createErrorResponse('Missing required fields: to, subject, body', 400);
    }

    const gmailClient = new GmailClient(session.accessToken);
    
    const result = await gmailClient.sendMessage(to, subject, body, threadId);

    return createSuccessResponse({
      messageId: result.id,
      threadId: result.threadId,
    });
  } catch (error) {
    console.error('Error in POST /api/gmail/send:', error);
    return createErrorResponse('Failed to send email', 500);
  }
} 