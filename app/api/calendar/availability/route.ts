import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CalendarClient } from '@/lib/calendar-client';

// 空き時間チェック
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { startDateTime, endDateTime } = body;

    // バリデーション
    if (!startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'startDateTime and endDateTime are required' },
        { status: 400 }
      );
    }

    // 開始時間が終了時間より後でないことをチェック
    if (new Date(startDateTime) >= new Date(endDateTime)) {
      return NextResponse.json(
        { error: '開始時間は終了時間より前である必要があります' },
        { status: 400 }
      );
    }

    const calendarClient = new CalendarClient(session.accessToken);
    const isAvailable = await calendarClient.checkAvailability(startDateTime, endDateTime);

    return NextResponse.json({
      success: true,
      available: isAvailable,
      startDateTime,
      endDateTime,
      message: isAvailable ? '指定の時間帯は空いています' : '指定の時間帯は予約が入っています',
    });
  } catch (error) {
    console.error('Error in POST /api/calendar/availability:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check availability',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 