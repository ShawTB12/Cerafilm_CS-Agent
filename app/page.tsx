"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarItems = [
  { icon: Home, label: "HOME", id: "home", active: true },
  { icon: BarChart3, label: "DASHBOARD", id: "dashboard" },
  { icon: Mail, label: "MAIL", id: "mail" },
  { icon: MessageCircle, label: "LINE", id: "line" },
  { icon: Phone, label: "CALL", id: "call" },
  { icon: Database, label: "DATABASE", id: "database" },
  { icon: Settings, label: "SETTING", id: "setting" },
]

const kpiData = [
  {
    title: "メール未対応",
    count: 12,
    trend: "+3",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: Mail,
    id: "mail",
  },
  {
    title: "LINE未対応",
    count: 8,
    trend: "+1",
    color: "bg-gradient-to-br from-green-500 to-green-600",
    icon: MessageCircle,
    id: "line",
  },
  {
    title: "電話予約",
    count: 5,
    trend: "0",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
    icon: Phone,
    id: "call",
  },
]

export default function HomePage() {
  const [activeItem, setActiveItem] = useState("home")

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Background Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-slate-500/3" />

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 h-screen bg-white/55 backdrop-blur-[24px] border-r border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
          {/* Logo */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[12px] flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Cerafilm CS</h2>
                <p className="text-xs text-slate-500">v2.1.0</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveItem(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-4 py-3 rounded-[12px] text-sm font-medium transition-all duration-150 ease-out",
                  activeItem === item.id
                    ? "bg-[#2D8EFF]/10 text-[#2D8EFF] shadow-[0_2px_8px_rgba(45,142,255,0.15)]"
                    : "text-slate-600 hover:bg-white/50 hover:text-slate-900",
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-[28px] font-semibold text-slate-900 mb-2">おはようございます 👋</h1>
              <p className="text-slate-600">今日も素晴らしい一日にしましょう</p>
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

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {kpiData.map((kpi) => (
              <Card
                key={kpi.id}
                className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px] hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)] transition-all duration-220 ease-out hover:scale-[1.02] cursor-pointer group"
                onClick={() => setActiveItem(kpi.id)}
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
            <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
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
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/30 rounded-[12px]">
                    <div className="w-2 h-2 bg-[#3DDC97] rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm text-slate-700">{activity.message}</p>
                      <p className="text-xs text-slate-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-[#3DDC97]" />
                  <span>今日のパフォーマンス</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-[12px]">
                  <span className="text-sm text-slate-600">対応完了率</span>
                  <span className="text-lg font-semibold text-[#3DDC97]">87%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-[12px]">
                  <span className="text-sm text-slate-600">平均対応時間</span>
                  <span className="text-lg font-semibold text-slate-900">12分</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/30 rounded-[12px]">
                  <span className="text-sm text-slate-600">顧客満足度</span>
                  <span className="text-lg font-semibold text-[#2D8EFF]">4.8/5</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
