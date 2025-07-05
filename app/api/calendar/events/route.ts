import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CalendarClient, CalendarEvent, CallReservation } from '@/lib/calendar-client';
import { CallPriority, CallStatus } from '@/lib/calendar-config';
import { APIError, createSuccessResponse, createErrorResponse } from '@/lib/utils';

// カレンダーイベント一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const maxResults = searchParams.get('maxResults');
    const type = searchParams.get('type'); // 'all' | 'calls'

    const calendarClient = new CalendarClient(session.accessToken);

    let events: CalendarEvent[] | CallReservation[];

    if (type === 'calls') {
      // 電話予約のみ取得
      events = await calendarClient.getCallReservations({
        timeMin: timeMin || undefined,
        timeMax: timeMax || undefined,
      });
    } else {
      // 全イベント取得
      events = await calendarClient.getEvents({
        timeMin: timeMin || undefined,
        timeMax: timeMax || undefined,
        maxResults: maxResults ? parseInt(maxResults) : undefined,
      });
    }

    const response = createSuccessResponse({
      events,
      type: type || 'all',
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/calendar/events:', error);
    const apiError = APIError.fromError(error);
    return NextResponse.json(createErrorResponse(apiError), { status: apiError.statusCode });
  }
}

// 電話予約イベント作成
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
    const { 
      customerName, 
      customerPhone, 
      subject, 
      startDateTime, 
      endDateTime, 
      priority = CallPriority.MEDIUM,
      status = CallStatus.SCHEDULED,
      notes,
      attendeeEmail 
    } = body;

    // バリデーション
    if (!customerName || !customerPhone || !subject || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const reservation: Omit<CallReservation, 'id'> = {
      customerName,
      customerPhone,
      subject,
      startDateTime,
      endDateTime,
      priority,
      status,
      notes,
      attendeeEmail,
    };

    const calendarClient = new CalendarClient(session.accessToken);
    
    // 空き時間チェック
    const isAvailable = await calendarClient.checkAvailability(startDateTime, endDateTime);
    if (!isAvailable) {
      return NextResponse.json(
        { error: '指定された時間帯は既に予約が入っています' },
        { status: 409 }
      );
    }

    const createdEvent = await calendarClient.createCallReservation(reservation);

    return NextResponse.json({
      success: true,
      event: createdEvent,
      message: '電話予約が正常に作成されました',
    });
  } catch (error) {
    console.error('Error in POST /api/calendar/events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create call reservation',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// 電話予約イベント更新
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, ...updates } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const calendarClient = new CalendarClient(session.accessToken);
    
    // 時間変更がある場合は空き時間チェック
    if (updates.startDateTime && updates.endDateTime) {
      const isAvailable = await calendarClient.checkAvailability(
        updates.startDateTime, 
        updates.endDateTime
      );
      if (!isAvailable) {
        return NextResponse.json(
          { error: '指定された時間帯は既に予約が入っています' },
          { status: 409 }
        );
      }
    }

    const updatedEvent = await calendarClient.updateCallReservation(eventId, updates);

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: '電話予約が正常に更新されました',
    });
  } catch (error) {
    console.error('Error in PUT /api/calendar/events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update call reservation',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// イベント削除
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const calendarClient = new CalendarClient(session.accessToken);
    await calendarClient.deleteEvent(eventId);

    return NextResponse.json({
      success: true,
      message: 'イベントが正常に削除されました',
    });
  } catch (error) {
    console.error('Error in DELETE /api/calendar/events:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete event',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 