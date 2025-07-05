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
      return createErrorResponse('Authentication required. Please sign in with Google.', 401);
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

    return createSuccessResponse({
      events,
      type: type || 'all',
    });
  } catch (error) {
    console.error('Error in GET /api/calendar/events:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch calendar events',
      500
    );
  }
}

// 電話予約イベント作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return createErrorResponse('Authentication required. Please sign in with Google.', 401);
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
      return createErrorResponse('Missing required fields', 400);
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
      return createErrorResponse('指定された時間帯は既に予約が入っています', 409);
    }

    const createdEvent = await calendarClient.createCallReservation(reservation);

    return createSuccessResponse({
      event: createdEvent,
      message: '電話予約が正常に作成されました',
    }, 201);
  } catch (error) {
    console.error('Error in POST /api/calendar/events:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create call reservation',
      500
    );
  }
}

// 電話予約イベント更新
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return createErrorResponse('Authentication required. Please sign in with Google.', 401);
    }

    const body = await request.json();
    const { eventId, ...updates } = body;

    if (!eventId) {
      return createErrorResponse('Event ID is required', 400);
    }

    const calendarClient = new CalendarClient(session.accessToken);
    
    // 時間変更がある場合は空き時間チェック
    if (updates.startDateTime && updates.endDateTime) {
      const isAvailable = await calendarClient.checkAvailability(
        updates.startDateTime, 
        updates.endDateTime
      );
      if (!isAvailable) {
        return createErrorResponse('指定された時間帯は既に予約が入っています', 409);
      }
    }

    const updatedEvent = await calendarClient.updateCallReservation(eventId, updates);

    return createSuccessResponse({
      event: updatedEvent,
      message: '電話予約が正常に更新されました',
    });
  } catch (error) {
    console.error('Error in PUT /api/calendar/events:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to update call reservation',
      500
    );
  }
}

// イベント削除
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return createErrorResponse('Authentication required. Please sign in with Google.', 401);
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return createErrorResponse('Event ID is required', 400);
    }

    const calendarClient = new CalendarClient(session.accessToken);
    await calendarClient.deleteEvent(eventId);

    return createSuccessResponse({
      message: 'イベントが正常に削除されました',
    });
  } catch (error) {
    console.error('Error in DELETE /api/calendar/events:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to delete event',
      500
    );
  }
} 