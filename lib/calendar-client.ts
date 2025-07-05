import { google } from 'googleapis';
import { CALENDAR_CONFIG, validateCalendarConfig, EventType, CallPriority, CallStatus } from './calendar-config';
import { isAuthError } from './auth';

// 型定義
export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  colorId?: string;
  // カスタムフィールド（電話予約用）
  extendedProperties?: {
    private?: {
      eventType?: EventType;
      customerName?: string;
      customerPhone?: string;
      priority?: CallPriority;
      status?: CallStatus;
      notes?: string;
    };
  };
}

export interface CallReservation {
  id?: string;
  customerName: string;
  customerPhone: string;
  subject: string;
  startDateTime: string;
  endDateTime: string;
  priority: CallPriority;
  status: CallStatus;
  notes?: string;
  attendeeEmail?: string;
}

export interface CalendarClientOptions {
  maxRetries?: number;
  retryDelay?: number;
}

export class CalendarClient {
  private auth: any;
  private calendar: any;
  private accessToken: string;
  private maxRetries: number;
  private retryDelay: number;

  constructor(accessToken: string, options: CalendarClientOptions = {}) {
    try {
      validateCalendarConfig();
      
      this.accessToken = accessToken;
      this.maxRetries = options.maxRetries || 3;
      this.retryDelay = options.retryDelay || 1000;
      
      this.auth = new google.auth.OAuth2(
        CALENDAR_CONFIG.clientId,
        CALENDAR_CONFIG.clientSecret
      );
      
      this.auth.setCredentials({
        access_token: accessToken,
      });
      
      this.calendar = google.calendar({ 
        version: CALENDAR_CONFIG.apiVersion, 
        auth: this.auth 
      });
      
    } catch (error) {
      console.error('Calendar client initialization error:', error);
      throw new Error('Calendar client initialization failed');
    }
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
        const response = await this.calendar.calendars.get({ calendarId: 'primary' });
        return response.data;
      }, 'Connection test');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * カレンダーイベント一覧取得
   */
  async getEvents(options: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    calendarId?: string;
  } = {}): Promise<CalendarEvent[]> {
    return this.executeWithRetry(async () => {
      const {
        timeMin = new Date().toISOString(),
        timeMax,
        maxResults = CALENDAR_CONFIG.maxResults,
        calendarId = CALENDAR_CONFIG.primaryCalendarId
      } = options;

      const response = await this.calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: CALENDAR_CONFIG.timeZone,
      });

      return response.data.items || [];
    }, 'Get calendar events');
  }

  /**
   * 電話予約専用イベント取得
   */
  async getCallReservations(options: {
    timeMin?: string;
    timeMax?: string;
  } = {}): Promise<CallReservation[]> {
    try {
      const events = await this.getEvents(options);
      
      return events
        .filter(event => 
          event.extendedProperties?.private?.eventType === EventType.CALL_RESERVATION
        )
        .map(this.mapEventToCallReservation);
    } catch (error) {
      console.error('Error fetching call reservations:', error);
      throw new Error('Failed to fetch call reservations');
    }
  }

  /**
   * 電話予約イベント作成
   */
  async createCallReservation(reservation: Omit<CallReservation, 'id'>): Promise<CalendarEvent> {
    return this.executeWithRetry(async () => {
      const event: CalendarEvent = {
        summary: `電話予約: ${reservation.customerName} - ${reservation.subject}`,
        description: this.buildEventDescription(reservation),
        start: {
          dateTime: reservation.startDateTime,
          timeZone: CALENDAR_CONFIG.timeZone,
        },
        end: {
          dateTime: reservation.endDateTime,
          timeZone: CALENDAR_CONFIG.timeZone,
        },
        colorId: CALENDAR_CONFIG.callEventColor,
        extendedProperties: {
          private: {
            eventType: EventType.CALL_RESERVATION,
            customerName: reservation.customerName,
            customerPhone: reservation.customerPhone,
            priority: reservation.priority,
            status: reservation.status,
            notes: reservation.notes || '',
          },
        },
      };

      if (reservation.attendeeEmail) {
        event.attendees = [{
          email: reservation.attendeeEmail,
          displayName: reservation.customerName,
        }];
      }

      const response = await this.calendar.events.insert({
        calendarId: CALENDAR_CONFIG.primaryCalendarId,
        resource: event,
        sendUpdates: 'all',
      });

      return response.data;
    }, 'Create call reservation');
  }

  /**
   * 電話予約イベント更新
   */
  async updateCallReservation(eventId: string, updates: Partial<CallReservation>): Promise<CalendarEvent> {
    return this.executeWithRetry(async () => {
      // 既存イベントを取得
      const existingEvent = await this.calendar.events.get({
        calendarId: CALENDAR_CONFIG.primaryCalendarId,
        eventId,
      });

      const event = existingEvent.data;
      const currentProps = event.extendedProperties?.private || {};

      // 更新データをマージ
      if (updates.customerName) {
        event.summary = `電話予約: ${updates.customerName} - ${updates.subject || currentProps.customerName}`;
        currentProps.customerName = updates.customerName;
      }

      if (updates.startDateTime) {
        event.start = {
          dateTime: updates.startDateTime,
          timeZone: CALENDAR_CONFIG.timeZone,
        };
      }

      if (updates.endDateTime) {
        event.end = {
          dateTime: updates.endDateTime,
          timeZone: CALENDAR_CONFIG.timeZone,
        };
      }

      if (updates.customerPhone) {
        currentProps.customerPhone = updates.customerPhone;
      }

      if (updates.priority) {
        currentProps.priority = updates.priority;
      }

      if (updates.status) {
        currentProps.status = updates.status;
      }

      if (updates.notes !== undefined) {
        currentProps.notes = updates.notes;
      }

      if (updates.attendeeEmail) {
        event.attendees = [{
          email: updates.attendeeEmail,
          displayName: updates.customerName || currentProps.customerName,
        }];
      }

      // 説明文を再生成
      const reservation: CallReservation = {
        id: eventId,
        customerName: currentProps.customerName || '',
        customerPhone: currentProps.customerPhone || '',
        subject: updates.subject || event.summary?.replace(/^電話予約: .* - /, '') || '',
        startDateTime: event.start?.dateTime || '',
        endDateTime: event.end?.dateTime || '',
        priority: currentProps.priority || CallPriority.MEDIUM,
        status: currentProps.status || CallStatus.SCHEDULED,
        notes: currentProps.notes,
        attendeeEmail: updates.attendeeEmail,
      };

      event.description = this.buildEventDescription(reservation);
      event.extendedProperties = { private: currentProps };

      const response = await this.calendar.events.update({
        calendarId: CALENDAR_CONFIG.primaryCalendarId,
        eventId,
        resource: event,
        sendUpdates: 'all',
      });

      return response.data;
    }, 'Update call reservation');
  }

  /**
   * イベント削除
   */
  async deleteEvent(eventId: string): Promise<void> {
    await this.executeWithRetry(async () => {
      await this.calendar.events.delete({
        calendarId: CALENDAR_CONFIG.primaryCalendarId,
        eventId,
        sendUpdates: 'all',
      });
    }, 'Delete event');
  }

  /**
   * 空き時間チェック
   */
  async checkAvailability(startDateTime: string, endDateTime: string): Promise<boolean> {
    try {
      const events = await this.getEvents({
        timeMin: startDateTime,
        timeMax: endDateTime,
      });

      // 指定された時間帯と重複するイベントがあるかチェック
      const startTime = new Date(startDateTime);
      const endTime = new Date(endDateTime);

      const conflictingEvents = events.filter(event => {
        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // 時間帯の重複チェック
        return (startTime < eventEnd && endTime > eventStart);
      });

      return conflictingEvents.length === 0;
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  /**
   * バッチでイベントを取得（効率化）
   */
  async getEventsBatch(eventIds: string[]): Promise<CalendarEvent[]> {
    return this.executeWithRetry(async () => {
      const promises = eventIds.map(id => 
        this.calendar.events.get({
          calendarId: CALENDAR_CONFIG.primaryCalendarId,
          eventId: id,
        })
      );
      
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value.data);
    }, 'Get events batch');
  }

  /**
   * CalendarEventをCallReservationに変換
   */
  private mapEventToCallReservation(event: CalendarEvent): CallReservation {
    const props = event.extendedProperties?.private || {};
    
    return {
      id: event.id,
      customerName: props.customerName || '',
      customerPhone: props.customerPhone || '',
      subject: event.summary?.replace(/^電話予約: .* - /, '') || '',
      startDateTime: event.start.dateTime,
      endDateTime: event.end.dateTime,
      priority: props.priority || CallPriority.MEDIUM,
      status: props.status || CallStatus.SCHEDULED,
      notes: props.notes,
      attendeeEmail: event.attendees?.[0]?.email,
    };
  }

  /**
   * イベント説明文を構築
   */
  private buildEventDescription(reservation: CallReservation): string {
    const lines = [
      `顧客名: ${reservation.customerName}`,
      `電話番号: ${reservation.customerPhone}`,
      `件名: ${reservation.subject}`,
      `優先度: ${reservation.priority}`,
      `状態: ${reservation.status}`,
    ];

    if (reservation.notes) {
      lines.push(`備考: ${reservation.notes}`);
    }

    if (reservation.attendeeEmail) {
      lines.push(`担当者: ${reservation.attendeeEmail}`);
    }

    lines.push('');
    lines.push('このイベントはCerafilm CSシステムにより自動生成されました。');

    return lines.join('\n');
  }
} 