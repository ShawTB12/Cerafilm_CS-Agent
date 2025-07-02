"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Filter, Send, Sparkles, RefreshCw, ImageIcon, Smile, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const lineData = [
  {
    id: 1,
    name: "田中 太郎",
    userId: "@tanaka_taro",
    lastMessage: "商品の使い方がわからないので教えてください",
    time: "10:30",
    status: "未対応",
    priority: "高",
    unread: 2,
  },
  {
    id: 2,
    name: "佐藤 花子",
    userId: "@sato_hanako",
    lastMessage: "ありがとうございました！",
    time: "09:15",
    status: "完了",
    priority: "中",
    unread: 0,
  },
  {
    id: 3,
    name: "山田 次郎",
    userId: "@yamada_jiro",
    lastMessage: "配送はいつ頃になりますか？",
    time: "昨日",
    status: "対応中",
    priority: "中",
    unread: 1,
  },
]

const chatMessages = [
  {
    id: 1,
    sender: "user",
    message: "こんにちは",
    time: "10:25",
  },
  {
    id: 2,
    sender: "user",
    message: "商品の使い方がわからないので教えてください",
    time: "10:26",
  },
  {
    id: 3,
    sender: "user",
    message: "特に設定方法がよくわかりません",
    time: "10:27",
  },
]

export default function LinePage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [message, setMessage] = useState("")

  const selectedChatData = selectedChat ? lineData.find((l) => l.id === selectedChat) : null

  if (selectedChat && selectedChatData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 via-transparent to-slate-500/3" />

        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setSelectedChat(null)} className="rounded-[12px]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">{selectedChatData.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-[28px] font-semibold text-slate-900">{selectedChatData.name}</h1>
                <p className="text-sm text-slate-600">{selectedChatData.userId}</p>
              </div>
            </div>
            <Badge
              variant={
                selectedChatData.status === "未対応"
                  ? "destructive"
                  : selectedChatData.status === "対応中"
                    ? "default"
                    : "secondary"
              }
              className="rounded-full ml-auto"
            >
              {selectedChatData.status}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Chat Messages */}
            <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px] h-[600px] flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="border-b border-white/20 pb-4 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">今日 10:25</span>
                    <Button variant="ghost" size="sm" className="rounded-[12px]">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.sender === "user" ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-[16px] text-sm",
                          msg.sender === "user" ? "bg-white/70 text-slate-700" : "bg-[#2D8EFF] text-white",
                        )}
                      >
                        <p>{msg.message}</p>
                        <span
                          className={cn(
                            "text-xs mt-1 block",
                            msg.sender === "user" ? "text-slate-500" : "text-blue-100",
                          )}
                        >
                          {msg.time}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="border-t border-white/20 pt-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="rounded-[12px]">
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-[12px]">
                      <Smile className="w-5 h-5" />
                    </Button>
                    <Input
                      placeholder="メッセージを入力..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 bg-white/70 border-white/30 rounded-[12px]"
                    />
                    <Button className="bg-[#3DDC97] hover:bg-[#3DDC97]/90 rounded-[12px]">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right: AI Response Panel */}
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

                  <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-[12px] p-4 mb-4">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      田中様、お問い合わせありがとうございます！
                      <br />
                      <br />
                      商品の設定方法について、以下の手順でご案内いたします：
                      <br />
                      <br />
                      1. 電源ボタンを長押しして起動
                      <br />
                      2. 初期設定画面で言語を選択
                      <br />
                      3. Wi-Fi設定を行う
                      <br />
                      4. アカウント登録を完了
                      <br />
                      <br />
                      詳しい設定ガイドのリンクもお送りしますね📱
                      <br />
                      他にご不明な点がございましたら、お気軽にお声かけください！
                    </p>
                  </div>

                  <Button
                    className="w-full bg-[#2D8EFF] hover:bg-[#2D8EFF]/90 rounded-[12px]"
                    onClick={() => setMessage("田中様、お問い合わせありがとうございます！")}
                  >
                    この回答を使用
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Replies */}
              <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">クイック返信</h3>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "ありがとうございます",
                      "確認いたします",
                      "少々お待ちください",
                      "申し訳ございません",
                      "承知いたしました",
                      "お疲れ様です",
                    ].map((reply, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="rounded-[12px] text-xs bg-transparent"
                        onClick={() => setMessage(reply)}
                      >
                        {reply}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">顧客情報</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">購入履歴</span>
                      <span className="text-slate-900">3件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">最終購入</span>
                      <span className="text-slate-900">2024/01/15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">問い合わせ履歴</span>
                      <span className="text-slate-900">2件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">満足度</span>
                      <span className="text-[#3DDC97] font-medium">4.5/5</span>
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
          <h1 className="text-[28px] font-semibold text-slate-900">LINE管理</h1>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="チャットを検索..."
                className="pl-10 w-64 bg-white/70 border-white/30 rounded-[12px]"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-[12px]">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
          <CardContent className="p-0">
            {lineData.map((chat, index) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={cn(
                  "flex items-center space-x-4 p-6 cursor-pointer transition-all duration-150 ease-out hover:bg-white/30",
                  index !== lineData.length - 1 && "border-b border-white/20",
                )}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{chat.name.charAt(0)}</span>
                  </div>
                  {chat.unread > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF7A7A] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{chat.unread}</span>
                    </div>
                  )}
                </div>

                {/* Chat Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-medium text-slate-900">{chat.name}</span>
                    <span className="text-sm text-slate-500">{chat.userId}</span>
                    <Badge
                      variant={
                        chat.status === "未対応" ? "destructive" : chat.status === "対応中" ? "default" : "secondary"
                      }
                      className="text-xs rounded-full"
                    >
                      {chat.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 truncate">{chat.lastMessage}</p>
                </div>

                {/* Time & Priority */}
                <div className="text-right">
                  <span className="text-sm text-slate-500 block">{chat.time}</span>
                  <Badge variant="outline" className="text-xs rounded-full mt-1">
                    {chat.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
