"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Home,
  BarChart3,
  Mail,
  MessageCircle,
  Phone,
  Database,
  Settings,
  Bell,
  Search,
  User,
  ChevronRight,
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  AlertCircle,
  CheckCircle2,
  Timer,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { icon: Home, label: "HOME", id: "home", route: "/", active: true },
  { icon: BarChart3, label: "DASHBOARD", id: "dashboard", route: "/" },
  { icon: Mail, label: "MAIL", id: "mail", route: "/mail" },
  { icon: MessageCircle, label: "LINE", id: "line", route: "/line" },
  { icon: Phone, label: "CALL", id: "call", route: "/call" },
  { icon: Database, label: "DATABASE", id: "database", route: "/database" },
  { icon: Settings, label: "SETTING", id: "setting", route: "/settings" },
]

const kpiData = [
  {
    title: "メール未対応",
    count: 12,
    trend: "+3",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: Mail,
    id: "mail",
    priority: "high",
  },
  {
    title: "LINE未対応",
    count: 8,
    trend: "+1",
    color: "bg-gradient-to-br from-green-500 to-green-600",
    icon: MessageCircle,
    id: "line",
    priority: "medium",
  },
  {
    title: "電話予約",
    count: 5,
    trend: "0",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    icon: Phone,
    id: "call",
    priority: "low",
  },
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeItem, setActiveItem] = useState("home")
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date | null) => {
    if (!date || !mounted) return "--:--:--"
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date | null) => {
    if (!date || !mounted) return "読み込み中..."
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    })
  }

  // ローディング状態
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
        <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px] p-8">
          <div className="text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold mb-2">ログインが必要です</h2>
            <p className="text-slate-600 mb-4">ダッシュボードにアクセスするには、Googleアカウントでログインしてください。</p>
            <Button onClick={() => window.location.href = '/login'}>
              ログイン
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-cyan-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]" />

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 h-screen bg-white/70 backdrop-blur-[32px] border-r border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.12)] relative z-10">
          {/* Logo */}
          <div className="p-6 border-b border-white/30">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-[16px] flex items-center justify-center shadow-[0_8px_16px_rgba(59,130,246,0.25)] overflow-hidden bg-white/10 backdrop-blur-sm">
                <Image
                  src="/vall_logo.png"
                  alt="Cerafilm CS Agent Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
                             <div>
                 <h2 className="font-bold text-slate-900">Cerafilm CS Agent</h2>
                 <p className="text-xs text-slate-500 font-medium">v2.1.0</p>
               </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveItem(item.id)
                  if (item.route !== "/") {
                    router.push(item.route)
                  }
                }}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-[14px] text-sm font-medium transition-all duration-200 ease-out backdrop-blur-sm",
                  activeItem === item.id
                    ? "bg-gradient-to-r from-blue-500/15 to-blue-600/10 text-[#2D8EFF] shadow-[0_4px_16px_rgba(45,142,255,0.2)] border border-blue-500/20"
                    : "text-slate-600 hover:bg-white/60 hover:text-slate-900 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:scale-[1.02]",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 relative z-5">
          {/* Enhanced Header */}
          <div className="mb-8">
            {/* Top Header with Live Stats */}
            <div className="flex items-center justify-between mb-6 bg-white/50 backdrop-blur-[24px] rounded-[20px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/40">
              <div className="flex items-center space-x-6">
                                                  <div>
                   <h1 className="text-[32px] font-black text-black mb-1 relative z-10 drop-shadow-sm">CS Agent Dashboard</h1>
                   <div className="flex items-center space-x-4 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(currentTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono">{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="bg-green-100/80 text-green-800 border-green-200/50 shadow-[0_2px_8px_rgba(34,197,94,0.15)] backdrop-blur-sm">
                    <Activity className="w-3 h-3 mr-1" />
                    システム正常
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-100/80 text-blue-800 border-blue-200/50 shadow-[0_2px_8px_rgba(59,130,246,0.15)] backdrop-blur-sm">
                    <Users className="w-3 h-3 mr-1" />
                    スタッフ: 12名 稼働中
                  </Badge>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF7A7A] rounded-full text-[10px] text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
                <Button variant="ghost" size="icon">
                  <Search className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Quick Action Bar */}
            <div className="flex items-center justify-between p-5 bg-white/60 backdrop-blur-[20px] border border-white/50 rounded-[18px] shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium text-slate-700">緊急対応待ち: 3件</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-slate-700">平均対応時間: 12分</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium text-slate-700">今日の完了: 47件</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all duration-200">
                  一括処理
                </Button>
                <Button size="sm" variant="outline" className="bg-white/50 backdrop-blur-[16px] border-white/40 hover:bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]">
                  レポート出力
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpiData.map((kpi) => (
              <Card
                key={kpi.id}
                className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] hover:shadow-[0_16px_48px_rgba(0,0,0,0.15)] hover:bg-white/80 transition-all duration-300 ease-out hover:scale-[1.03] hover:-translate-y-1 cursor-pointer group"
                onClick={() => {
                  setActiveItem(kpi.id)
                  const targetRoute = kpi.id === "mail" ? "/mail" : kpi.id === "line" ? "/line" : kpi.id === "call" ? "/call" : "/"
                  if (targetRoute !== "/") {
                    router.push(targetRoute)
                  }
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn("w-12 h-12 rounded-[12px] flex items-center justify-center", kpi.color)}>
                      <kpi.icon className="w-6 h-6 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                    <div className="flex items-end space-x-2">
                      <span className="text-3xl font-bold text-slate-900">{kpi.count}</span>
                      <span
                        className={cn(
                          "text-sm font-medium px-2 py-1 rounded-full",
                          kpi.trend.startsWith("+") ? "bg-[#FF7A7A]/10 text-[#FF7A7A]" : "bg-slate-100 text-slate-500",
                        )}
                      >
                        {kpi.trend}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-[#2D8EFF]" />
                  <span>最近のアクティビティ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { type: "mail", message: "新しいメールが3件届きました", time: "5分前" },
                  { type: "line", message: "LINE問い合わせに返信しました", time: "15分前" },
                  { type: "call", message: "電話予約が1件追加されました", time: "30分前" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white/50 backdrop-blur-[16px] rounded-[16px] border border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                    <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-[0_2px_4px_rgba(34,197,94,0.3)]" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">{activity.message}</p>
                      <p className="text-xs text-slate-500 font-medium">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#3DDC97]" />
                  <span>今日のパフォーマンス</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-[16px] rounded-[16px] border border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <span className="text-sm font-medium text-slate-600">対応完了率</span>
                  <span className="text-lg font-bold text-[#3DDC97]">87%</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-[16px] rounded-[16px] border border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <span className="text-sm font-medium text-slate-600">平均対応時間</span>
                  <span className="text-lg font-bold text-slate-900">12分</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-[16px] rounded-[16px] border border-white/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                  <span className="text-sm font-medium text-slate-600">顧客満足度</span>
                  <span className="text-lg font-bold text-[#2D8EFF]">4.8/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
