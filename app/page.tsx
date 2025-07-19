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
    icon: Mail,
    id: "mail",
    priority: "high",
  },
  {
    title: "LINE未対応",
    count: 8,
    trend: "+1",
    icon: MessageCircle,
    id: "line",
    priority: "medium",
  },
  {
    title: "電話予約",
    count: 5,
    trend: "0",
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
      <div className="min-h-screen luxury-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // 未認証状態
  if (!session) {
    return (
      <div className="min-h-screen luxury-bg flex items-center justify-center">
        <div className="luxury-card p-8">
          <div className="text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold mb-2 text-slate-900">ログインが必要です</h2>
            <p className="text-slate-600 mb-4">ダッシュボードにアクセスするには、Googleアカウントでログインしてください。</p>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="luxury-button-primary"
            >
              ログイン
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen luxury-bg relative">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148,163,184,0.05) 1px, transparent 0)`,
        backgroundSize: '20px 20px'
      }} />

      <div className="flex relative z-10">
        {/* Sidebar */}
        <div className="w-64 h-screen liquid-glass-sidebar relative">
          {/* Logo */}
          <div className="p-6 liquid-glass-logo-bg">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center luxury-icon-bg overflow-hidden">
                <Image
                  src="/vall_logo.png"
                  alt="LLAVIA Logo"
                  width={36}
                  height={36}
                  className="object-contain opacity-90"
                />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 text-lg">LLAVIA</h2>
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
                  "w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium liquid-glass-nav-item",
                  activeItem === item.id
                    ? "liquid-glass-nav-item active"
                    : "text-slate-700 hover:text-slate-900",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 relative">
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px]" />
          {/* Enhanced Header */}
          <div className="mb-8 relative z-10">
            {/* Top Header with Live Stats */}
            <div className="flex items-center justify-between mb-6 liquid-glass-header p-6">
              <div className="flex items-center space-x-6">
                <div>
                  <h1 className="text-[32px] font-black text-slate-900 mb-1 tracking-tight">LLAVIA ダッシュボード</h1>
                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{formatDate(currentTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-mono font-medium">{formatTime(currentTime)}</span>
                    </div>
                  </div>
                </div>


              </div>

              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative hover:bg-slate-100/60">
                  <Bell className="w-5 h-5 text-slate-600" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    3
                  </span>
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100/60">
                  <Search className="w-5 h-5 text-slate-600" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-slate-100/60">
                  <User className="w-5 h-5 text-slate-600" />
                </Button>
              </div>
            </div>


          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 relative z-10">
            {kpiData.map((kpi) => (
              <Card
                key={kpi.id}
                className="liquid-glass-kpi cursor-pointer group relative overflow-hidden"
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
                    <div className="w-12 h-12 rounded-[12px] flex items-center justify-center liquid-glass-icon-bg">
                      <kpi.icon className="w-6 h-6 text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-800 transition-colors" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">{kpi.title}</p>
                    <div className="flex items-end space-x-2">
                      <span className="text-3xl font-bold text-slate-900">{kpi.count}</span>
                      <span
                        className={cn(
                          "text-sm font-medium px-2 py-1 rounded-full",
                          kpi.trend.startsWith("+") 
                            ? "luxury-badge warning" 
                            : "luxury-badge",
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {/* Recent Activity */}
            <Card className="liquid-glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-slate-900">
                  <Clock className="w-5 h-5 text-slate-700" />
                  <span>最近のアクティビティ</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { type: "mail", message: "新しいメールが3件届きました", time: "5分前" },
                  { type: "line", message: "LINE問い合わせに返信しました", time: "15分前" },
                  { type: "call", message: "電話予約が1件追加されました", time: "30分前" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 liquid-glass-activity-item">
                    <div className="w-3 h-3 bg-slate-600 rounded-full shadow-sm" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                      <p className="text-xs text-slate-600 font-medium">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="liquid-glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2 text-slate-900">
                  <TrendingUp className="w-5 h-5 text-slate-700" />
                  <span>今日のパフォーマンス</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 liquid-glass-stat-item">
                  <span className="text-sm font-medium text-slate-700">対応完了率</span>
                  <span className="text-lg font-bold text-slate-900">87%</span>
                </div>
                <div className="flex items-center justify-between p-4 liquid-glass-stat-item">
                  <span className="text-sm font-medium text-slate-700">平均対応時間</span>
                  <span className="text-lg font-bold text-slate-900">12分</span>
                </div>
                <div className="flex items-center justify-between p-4 liquid-glass-stat-item">
                  <span className="text-sm font-medium text-slate-700">顧客満足度</span>
                  <span className="text-lg font-bold text-slate-900">4.8/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
