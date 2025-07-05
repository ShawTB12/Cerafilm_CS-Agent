"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Phone, Calendar, Clock, User, FileText, List, CalendarDays, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CalendarView from "@/components/calendar-view"
import { CallReservation } from "@/lib/calendar-client"
import { CallPriority, CallStatus } from "@/lib/calendar-config"

export default function CallPage() {
  const { data: session, status } = useSession()
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [callData, setCallData] = useState<CallReservation[]>([])
  const [loading, setLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // カレンダーからの電話予約取得
  const fetchCallData = async () => {
    if (!session?.accessToken) {
      setDebugInfo("No access token available")
      return
    }

    setLoading(true)
    setAuthError(null)
    setDebugInfo("Fetching call data...")
    
    try {
      const response = await fetch(`/api/calendar/events?type=calls`)
      setDebugInfo(`API Response: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        setCallData(data.events || [])
        setDebugInfo(`Successfully loaded ${data.events?.length || 0} events`)
      } else if (response.status === 500) {
        const errorData = await response.json()
        if (errorData.details?.includes('insufficient authentication scopes')) {
          setAuthError('Google Calendar APIの権限が不足しています。再ログインしてCalendarスコープを承認してください。')
        } else {
          setAuthError(`API エラー: ${errorData.error}`)
        }
        setDebugInfo(`Error: ${JSON.stringify(errorData)}`)
      } else {
        setAuthError(`HTTP Error ${response.status}`)
        setDebugInfo(`HTTP Error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error fetching call data:', error)
      setAuthError('データの取得に失敗しました。')
      setDebugInfo(`Exception: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setDebugInfo(`Session status: ${status}, Access token: ${session?.accessToken ? 'Available' : 'Missing'}`)
    if (session?.accessToken) {
      fetchCallData()
    }
  }, [session, status])

  // 電話予約作成
  const handleCreateReservation = async (reservation: Omit<CallReservation, 'id'>) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
      })

      if (response.ok) {
        await fetchCallData() // リストを再取得
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create reservation')
      }
    } catch (error) {
      console.error('Error creating reservation:', error)
      throw error
    }
  }

  // 電話予約更新
  const handleUpdateReservation = async (eventId: string, updates: Partial<CallReservation>) => {
    try {
      const response = await fetch('/api/calendar/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...updates }),
      })

      if (response.ok) {
        await fetchCallData() // リストを再取得
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update reservation')
      }
    } catch (error) {
      console.error('Error updating reservation:', error)
      throw error
    }
  }

  // 電話予約削除
  const handleDeleteReservation = async (eventId: string) => {
    try {
      const response = await fetch(`/api/calendar/events?eventId=${eventId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchCallData() // リストを再取得
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete reservation')
      }
    } catch (error) {
      console.error('Error deleting reservation:', error)
      throw error
    }
  }

  // 再認証ハンドラー
  const handleReauth = async () => {
    try {
      await signOut({ redirect: false })
      window.location.href = '/login'
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // フィルタリング
  const filteredData = callData.filter((call) => {
    if (selectedFilter === "all") return true
    return call.status === selectedFilter
  })

  // 統計情報
  const stats = {
    today: callData.filter(call => {
      const today = new Date().toDateString()
      return new Date(call.startDateTime).toDateString() === today
    }).length,
    thisWeek: callData.filter(call => {
      const thisWeek = new Date()
      const weekStart = new Date(thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay()))
      return new Date(call.startDateTime) >= weekStart
    }).length,
    completed: callData.filter(call => call.status === CallStatus.COMPLETED).length,
    cancelled: callData.filter(call => call.status === CallStatus.CANCELLED).length,
  }

  // ローディング状態
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証状態
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px] p-8">
          <div className="text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold mb-2">ログインが必要です</h2>
            <p className="text-slate-600 mb-4">電話予約カレンダーにアクセスするには、Googleアカウントでログインしてください。</p>
            <Button onClick={() => window.location.href = '/login'}>
              ログイン
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-slate-500/3" />

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-semibold text-slate-900">電話予約管理</h1>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="予約を検索..." className="pl-10 w-64 bg-white/70 border-white/30 rounded-[12px]" />
            </div>
            <Button variant="ghost" size="icon" className="rounded-[12px]">
              <Filter className="w-5 h-5" />
            </Button>
            {/* デバッグ情報 */}
            <div className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded max-w-xs truncate">
              {session.user?.email || 'Unknown'} | {debugInfo}
            </div>
          </div>
        </div>

        {/* 認証エラー表示 */}
        {authError && (
          <Alert className="mb-6 bg-orange-50/80 border-orange-200/50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">認証スコープエラー</p>
                  <p className="text-sm">{authError}</p>
                </div>
                <Button 
                  onClick={handleReauth}
                  variant="outline"
                  size="sm"
                  className="ml-4"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  再認証
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: "今日の予約", count: stats.today.toString(), icon: Calendar, color: "bg-gradient-to-br from-blue-500 to-blue-600" },
            { title: "今週の予約", count: stats.thisWeek.toString(), icon: Clock, color: "bg-gradient-to-br from-green-500 to-green-600" },
            { title: "完了済み", count: stats.completed.toString(), icon: Phone, color: "bg-gradient-to-br from-purple-500 to-purple-600" },
            { title: "キャンセル", count: stats.cancelled.toString(), icon: FileText, color: "bg-gradient-to-br from-red-500 to-red-600" },
          ].map((stat, index) => (
            <Card
              key={index}
              className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]"
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className={cn("w-10 h-10 rounded-[12px] flex items-center justify-center", stat.color)}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{stat.count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mx-auto">
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <CalendarDays className="w-4 h-4" />
              <span>カレンダー表示</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>リスト表示</span>
            </TabsTrigger>
          </TabsList>

          {/* カレンダービュー */}
          <TabsContent value="calendar">
            {authError ? (
              <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px] p-8">
                <div className="text-center">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                  <h3 className="text-lg font-semibold mb-2">Google Calendar 連携が必要です</h3>
                  <p className="text-slate-600 mb-4">再認証してCalendar APIへのアクセス権限を取得してください。</p>
                  <Button onClick={handleReauth}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    再認証する
                  </Button>
                </div>
              </Card>
            ) : (
              <CalendarView
                onEventCreate={handleCreateReservation}
                onEventUpdate={handleUpdateReservation}
                onEventDelete={handleDeleteReservation}
              />
            )}
          </TabsContent>

          {/* リストビュー */}
          <TabsContent value="list" className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex items-center space-x-2">
              {[
                { id: "all", label: "すべて", count: callData.length },
                { id: CallStatus.SCHEDULED, label: "予約済み", count: callData.filter((c) => c.status === CallStatus.SCHEDULED).length },
                { id: CallStatus.COMPLETED, label: "完了", count: callData.filter((c) => c.status === CallStatus.COMPLETED).length },
                { id: CallStatus.CANCELLED, label: "キャンセル", count: callData.filter((c) => c.status === CallStatus.CANCELLED).length },
              ].map((filter) => (
                <Button
                  key={filter.id}
                  variant={selectedFilter === filter.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter.id)}
                  className={cn("rounded-[12px]", selectedFilter === filter.id && "bg-[#2D8EFF] hover:bg-[#2D8EFF]/90")}
                >
                  {filter.label} ({filter.count})
                </Button>
              ))}
            </div>

            {/* Call List */}
            <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-2 text-slate-600">読み込み中...</p>
                  </div>
                ) : authError ? (
                  <div className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
                    <p className="text-slate-600 mb-4">Google Calendar連携のエラーが発生しています</p>
                    <Button onClick={handleReauth} variant="outline">
                      再認証する
                    </Button>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="p-8 text-center">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                    <p className="text-slate-600">予約がありません</p>
                  </div>
                ) : (
                  filteredData.map((call, index) => (
                    <div
                      key={call.id}
                      className={cn(
                        "p-6 transition-all duration-150 ease-out hover:bg-white/30",
                        index !== filteredData.length - 1 && "border-b border-white/20",
                      )}
                    >
                      <div className="flex items-start justify-between">
                        {/* Main Content */}
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{call.customerName}</h3>
                              <p className="text-sm text-slate-600">{call.customerPhone}</p>
                            </div>
                            <Badge
                              variant={
                                call.status === CallStatus.SCHEDULED ? "default" : 
                                call.status === CallStatus.COMPLETED ? "secondary" : "destructive"
                              }
                              className="rounded-full"
                            >
                              {call.status}
                            </Badge>
                            <Badge variant="outline" className="rounded-full">
                              優先度: {call.priority}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <FileText className="w-4 h-4" />
                              <span>{call.subject}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(call.startDateTime).toLocaleDateString('ja-JP')}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-slate-600">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(call.startDateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                -
                                {new Date(call.endDateTime).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>

                          {call.notes && (
                            <div className="bg-slate-50/50 rounded-[12px] p-3 mb-3">
                              <p className="text-sm text-slate-700">{call.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="ghost" size="sm" className="rounded-[12px]">
                            編集
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-[12px]">
                            <Phone className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
