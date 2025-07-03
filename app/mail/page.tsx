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
  Mail,
  Clock,
  User,
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
    unread: true,
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
    unread: true,
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
    unread: false,
  },
  {
    id: 4,
    sender: "鈴木 美香",
    email: "suzuki@example.com",
    subject: "キャンセル手続きについて",
    preview: "予約をキャンセルしたいのですが、手続き方法を教えてください...",
    time: "昨日",
    status: "未対応",
    priority: "中",
    starred: true,
    unread: true,
  },
  {
    id: 5,
    sender: "高橋 健一",
    email: "takahashi@example.com",
    subject: "お問い合わせ - 価格について",
    preview: "貴社の製品の価格についてお聞きしたいことがあります...",
    time: "2日前",
    status: "完了",
    priority: "低",
    starred: false,
    unread: false,
  },
]

export default function MailPage() {
  const [selectedMail, setSelectedMail] = useState<number | null>(null)
  const [aiResponse, setAiResponse] = useState("")
  const [manualResponse, setManualResponse] = useState("")

  const selectedMailData = selectedMail ? mailData.find((m) => m.id === selectedMail) : null

  if (selectedMail && selectedMailData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-cyan-500/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]" />

        <div className="relative p-8 z-10">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSelectedMail(null)} 
              className="rounded-[16px] bg-white/50 backdrop-blur-[16px] border border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-white/70 hover:scale-105 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-[32px] font-black text-black">メール詳細</h1>
            <div className="flex items-center space-x-2 ml-auto">
              <Badge className="bg-blue-100/80 text-blue-800 border-blue-200/50 shadow-[0_2px_8px_rgba(59,130,246,0.15)] backdrop-blur-sm">
                <Mail className="w-3 h-3 mr-1" />
                ID: {selectedMailData.id}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Email Content */}
            <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-300">
              <CardContent className="p-8">
                {/* Email Header */}
                <div className="border-b border-white/30 pb-6 mb-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-3">{selectedMailData.subject}</h3>
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{selectedMailData.sender}</p>
                          <p className="text-sm text-slate-600">{selectedMailData.email}</p>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={
                        selectedMailData.status === "未対応"
                          ? "destructive"
                          : selectedMailData.status === "対応中"
                            ? "default"
                            : "secondary"
                      }
                      className="rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur-sm"
                    >
                      {selectedMailData.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{selectedMailData.time}</span>
                    </div>
                    <Badge variant="outline" className="rounded-full bg-white/50 backdrop-blur-sm border-white/40">
                      優先度: {selectedMailData.priority}
                    </Badge>
                    {selectedMailData.starred && (
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                </div>

                {/* Email Body */}
                <div className="space-y-6">
                  <div className="bg-white/50 backdrop-blur-[16px] rounded-[18px] p-6 border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
                    <p className="text-slate-700 leading-relaxed text-[15px]">
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
                      添付の写真をご確認いただけますでしょうか。
                      <br />
                      <br />
                      お忙しい中恐れ入りますが、ご対応のほどよろしくお願いいたします。
                      <br />
                      <br />
                      田中 太郎
                      <br />
                      tanaka@example.com
                      <br />
                      090-1234-5678
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-8 pt-6 border-t border-white/30">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-[14px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200"
                  >
                    <Reply className="w-4 h-4 mr-2" />
                    返信
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-[14px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200"
                  >
                    <Forward className="w-4 h-4 mr-2" />
                    転送
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="rounded-[14px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    アーカイブ
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Right: Response Panel */}
            <div className="space-y-6">
              {/* AI Response */}
              <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-300">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-[12px] flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">AI回答支援</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto rounded-[12px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-[16px] rounded-[16px] p-6 mb-6 border border-blue-200/50 shadow-[0_4px_16px_rgba(59,130,246,0.1)]">
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
                      <br />
                      <strong>📝 返品手順</strong>
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
                      商品到着後、3-5営業日以内に返金処理を行います。
                      <br />
                      <br />
                      ご不明な点がございましたら、お気軽にお問い合わせください。
                      <br />
                      <br />
                      Cerafilm CS Agent
                    </p>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-[16px] shadow-[0_4px_16px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.4)] transition-all duration-200"
                    onClick={() => setManualResponse("田中様\n\nこの度は弊社商品をご購入いただき、ありがとうございます。\nまた、商品の不具合によりご迷惑をおかけし、誠に申し訳ございません。\n\n返品につきまして、以下の手順でお手続きください：\n\n📝 返品手順\n1. 返品申請フォームにご記入\n2. 商品を元の梱包材で梱包\n3. 着払いにて弊社まで発送\n\n返品申請フォームのURLを別途お送りいたします。\n商品到着後、3-5営業日以内に返金処理を行います。\n\nご不明な点がございましたら、お気軽にお問い合わせください。\n\nCerafilm CS Agent")}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    この回答を使用
                  </Button>
                </CardContent>
              </Card>

              {/* Manual Response */}
              <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-300">
                <CardContent className="p-8">
                  <h3 className="font-bold text-slate-900 mb-6 text-lg">返信作成</h3>

                  <div className="space-y-6">
                    <Input
                      placeholder="件名: Re: 商品の返品について"
                      className="bg-white/50 backdrop-blur-[16px] border-white/40 rounded-[16px] focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />

                    <Textarea
                      placeholder="返信内容を入力してください..."
                      value={manualResponse}
                      onChange={(e) => setManualResponse(e.target.value)}
                      className="min-h-[220px] bg-white/50 backdrop-blur-[16px] border-white/40 rounded-[16px] resize-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    />

                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="rounded-[14px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200"
                      >
                        <Paperclip className="w-4 h-4 mr-2" />
                        添付
                      </Button>

                      <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-[16px] shadow-[0_4px_16px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.4)] transition-all duration-200">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/3 to-cyan-500/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent_50%)]" />

      <div className="relative p-8 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[32px] font-black text-black mb-2">メール管理</h1>
            <p className="text-slate-600">カスタマーサポートメールの一覧と管理</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="メールを検索..." 
                className="pl-12 w-80 bg-white/60 backdrop-blur-[20px] border-white/40 rounded-[16px] shadow-[0_4px_16px_rgba(0,0,0,0.08)] focus:ring-2 focus:ring-blue-500/20 transition-all duration-200" 
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-[14px] bg-white/50 backdrop-blur-[16px] border border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-white/70 hover:scale-105 transition-all duration-200"
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-white/60 backdrop-blur-[20px] border border-white/40 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">未対応: {mailData.filter(m => m.status === "未対応").length}件</span>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-[20px] border border-white/40 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">対応中: {mailData.filter(m => m.status === "対応中").length}件</span>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-[20px] border border-white/40 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-slate-700">完了: {mailData.filter(m => m.status === "完了").length}件</span>
            </div>
          </div>
        </div>

        {/* Mail List */}
        <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px]">
          <CardContent className="p-0">
            {mailData.map((mail, index) => (
              <div
                key={mail.id}
                onClick={() => setSelectedMail(mail.id)}
                className={cn(
                  "flex items-center space-x-6 p-6 cursor-pointer transition-all duration-200 ease-out hover:bg-white/50 hover:scale-[1.01] group",
                  index !== mailData.length - 1 && "border-b border-white/30",
                  mail.unread && "bg-blue-50/30"
                )}
              >
                {/* Status Indicator */}
                <div className="flex items-center space-x-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.2)]",
                      mail.status === "未対応"
                        ? "bg-gradient-to-br from-red-400 to-red-500"
                        : mail.status === "対応中"
                          ? "bg-gradient-to-br from-blue-400 to-blue-500"
                          : "bg-gradient-to-br from-green-400 to-green-500",
                    )}
                  />
                  
                  {/* Star */}
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-[10px] hover:bg-white/50 transition-all duration-200">
                    <Star
                      className={cn(
                        "w-4 h-4 transition-all duration-200",
                        mail.starred ? "fill-yellow-400 text-yellow-400" : "text-slate-400 group-hover:text-slate-600"
                      )}
                    />
                  </Button>
                </div>

                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)]">
                  <span className="text-white font-bold text-sm">{mail.sender.charAt(0)}</span>
                </div>

                {/* Mail Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={cn(
                      "font-semibold truncate transition-colors duration-200",
                      mail.unread ? "text-slate-900" : "text-slate-700"
                    )}>{mail.sender}</span>
                    <Badge
                      variant={
                        mail.status === "未対応" ? "destructive" : mail.status === "対応中" ? "default" : "secondary"
                      }
                      className="text-xs rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1)] backdrop-blur-sm"
                    >
                      {mail.status}
                    </Badge>
                    <Badge variant="outline" className="text-xs rounded-full bg-white/50 backdrop-blur-sm border-white/40">
                      {mail.priority}
                    </Badge>
                    {mail.unread && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <h4 className={cn(
                    "font-medium truncate mb-1 transition-colors duration-200",
                    mail.unread ? "text-slate-900" : "text-slate-700"
                  )}>{mail.subject}</h4>
                  <p className="text-sm text-slate-600 truncate">{mail.preview}</p>
                </div>

                {/* Time & Actions */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-sm text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{mail.time}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-[10px] opacity-0 group-hover:opacity-100 hover:bg-white/50 transition-all duration-200">
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
