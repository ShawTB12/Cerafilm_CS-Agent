import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CalendarClient } from '@/lib/calendar-client';
import { createSuccessResponse, createErrorResponse } from '@/lib/utils';

// 空き時間チェック
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return createErrorResponse('Authentication required. Please sign in with Google.', 401);
    }

    const body = await request.json();
    const { startDateTime, endDateTime } = body;

    // バリデーション
    if (!startDateTime || !endDateTime) {
      return createErrorResponse('startDateTime and endDateTime are required', 400);
    }

    // 開始時間が終了時間より後でないことをチェック
    if (new Date(startDateTime) >= new Date(endDateTime)) {
      return createErrorResponse('開始時間は終了時間より前である必要があります', 400);
    }

    const calendarClient = new CalendarClient(session.accessToken);
    const isAvailable = await calendarClient.checkAvailability(startDateTime, endDateTime);

    return createSuccessResponse({
      available: isAvailable,
      startDateTime,
      endDateTime,
      message: isAvailable ? '指定の時間帯は空いています' : '指定の時間帯は予約が入っています',
    });
  } catch (error) {
    console.error('Error in POST /api/calendar/availability:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to check availability',
      500
    );
  }
} 