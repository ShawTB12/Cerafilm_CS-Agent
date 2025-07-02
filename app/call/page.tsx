"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Phone, Calendar, Clock, User, FileText, MoreHorizontal, PhoneCall, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

const callData = [
  {
    id: 1,
    customerName: "田中 太郎",
    phone: "090-1234-5678",
    subject: "商品の詳細説明希望",
    date: "2024/01/20",
    time: "14:00-14:30",
    status: "予約済み",
    priority: "高",
    notes: "新商品について詳しく聞きたいとのこと",
  },
  {
    id: 2,
    customerName: "佐藤 花子",
    phone: "080-9876-5432",
    subject: "返品・交換について",
    date: "2024/01/20",
    time: "15:00-15:30",
    status: "完了",
    priority: "中",
    notes: "商品の返品手続きについて説明済み",
  },
  {
    id: 3,
    customerName: "山田 次郎",
    phone: "070-1111-2222",
    subject: "配送に関する相談",
    date: "2024/01/21",
    time: "10:00-10:30",
    status: "予約済み",
    priority: "低",
    notes: "配送日程の調整希望",
  },
  {
    id: 4,
    customerName: "鈴木 美咲",
    phone: "090-3333-4444",
    subject: "製品の使用方法",
    date: "2024/01/21",
    time: "11:00-11:30",
    status: "キャンセル",
    priority: "中",
    notes: "お客様都合によりキャンセル",
  },
]

export default function CallPage() {
  const [selectedFilter, setSelectedFilter] = useState("all")

  const filteredData = callData.filter((call) => {
    if (selectedFilter === "all") return true
    return call.status === selectedFilter
  })

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
            <Button className="bg-[#2D8EFF] hover:bg-[#2D8EFF]/90 rounded-[12px]">
              <Phone className="w-4 h-4 mr-2" />
              新規予約
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 mb-6">
          {[
            { id: "all", label: "すべて", count: callData.length },
            { id: "予約済み", label: "予約済み", count: callData.filter((c) => c.status === "予約済み").length },
            { id: "完了", label: "完了", count: callData.filter((c) => c.status === "完了").length },
            { id: "キャンセル", label: "キャンセル", count: callData.filter((c) => c.status === "キャンセル").length },
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { title: "今日の予約", count: "3", icon: Calendar, color: "bg-gradient-to-br from-blue-500 to-blue-600" },
            { title: "今週の予約", count: "12", icon: Clock, color: "bg-gradient-to-br from-green-500 to-green-600" },
            {
              title: "完了済み",
              count: "8",
              icon: PhoneCall,
              color: "bg-gradient-to-br from-purple-500 to-purple-600",
            },
            { title: "キャンセル", count: "2", icon: FileText, color: "bg-gradient-to-br from-red-500 to-red-600" },
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

        {/* Call List */}
        <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
          <CardContent className="p-0">
            {filteredData.map((call, index) => (
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
                        <p className="text-sm text-slate-600">{call.phone}</p>
                      </div>
                      <Badge
                        variant={
                          call.status === "予約済み" ? "default" : call.status === "完了" ? "secondary" : "destructive"
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
                        <span>{call.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4" />
                        <span>{call.time}</span>
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
                    <Button variant="ghost" size="icon" className="rounded-[12px]">
                      <PhoneCall className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-[12px]">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-[12px]">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
