"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Filter, Send, Sparkles, RefreshCw, ImageIcon, Smile, MoreHorizontal, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface LineMessage {
  id: string;
  userId: string;
  displayName: string;
  text: string;
  timestamp: string;
  type: 'user' | 'bot';
  status: string;
  priority: string;
}

interface LineChat {
  id: number;
  name: string;
  userId: string;
  lastMessage: string;
  time: string;
  status: string;
  priority: string;
  unread: number;
}

export default function LinePage() {
  const { data: session, status } = useSession()
  const [selectedChat, setSelectedChat] = useState<number | null>(null)
  const [message, setMessage] = useState("")
  const [lineChats, setLineChats] = useState<LineChat[]>([])
  const [chatMessages, setChatMessages] = useState<LineMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // メッセージ履歴を取得
  const fetchMessages = async (userId?: string) => {
    try {
      const url = userId ? `/api/line/messages?userId=${userId}` : '/api/line/messages'
      console.log('Fetching messages from:', url)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // セッションクッキーを含める
      })
      
      if (!response.ok) {
        console.error('HTTP Error:', response.status, response.statusText)
        if (response.status === 401) {
          console.error('Authentication required - redirecting to login')
          window.location.href = '/login'
          return []
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Non-JSON response received:', text.substring(0, 200))
        throw new Error('Invalid response format - expected JSON')
      }
      
      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success && data.data) {
        console.log('Messages fetched successfully:', data.data.messages?.length || 0, 'messages')
        return data.data.messages || []
      } else if (data.messages) {
        // 古い形式の互換性維持
        console.log('Messages fetched successfully (legacy format):', data.messages.length, 'messages')
        return data.messages
      } else {
        console.error('Failed to fetch messages:', data.error)
        return []
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      return []
    }
  }

  // メッセージを送信
  const sendMessage = async (userId: string, text: string) => {
    try {
      setSending(true)
      const response = await fetch('/api/line/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          text,
        }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // メッセージ送信成功後、メッセージ履歴を再取得
        const updatedMessages = await fetchMessages(userId)
        setChatMessages(updatedMessages)
        setMessage("")
      } else {
        console.error('Failed to send message:', data.error)
        alert('メッセージの送信に失敗しました')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      alert('メッセージの送信中にエラーが発生しました')
    } finally {
      setSending(false)
    }
  }

  // 初期データ読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      try {
        console.log('Loading initial data...')
        const messages = await fetchMessages()
        console.log('Raw messages received:', messages)
        
        // メッセージからチャット一覧を生成
        const chatsMap = new Map<string, LineChat>()
        let chatId = 1
        
        messages.forEach((msg: LineMessage) => {
          if (msg.type === 'user' && !chatsMap.has(msg.userId)) {
            const chatData = {
              id: chatId++,
              name: msg.displayName,
              userId: msg.userId,
              lastMessage: msg.text,
              time: new Date(msg.timestamp).toLocaleTimeString('ja-JP', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              status: msg.status,
              priority: msg.priority,
              unread: messages.filter((m: LineMessage) => 
                m.userId === msg.userId && m.type === 'user'
              ).length
            }
            console.log('Adding chat:', chatData)
            chatsMap.set(msg.userId, chatData)
          }
        })
        
        const chatsList = Array.from(chatsMap.values())
        console.log('Generated chats list:', chatsList)
        
        setLineChats(chatsList)
        setChatMessages(messages)
      } catch (error) {
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()

    // 定期的にデータを更新（5秒ごと）
    const interval = setInterval(loadInitialData, 5000)
    
    return () => clearInterval(interval)
  }, [])

  // 選択されたチャットのメッセージを取得
  useEffect(() => {
    if (selectedChat) {
      const selectedChatData = lineChats.find(chat => chat.id === selectedChat)
      if (selectedChatData) {
        fetchMessages(selectedChatData.userId).then(setChatMessages)
      }
    }
  }, [selectedChat, lineChats])

  const selectedChatData = selectedChat ? lineChats.find((l) => l.id === selectedChat) : null

  // 認証状態の確認
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

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px] p-8">
          <div className="text-center">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h2 className="text-xl font-semibold mb-2">ログインが必要です</h2>
            <p className="text-slate-600 mb-4">LINEメッセージにアクセスするには、Googleアカウントでログインしてください。</p>
            <Button onClick={() => window.location.href = '/login'}>
              ログイン
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-600" />
          <p className="text-slate-600">LINEメッセージを読み込んでいます...</p>
        </div>
      </div>
    )
  }

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
                    <span className="text-sm text-slate-600">
                      {new Date().toLocaleDateString('ja-JP', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-[12px]"
                      onClick={() => fetchMessages(selectedChatData.userId).then(setChatMessages)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto">
                  {chatMessages
                    .filter(msg => msg.userId === selectedChatData.userId)
                    .map((msg) => (
                    <div key={msg.id} className={cn("flex", msg.type === "user" ? "justify-start" : "justify-end")}>
                      <div
                        className={cn(
                          "max-w-[80%] p-3 rounded-[16px] text-sm",
                          msg.type === "user" ? "bg-white/70 text-slate-700" : "bg-[#2D8EFF] text-white",
                        )}
                      >
                        <p>{msg.text}</p>
                        <span
                          className={cn(
                            "text-xs mt-1 block",
                            msg.type === "user" ? "text-slate-500" : "text-blue-100",
                          )}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString('ja-JP', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
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
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && message.trim() && !sending) {
                          sendMessage(selectedChatData.userId, message.trim())
                        }
                      }}
                      disabled={sending}
                    />
                    <Button 
                      className="bg-[#3DDC97] hover:bg-[#3DDC97]/90 rounded-[12px]"
                      onClick={() => message.trim() && sendMessage(selectedChatData.userId, message.trim())}
                      disabled={!message.trim() || sending}
                    >
                      {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
            <Button 
              onClick={() => {
                // 実際のLINEメッセージ受信をシミュレート
                const simulateMessage = async () => {
                  const testMessage = {
                    id: `test_${Date.now()}`,
                    userId: `U${Math.random().toString(36).substr(2, 9)}`,
                    displayName: `テストユーザー${Math.floor(Math.random() * 100)}`,
                    text: [
                      'こんにちは、商品について質問があります',
                      '配送状況を教えてください',
                      '返品の手続きを知りたいです',
                      'ありがとうございました！',
                      '問題が解決しました'
                    ][Math.floor(Math.random() * 5)],
                    timestamp: new Date().toISOString(),
                    type: 'user',
                    status: '未対応',
                    priority: ['高', '中', '低'][Math.floor(Math.random() * 3)],
                  };

                  // WebhookエンドポイントにPOST
                  try {
                    const response = await fetch('/api/line/webhook', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        events: [{
                          type: 'message',
                          message: {
                            type: 'text',
                            text: testMessage.text
                          },
                          source: {
                            userId: testMessage.userId
                          },
                          replyToken: 'test_reply_token_' + Date.now()
                        }]
                      })
                    });
                    
                    if (response.ok) {
                      console.log('Test message sent successfully');
                      // データを再読み込み
                      const messages = await fetchMessages()
                      const chatsMap = new Map<string, LineChat>()
                      let chatId = 1
                      
                      messages.forEach((msg: LineMessage) => {
                        if (msg.type === 'user' && !chatsMap.has(msg.userId)) {
                          chatsMap.set(msg.userId, {
                            id: chatId++,
                            name: msg.displayName,
                            userId: msg.userId,
                            lastMessage: msg.text,
                            time: new Date(msg.timestamp).toLocaleTimeString('ja-JP', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }),
                            status: msg.status,
                            priority: msg.priority,
                            unread: messages.filter((m: LineMessage) => 
                              m.userId === msg.userId && m.type === 'user'
                            ).length
                          })
                        }
                      })
                      
                      setLineChats(Array.from(chatsMap.values()))
                      setChatMessages(messages)
                    }
                  } catch (error) {
                    console.error('Error simulating message:', error);
                  }
                };

                simulateMessage();
              }}
              className="bg-[#3DDC97] hover:bg-[#3DDC97]/90 text-white rounded-[12px]"
            >
              <Send className="w-4 h-4 mr-2" />
              テストメッセージ
            </Button>
          </div>
        </div>

        {/* Chat List */}
        <Card className="bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px]">
          <CardContent className="p-0">
            {lineChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">LINEメッセージがありません</h3>
                <p className="text-sm text-slate-600 mb-4">
                  顧客からのメッセージを受信すると、ここに表示されます。
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-[12px]"
                  onClick={() => fetchMessages().then(messages => {
                    const chatsMap = new Map<string, LineChat>()
                    let chatId = 1
                    
                    messages.forEach((msg: LineMessage) => {
                      if (msg.type === 'user' && !chatsMap.has(msg.userId)) {
                        chatsMap.set(msg.userId, {
                          id: chatId++,
                          name: msg.displayName,
                          userId: msg.userId,
                          lastMessage: msg.text,
                          time: new Date(msg.timestamp).toLocaleTimeString('ja-JP', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }),
                          status: msg.status,
                          priority: msg.priority,
                          unread: messages.filter((m: LineMessage) => 
                            m.userId === msg.userId && m.type === 'user'
                          ).length
                        })
                      }
                    })
                    
                    setLineChats(Array.from(chatsMap.values()))
                    setChatMessages(messages)
                  })}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  更新
                </Button>
              </div>
            ) : (
              lineChats.map((chat, index) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={cn(
                    "flex items-center space-x-4 p-6 cursor-pointer transition-all duration-150 ease-out hover:bg-white/30",
                    index !== lineChats.length - 1 && "border-b border-white/20",
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
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
