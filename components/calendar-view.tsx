"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, Event, View } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, Phone, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { CallReservation } from '@/lib/calendar-client';
import { CallPriority, CallStatus } from '@/lib/calendar-config';
import { cn } from '@/lib/utils';

// moment.jsの日本語ローカライゼーション
moment.locale('ja');
const localizer = momentLocalizer(moment);

// カレンダーイベントインターface
interface CalendarEventData extends Event {
  id?: string;
  resource?: {
    type: 'call' | 'general';
    data: CallReservation | any;
    priority?: CallPriority;
    status?: CallStatus;
  };
}

interface CalendarViewProps {
  onEventCreate?: (event: Omit<CallReservation, 'id'>) => void;
  onEventUpdate?: (eventId: string, updates: Partial<CallReservation>) => void;
  onEventDelete?: (eventId: string) => void;
}

export default function CalendarView({ onEventCreate, onEventUpdate, onEventDelete }: CalendarViewProps) {
  const [events, setEvents] = useState<CalendarEventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentView, setCurrentView] = useState<View>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // 新規予約フォーム状態
  const [newReservation, setNewReservation] = useState({
    customerName: '',
    customerPhone: '',
    subject: '',
    startDateTime: '',
    endDateTime: '',
    priority: CallPriority.MEDIUM,
    status: CallStatus.SCHEDULED,
    notes: '',
    attendeeEmail: '',
  });

  // カレンダーイベント取得
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const startOfMonth = moment(currentDate).startOf('month').toISOString();
      const endOfMonth = moment(currentDate).endOf('month').toISOString();

      // すべてのイベントを取得
      const [allEventsRes, callEventsRes] = await Promise.all([
        fetch(`/api/calendar/events?timeMin=${startOfMonth}&timeMax=${endOfMonth}&type=all`),
        fetch(`/api/calendar/events?timeMin=${startOfMonth}&timeMax=${endOfMonth}&type=calls`)
      ]);

      if (allEventsRes.ok && callEventsRes.ok) {
        const allEventsApiResponse = await allEventsRes.json();
        const callEventsApiResponse = await callEventsRes.json();
        
        // 新しいAPIレスポンス形式に対応
        const allEventsData = allEventsApiResponse.success ? allEventsApiResponse.data : allEventsApiResponse;
        const callEventsData = callEventsApiResponse.success ? callEventsApiResponse.data : callEventsApiResponse;

        const formattedEvents: CalendarEventData[] = [
                      // 一般的なカレンダーイベント
            ...(allEventsData.events || [])
              .filter((event: any) => !event.extendedProperties?.private?.eventType)
              .map((event: any) => ({
              id: event.id,
              title: event.summary || '無題',
              start: new Date(event.start.dateTime || event.start.date),
              end: new Date(event.end.dateTime || event.end.date),
              resource: {
                type: 'general' as const,
                data: event,
              },
            })),
          // 電話予約イベント
          ...(callEventsData.events || []).map((reservation: CallReservation) => ({
            id: reservation.id,
            title: `📞 ${reservation.customerName} - ${reservation.subject}`,
            start: new Date(reservation.startDateTime),
            end: new Date(reservation.endDateTime),
            resource: {
              type: 'call' as const,
              data: reservation,
              priority: reservation.priority,
              status: reservation.status,
            },
          })),
        ];

        setEvents(formattedEvents);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // イベントクリック処理
  const handleEventClick = (event: CalendarEventData) => {
    setSelectedEvent(event);
    if (event.resource?.type === 'call') {
      setShowEditDialog(true);
    }
  };

  // 時間スロット選択処理（新規予約作成）
  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setNewReservation(prev => ({
      ...prev,
      startDateTime: moment(start).format('YYYY-MM-DDTHH:mm'),
      endDateTime: moment(end).format('YYYY-MM-DDTHH:mm'),
    }));
    setShowCreateDialog(true);
  };

  // 新規予約作成
  const handleCreateReservation = async () => {
    if (!newReservation.customerName || !newReservation.customerPhone || !newReservation.subject) {
      alert('お客様名、電話番号、件名は必須項目です。');
      return;
    }

    try {
      const reservation: Omit<CallReservation, 'id'> = {
        ...newReservation,
        startDateTime: moment(newReservation.startDateTime).toISOString(),
        endDateTime: moment(newReservation.endDateTime).toISOString(),
      };

      if (onEventCreate) {
        await onEventCreate(reservation);
      }

      // フォームリセット
      setNewReservation({
        customerName: '',
        customerPhone: '',
        subject: '',
        startDateTime: '',
        endDateTime: '',
        priority: CallPriority.MEDIUM,
        status: CallStatus.SCHEDULED,
        notes: '',
        attendeeEmail: '',
      });

      setShowCreateDialog(false);
      fetchEvents(); // イベント一覧を再取得
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('予約の作成に失敗しました。');
    }
  };

  // イベントスタイル
  const eventStyleGetter = (event: CalendarEventData) => {
    let style: React.CSSProperties = {
      borderRadius: '6px',
      border: 'none',
      fontSize: '12px',
    };

    if (event.resource?.type === 'call') {
      const { priority, status } = event.resource;
      
      // 優先度による色分け
      if (priority === CallPriority.HIGH) {
        style.backgroundColor = '#ef4444'; // 赤色
      } else if (priority === CallPriority.MEDIUM) {
        style.backgroundColor = '#3b82f6'; // 青色
      } else {
        style.backgroundColor = '#10b981'; // 緑色
      }

      // 状態による透明度調整
      if (status === CallStatus.COMPLETED) {
        style.opacity = 0.7;
      } else if (status === CallStatus.CANCELLED) {
        style.opacity = 0.5;
        style.textDecoration = 'line-through';
      }
    } else {
      style.backgroundColor = '#6b7280'; // グレー色（一般イベント）
    }

    return { style };
  };

  return (
    <div className="space-y-6">
      {/* カレンダーヘッダー */}
      <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5" />
              <span>電話予約カレンダー</span>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#2D8EFF] hover:bg-[#2D8EFF]/90 rounded-[12px]">
                  <Phone className="w-4 h-4 mr-2" />
                  新規予約
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>新規電話予約</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">お客様名 *</Label>
                    <Input
                      id="customerName"
                      value={newReservation.customerName}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="田中 太郎"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">電話番号 *</Label>
                    <Input
                      id="customerPhone"
                      value={newReservation.customerPhone}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, customerPhone: e.target.value }))}
                      placeholder="090-1234-5678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">件名 *</Label>
                    <Input
                      id="subject"
                      value={newReservation.subject}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="商品の詳細説明希望"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDateTime">開始時間</Label>
                      <Input
                        id="startDateTime"
                        type="datetime-local"
                        value={newReservation.startDateTime}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, startDateTime: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endDateTime">終了時間</Label>
                      <Input
                        id="endDateTime"
                        type="datetime-local"
                        value={newReservation.endDateTime}
                        onChange={(e) => setNewReservation(prev => ({ ...prev, endDateTime: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="priority">優先度</Label>
                      <Select 
                        value={newReservation.priority} 
                        onValueChange={(value: CallPriority) => setNewReservation(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CallPriority.HIGH}>高</SelectItem>
                          <SelectItem value={CallPriority.MEDIUM}>中</SelectItem>
                          <SelectItem value={CallPriority.LOW}>低</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">状態</Label>
                      <Select 
                        value={newReservation.status} 
                        onValueChange={(value: CallStatus) => setNewReservation(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={CallStatus.SCHEDULED}>予約済み</SelectItem>
                          <SelectItem value={CallStatus.COMPLETED}>完了</SelectItem>
                          <SelectItem value={CallStatus.CANCELLED}>キャンセル</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">備考</Label>
                    <Textarea
                      id="notes"
                      value={newReservation.notes}
                      onChange={(e) => setNewReservation(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="特記事項があれば記入してください..."
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      キャンセル
                    </Button>
                    <Button onClick={handleCreateReservation}>
                      予約を作成
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* カレンダー本体 */}
      <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
        <CardContent className="p-6">
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              onSelectEvent={handleEventClick}
              onSelectSlot={handleSelectSlot}
              selectable
              eventPropGetter={eventStyleGetter}
              view={currentView}
              onView={setCurrentView}
              date={currentDate}
              onNavigate={setCurrentDate}
              messages={{
                next: '次へ',
                previous: '前へ',
                today: '今日',
                month: '月',
                week: '週',
                day: '日',
                agenda: '予定',
                noEventsInRange: 'この期間にイベントはありません',
              }}
              formats={{
                monthHeaderFormat: 'YYYY年 M月',
                dayHeaderFormat: 'M月 D日 (dddd)',
                dayRangeHeaderFormat: ({ start, end }) => 
                  `${moment(start).format('M月D日')} - ${moment(end).format('M月D日')}`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 凡例 */}
      <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm">高優先度</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">中優先度</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm">低優先度</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span className="text-sm">一般予定</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 