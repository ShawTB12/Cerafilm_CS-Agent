"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Search,
  Filter,
  Star,
  Archive,
  Reply,
  Forward,
  MoreHorizontal,
  Paperclip,
  Send,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

const mailData = [
  {
    id: 1,
    sender: "田中 太郎",
    email: "tanaka@example.com",
    subject: "商品の返品について",
    preview: "先日購入した商品について、返品の手続きを教えてください...",
    time: "10:30",
    status: "未対応",
    priority: "高",
    starred: true,
  },
  {
    id: 2,
    sender: "佐藤 花子",
    email: "sato@example.com",
    subject: "配送日程の変更希望",
    preview: "注文した商品の配送日程を変更したいのですが...",
    time: "09:15",
    status: "対応中",
    priority: "中",
    starred: false,
  },
  {
    id: 3,
    sender: "山田 次郎",
    email: "yamada@example.com",
    subject: "製品の使用方法について",
    preview: "購入した製品の使用方法がわからないので教えてください...",
    time: "昨日",
    status: "完了",
    priority: "低",
    starred: false,
  },
]

export default function MailPage() {
  const [selectedMail, setSelectedMail] = useState<number | null>(null)
  const [aiResponse, setAiResponse] = useState("")
  const [manualResponse, setManualResponse] = useState("")

  const selectedMailData = selectedMail ? mailData.find((m) => m.id === selectedMail) : null

  if (selectedMail && selectedMailData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-slate-500/3" />

        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setSelectedMail(null)} className="rounded-[12px]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-[28px] font-semibold text-slate-900">メール詳細</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Email Content */}
            <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
              <CardContent className="p-6">
                {/* Email Header */}
                <div className="border-b border-white/20 pb-4 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{selectedMailData.subject}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        {selectedMailData.sender} &lt;{selectedMailData.email}&gt;
                      </p>
                    </div>
                    <Badge
                      variant={
                        selectedMailData.status === "未対応"
                          ? "destructive"
                          : selectedMailData.status === "対応中"
                            ? "default"
                            : "secondary"
                      }
                      className="rounded-full"
                    >
                      {selectedMailData.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-slate-500">
                    <span>{selectedMailData.time}</span>
                    <Badge variant="outline" className="rounded-full">
                      優先度: {selectedMailData.priority}
                    </Badge>
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-4">
                  <p className="text-slate-700 leading-relaxed">
                    いつもお世話になっております。
                    <br />
                    田中と申します。
                    <br />
                    <br />
                    先日御社で購入させていただいた商品（注文番号: #CF-2024-001）について、
                    返品の手続きをお教えいただけますでしょうか。
                    <br />
                    <br />
                    商品に不具合があり、使用することができない状態です。
                    お忙しい中恐れ入りますが、ご対応のほどよろしくお願いいたします。
                    <br />
                    <br />
                    田中 太郎
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2 mt-6 pt-4 border-t border-white/20">
                  <Button variant="ghost" size="sm" className="rounded-[12px]">
                    <Reply className="w-4 h-4 mr-2" />
                    返信
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-[12px]">
                    <Forward className="w-4 h-4 mr-2" />
                    転送
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-[12px]">
                    <Archive className="w-4 h-4 mr-2" />
                    アーカイブ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right: Response Panel */}
            <div className="space-y-6">
              {/* AI Response */}
              <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#2D8EFF]" />
                    <h3 className="font-semibold text-slate-900">AI回答支援</h3>
                    <Button variant="ghost" size="sm" className="ml-auto rounded-[12px]">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-[12px] p-4 mb-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      田中様
                      <br />
                      <br />
                      この度は弊社商品をご購入いただき、ありがとうございます。
                      <br />
                      また、商品の不具合によりご迷惑をおかけし、誠に申し訳ございません。
                      <br />
                      <br />
                      返品につきまして、以下の手順でお手続きください：
                      <br />
                      1. 返品申請フォームにご記入
                      <br />
                      2. 商品を元の梱包材で梱包
                      <br />
                      3. 着払いにて弊社まで発送
                      <br />
                      <br />
                      返品申請フォームのURLを別途お送りいたします。
                      <br />
                      ご不明な点がございましたら、お気軽にお問い合わせください。
                    </p>
                  </div>

                  <Button
                    className="w-full bg-[#2D8EFF] hover:bg-[#2D8EFF]/90 rounded-[12px]"
                    onClick={() => setManualResponse(aiResponse)}
                  >
                    この回答を使用
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Response */}
              <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">返信作成</h3>

                  <div className="space-y-4">
                    <Input
                      placeholder="件名: Re: 商品の返品について"
                      className="bg-white/70 border-white/30 rounded-[12px]"
                    />

                    <Textarea
                      placeholder="返信内容を入力してください..."
                      value={manualResponse}
                      onChange={(e) => setManualResponse(e.target.value)}
                      className="min-h-[200px] bg-white/70 border-white/30 rounded-[12px] resize-none"
                    />

                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" className="rounded-[12px]">
                        <Paperclip className="w-4 h-4 mr-2" />
                        添付
                      </Button>

                      <Button className="bg-[#3DDC97] hover:bg-[#3DDC97]/90 rounded-[12px]">
                        <Send className="w-4 h-4 mr-2" />
                        送信
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-slate-500/3" />

      <div className="relative p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[28px] font-semibold text-slate-900">メール管理</h1>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input placeholder="メールを検索..." className="pl-10 w-64 bg-white/70 border-white/30 rounded-[12px]" />
            </div>
            <Button variant="ghost" size="icon" className="rounded-[12px]">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mail List */}
        <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
          <CardContent className="p-0">
            {mailData.map((mail, index) => (
              <div
                key={mail.id}
                onClick={() => setSelectedMail(mail.id)}
                className={cn(
                  "flex items-center space-x-4 p-6 cursor-pointer transition-all duration-150 ease-out hover:bg-white/30",
                  index !== mailData.length - 1 && "border-b border-white/20",
                )}
              >
                {/* Status Indicator */}
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    mail.status === "未対応"
                      ? "bg-[#FF7A7A]"
                      : mail.status === "対応中"
                        ? "bg-[#2D8EFF]"
                        : "bg-[#3DDC97]",
                  )}
                />

                {/* Star */}
                <Button variant="ghost" size="icon" className="w-8 h-8">
                  <Star
                    className={cn("w-4 h-4", mail.starred ? "fill-yellow-400 text-yellow-400" : "text-slate-400")}
                  />
                </Button>

                {/* Mail Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-medium text-slate-900 truncate">{mail.sender}</span>
                    <Badge
                      variant={
                        mail.status === "未対応" ? "destructive" : mail.status === "対応中" ? "default" : "secondary"
                      }
                      className="text-xs rounded-full"
                    >
                      {mail.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs rounded-full">
                      {mail.priority}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-slate-800 truncate mb-1">{mail.subject}</h4>
                  <p className="text-sm text-slate-600 truncate">{mail.preview}</p>
                </div>

                {/* Time & Actions */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500">{mail.time}</span>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
