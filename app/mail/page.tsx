"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
  BookOpen,
  TrendingUp,
  CheckCircle,
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

// ナレッジデータの定義
const knowledgeData = [
  {
    id: 1,
    title: "返品・交換ポリシー",
    description: "商品の返品・交換に関する手続きと条件",
    relevanceScore: 95,
    category: "返品対応",
    content: "返品申請フォームの案内、着払い発送、3-5営業日での返金処理"
  },
  {
    id: 2,
    title: "お詫び・謝罪対応",
    description: "商品不具合や問題発生時の適切な謝罪表現",
    relevanceScore: 88,
    category: "謝罪対応",
    content: "丁寧な謝罪文と今後の対応方針の説明"
  },
  {
    id: 3,
    title: "カスタマーサポート連絡先",
    description: "追加サポートが必要な場合の連絡方法",
    relevanceScore: 72,
    category: "サポート情報",
    content: "お客様センターの電話番号、メールアドレス、営業時間"
  }
]

interface GmailMessage {
  id: string;
  threadId: string;
  sender: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
  body: string;
}

export default function MailPage() {
  const { data: session, status } = useSession()
  const [selectedMail, setSelectedMail] = useState<string | null>(null)
  const [selectedKnowledge, setSelectedKnowledge] = useState<number | null>(null)
  const [generatedResponse, setGeneratedResponse] = useState("")
  const [manualResponse, setManualResponse] = useState("")
  const [replySubject, setReplySubject] = useState("")

  // メール内容に基づいてナレッジの推奨度を計算
  const getRelevantKnowledge = (mailContent: string, mailSubject: string) => {
    const content = (mailContent + " " + mailSubject).toLowerCase()
    
    return knowledgeData.map(knowledge => {
      let score = knowledge.relevanceScore
      
      // キーワードベースのスコア調整
      if (content.includes("返品") || content.includes("交換")) {
        if (knowledge.category === "返品対応") score = Math.min(98, score + 15)
      }
      if (content.includes("不具合") || content.includes("問題") || content.includes("申し訳")) {
        if (knowledge.category === "謝罪対応") score = Math.min(95, score + 12)
      }
      if (content.includes("問い合わせ") || content.includes("教えて") || content.includes("わからない")) {
        if (knowledge.category === "サポート情報") score = Math.min(90, score + 8)
      }
      
      return { ...knowledge, relevanceScore: score }
    }).sort((a, b) => b.relevanceScore - a.relevanceScore)
  }
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [newMessageCount, setNewMessageCount] = useState(0)
  const [selectedMessage, setSelectedMessage] = useState<GmailMessage | null>(null)
  const [isLoadingMessage, setIsLoadingMessage] = useState(false)
  const [totalEstimate, setTotalEstimate] = useState(0)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  
  // ページネーション関連のstate
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50) // 1ページあたり50件
  const [pageTokens, setPageTokens] = useState<{ [key: number]: string | null }>({ 1: null }) // ページごとのトークンを管理

  // Gmail APIからメールデータを取得
  useEffect(() => {
    if (session?.accessToken) {
      fetchGmailMessages(1)
    } else if (session) {
      // セッションはあるが、accessTokenがない場合
      console.warn('Session found but no access token. Gmail API integration may not be configured properly.');
    }
  }, [session])

  // 自動更新機能（30秒間隔）
  useEffect(() => {
    if (!session?.accessToken || !autoRefresh) return

    const interval = setInterval(() => {
      fetchGmailMessages(currentPage, true) // 現在のページを自動更新
    }, 30000) // 30秒間隔

    return () => {
      clearInterval(interval)
      // 新着通知タイマーもクリア
      setNewMessageCount(0)
    }
  }, [session?.accessToken, autoRefresh, currentPage])

  const fetchGmailMessages = async (page = 1, isRefresh = false) => {
    setIsLoading(true)
    setError("")
    
    try {
      // ページネーション用のURLパラメータを構築
      const url = new URL('/api/gmail/messages', window.location.origin)
      url.searchParams.set('maxResults', itemsPerPage.toString())
      
      // 指定されたページのトークンを使用
      const pageToken = pageTokens[page]
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken)
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Gmail APIレスポンスをUIに適した形式に変換
      const formattedMessages: GmailMessage[] = data.messages.map((msg: any) => ({
        id: msg.id,
        threadId: msg.threadId,
        sender: msg.sender || 'Unknown',
        subject: msg.subject || '(件名なし)',
        date: new Date(msg.date).toLocaleDateString('ja-JP'),
        snippet: msg.snippet || '',
        unread: msg.unread,
        body: msg.body || msg.snippet,
      }))
      
      // 新着メール検知（現在のページが1で、リフレッシュ時のみ）
      if (page === 1 && isRefresh && gmailMessages.length > 0 && formattedMessages.length > 0) {
        const currentFirstMessageId = gmailMessages[0].id
        const newFirstMessageId = formattedMessages[0].id
        
        if (currentFirstMessageId && newFirstMessageId !== currentFirstMessageId) {
          setNewMessageCount(1) // 新着メールがあることを示す
          setTimeout(() => setNewMessageCount(0), 3000)
        }
      }
      
      setGmailMessages(formattedMessages)
      
      // 次のページのトークンを保存
      if (data.nextPageToken) {
        setPageTokens(prev => ({
          ...prev,
          [page + 1]: data.nextPageToken
        }))
      }
      
      setTotalEstimate(data.resultSizeEstimate || 0)
      setLastFetch(new Date())
      
      // 初回読み込み完了フラグを設定
      if (!hasLoadedOnce) {
        setHasLoadedOnce(true)
      }
    } catch (error) {
      console.error('Error fetching Gmail messages:', error)
      if (error instanceof Error && error.message.includes('401')) {
        setError('Gmail認証が必要です。ログインしてください。')
      } else {
        setError('メールの取得に失敗しました。Gmail API設定を確認してください。')
      }
      setGmailMessages([])
    } finally {
      setIsLoading(false)
    }
  }

  // ページ移動関数
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchGmailMessages(page)
  }

  // メール詳細を取得
  const fetchMessageDetails = async (messageId: string) => {
    if (!session?.accessToken) return

    setIsLoadingMessage(true)
    setError("")

    try {
      const response = await fetch(`/api/gmail/messages/${messageId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch message details')
      }
      
      const messageDetails = await response.json()
      setSelectedMessage(messageDetails)
    } catch (error) {
      console.error('Error fetching message details:', error)
      setError('メール詳細の取得に失敗しました。')
    } finally {
      setIsLoadingMessage(false)
    }
  }

  // 表示用データを決定（Gmail データ or モックデータ）
  const displayMessages = (() => {
    // Gmail データが取得済みの場合
    if (gmailMessages.length > 0) {
      return gmailMessages.map((msg, index) => ({
        id: parseInt(msg.id.slice(-6), 16) || index + 1, // IDを数値に変換
        sender: msg.sender,
        email: msg.sender.includes('<') ? msg.sender.match(/<(.+)>/)?.[1] || msg.sender : msg.sender,
        subject: msg.subject,
        preview: msg.snippet,
        time: msg.date,
        status: msg.unread ? "未対応" : "完了",
        priority: msg.unread ? "高" : "低",
        starred: false,
        unread: msg.unread,
        body: msg.body,
        originalId: msg.id, // Gmail APIの元IDを保持
      }))
    }
    
    // 初回読み込み完了後でGmailデータが空の場合のみモックデータを表示
    if (hasLoadedOnce && gmailMessages.length === 0) {
      return mailData.map(mail => ({ ...mail, body: mail.preview, originalId: mail.id.toString() }))
    }
    
    // 初回読み込み中は空配列を返す
    return []
  })()

  const selectedMailData = selectedMail ? displayMessages.find((m) => m.id.toString() === selectedMail.toString()) : null

  const relevantKnowledge = selectedMailData 
    ? getRelevantKnowledge(selectedMailData.body || selectedMailData.preview, selectedMailData.subject)
    : knowledgeData

  // ナレッジに基づいて返信文と件名を生成
  const generateReplyFromKnowledge = (knowledgeId: number) => {
    const knowledge = knowledgeData.find(k => k.id === knowledgeId)
    if (!knowledge || !selectedMailData) return

    const customerName = selectedMailData.sender.split(' ')[0] || 'お客様'
    const originalSubject = selectedMailData.subject
    
    // 件名生成
    const replySubject = originalSubject.startsWith('Re: ') 
      ? originalSubject 
      : `Re: ${originalSubject}`
    
    // ナレッジに基づいた返信文生成
    let replyContent = ''
    
    switch (knowledge.category) {
      case '返品対応':
        replyContent = `${customerName}様

この度は弊社商品をご購入いただき、ありがとうございます。
また、商品の不具合によりご迷惑をおかけし、誠に申し訳ございません。

返品につきまして、以下の手順でお手続きください：

📝 返品手順
1. 返品申請フォームにご記入
2. 商品を元の梱包材で梱包
3. 着払いにて弊社まで発送

返品申請フォームのURLを別途お送りいたします。
商品到着後、3-5営業日以内に返金処理を行います。

ご不明な点がございましたら、お気軽にお問い合わせください。

Cerafilm CS Agent`
        break
        
      case '謝罪対応':
        replyContent = `${customerName}様

いつも弊社をご利用いただき、誠にありがとうございます。
この度は、ご不便をおかけしており、心よりお詫び申し上げます。

お客様のご指摘を真摯に受け止め、改善に向けて全力で取り組んでまいります。
つきましては、詳細をお伺いさせていただき、適切な対応をご提案させていただきたく存じます。

お忙しい中恐れ入りますが、お返事をお待ちしております。

Cerafilm CS Agent`
        break
        
      case 'サポート情報':
        replyContent = `${customerName}様

お問い合わせいただき、ありがとうございます。

ご質問の件につきまして、以下の方法でサポートをご提供しております：

📞 お客様センター
電話: 0120-XXX-XXX（平日 9:00-18:00）
メール: support@cerafilm.com

💻 よくあるご質問
https://cerafilm.com/faq

また、緊急のお問い合わせの場合は、お電話でのご連絡をお勧めいたします。

何かご不明な点がございましたら、お気軽にお問い合わせください。

Cerafilm CS Agent`
        break
        
      default:
        replyContent = `${customerName}様

お問い合わせいただき、ありがとうございます。
ご質問の件について、担当者より改めてご連絡いたします。

お待たせして申し訳ございませんが、今しばらくお時間をいただけますでしょうか。

Cerafilm CS Agent`
    }
    
    setReplySubject(replySubject)
    setManualResponse(replyContent)
  }

  // 未認証時の表示
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Gmailにアクセスするにはログインが必要です</p>
          <Button onClick={() => window.location.href = '/login'}>
            ログインページへ
          </Button>
        </div>
      </div>
    )
  }

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" style={{height: '780px'}}>
            {/* Left: Email Content */}
            <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-300 flex flex-col h-full">
              <CardContent className="p-8 flex flex-col h-full overflow-y-auto">
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
                <div className="space-y-6 flex-grow">
                  <div className="bg-white/50 backdrop-blur-[16px] rounded-[18px] p-6 border border-white/30 shadow-[0_4px_16px_rgba(0,0,0,0.06)] h-full overflow-y-auto">
                    <div className="text-slate-700 leading-relaxed text-[15px] whitespace-pre-wrap">
                      {selectedMessage?.body || selectedMessage?.snippet || "メール本文を読み込み中..."}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 mt-8 pt-6 border-t border-white/30 flex-shrink-0">
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
            <div className="space-y-6 flex flex-col" style={{height: '780px'}}>
              {/* Knowledge Selection */}
              <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-300 flex-shrink-0" style={{height: '320px'}}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-[10px] flex items-center justify-center shadow-[0_4px_12px_rgba(34,197,94,0.3)]">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900">ナレッジ選択</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        if (selectedKnowledge) {
                          generateReplyFromKnowledge(selectedKnowledge)
                        }
                      }}
                      disabled={!selectedKnowledge}
                      className="ml-auto rounded-[10px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      回答案生成
                    </Button>
                  </div>

                  <div className="space-y-2 overflow-y-auto" style={{maxHeight: '240px'}}>
                    {relevantKnowledge.map((knowledge) => (
                      <div
                        key={knowledge.id}
                        onClick={() => setSelectedKnowledge(knowledge.id)}
                        className={cn(
                          "p-3 rounded-[12px] cursor-pointer transition-all duration-200 border",
                          selectedKnowledge === knowledge.id
                            ? "bg-green-50/80 border-green-200/60 shadow-[0_2px_8px_rgba(34,197,94,0.2)]"
                            : "bg-white/50 border-white/40 hover:bg-white/70 hover:border-green-200/40"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-900">{knowledge.title}</span>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-blue-100/80 text-blue-700"
                            >
                              {knowledge.relevanceScore}%
                            </Badge>
                            {selectedKnowledge === knowledge.id && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2">{knowledge.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>



              {/* Manual Response */}
              <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px] hover:shadow-[0_12px_48px_rgba(0,0,0,0.15)] transition-all duration-300 flex-shrink-0" style={{height: '420px'}}>
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-[10px] flex items-center justify-center shadow-[0_4px_12px_rgba(34,197,94,0.3)]">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900">返信作成</h3>
                  </div>

                  <div className="space-y-4 flex flex-col">
                    <Input
                      placeholder="件名: Re: 商品の返品について"
                      value={replySubject}
                      onChange={(e) => setReplySubject(e.target.value)}
                      className="bg-white/50 backdrop-blur-[16px] border-white/40 rounded-[12px] focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 flex-shrink-0"
                    />

                    <Textarea
                      placeholder="返信内容を入力してください..."
                      value={manualResponse}
                      onChange={(e) => setManualResponse(e.target.value)}
                      className="bg-white/50 backdrop-blur-[16px] border-white/40 rounded-[12px] resize-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 text-sm leading-relaxed flex-shrink-0"
                      style={{height: '240px'}}
                    />

                    <div className="flex items-center justify-between pt-2 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-[10px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200"
                        >
                          <Paperclip className="w-3 h-3 mr-2" />
                          添付
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="rounded-[10px] bg-white/50 backdrop-blur-[16px] border border-white/30 hover:bg-white/70 hover:scale-105 transition-all duration-200"
                        >
                          <User className="w-3 h-3 mr-2" />
                          署名
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="rounded-[10px] bg-white/50 backdrop-blur-[16px] border-white/40 hover:bg-white/70 transition-all duration-200"
                        >
                          下書き保存
                        </Button>
                        <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-[12px] shadow-[0_4px_12px_rgba(34,197,94,0.3)] hover:shadow-[0_6px_16px_rgba(34,197,94,0.4)] transition-all duration-200">
                          <Send className="w-4 h-4 mr-2" />
                          送信
                        </Button>
                      </div>
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
              onClick={() => fetchGmailMessages(currentPage, true)} // 現在のページを手動リフレッシュ
              disabled={isLoading}
              className="rounded-[14px] bg-white/50 backdrop-blur-[16px] border border-white/30 shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-white/70 hover:scale-105 transition-all duration-200"
            >
              <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={cn(
                "rounded-[14px] backdrop-blur-[16px] border shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:scale-105 transition-all duration-200",
                autoRefresh 
                  ? "bg-green-100/80 border-green-200/50 text-green-700 hover:bg-green-200/80" 
                  : "bg-white/50 border-white/30 text-slate-700 hover:bg-white/70"
              )}
            >
              {autoRefresh ? "自動更新: ON" : "自動更新: OFF"}
            </Button>
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
          {isLoading && (
            <div className="bg-blue-50/80 backdrop-blur-[20px] border border-blue-200/50 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium text-blue-700">メールを読み込み中...</span>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50/80 backdrop-blur-[20px] border border-red-200/50 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-red-700">{error}</span>
              </div>
            </div>
          )}
          
          {newMessageCount > 0 && (
            <div className="bg-gradient-to-r from-orange-100/80 to-yellow-100/80 backdrop-blur-[20px] border border-orange-200/50 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(251,146,60,0.15)] animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce"></div>
                <span className="text-sm font-bold text-orange-700">🎉 新着メール {newMessageCount}件が届きました！</span>
              </div>
            </div>
          )}
          
          {!isLoading && !error && (
            <>
              <div className="bg-white/60 backdrop-blur-[20px] border border-white/40 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">未対応: {displayMessages.filter(m => m.status === "未対応").length}件</span>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-[20px] border border-white/40 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">対応中: {displayMessages.filter(m => m.status === "対応中").length}件</span>
                </div>
              </div>
              <div className="bg-white/60 backdrop-blur-[20px] border border-white/40 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-700">完了: {displayMessages.filter(m => m.status === "完了").length}件</span>
                </div>
              </div>
              
              {gmailMessages.length > 0 && (
                <div className="bg-green-50/80 backdrop-blur-[20px] border border-green-200/50 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-700">
                      Gmail連携済み: {gmailMessages.length}件取得
                      {totalEstimate > 0 && totalEstimate > gmailMessages.length && (
                        <span className="text-green-600"> / 全体約{totalEstimate}件</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
              
              {lastFetch && (
                <div className="bg-blue-50/80 backdrop-blur-[20px] border border-blue-200/50 rounded-[16px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
                  <div className="flex items-center space-x-3">
                    <div className={cn("w-2 h-2 rounded-full", autoRefresh ? "bg-green-500" : "bg-gray-500")}></div>
                    <span className="text-sm font-medium text-blue-700">
                      最終更新: {lastFetch.toLocaleTimeString('ja-JP')}
                      {autoRefresh && " (30秒間隔で自動更新)"}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mail List */}
        <Card className="bg-white/70 backdrop-blur-[32px] border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rounded-[24px]">
          <CardContent className="p-0">
            {displayMessages.map((mail, index) => (
              <div
                key={mail.id}
                onClick={() => {
                  setSelectedMail(mail.id.toString())
                  // Gmail APIから取得したメッセージの場合、詳細を取得
                  if (gmailMessages.length > 0 && mail.originalId) {
                    fetchMessageDetails(mail.originalId)
                  } else {
                    // モックデータの場合は既存のデータを使用
                    setSelectedMessage({
                      id: mail.id.toString(),
                      threadId: '',
                      sender: mail.sender,
                      subject: mail.subject,
                      date: mail.time,
                      snippet: mail.preview,
                      unread: mail.unread,
                      body: mail.body || mail.preview
                    })
                  }
                }}
                className={cn(
                  "flex items-center space-x-6 p-6 cursor-pointer transition-all duration-200 ease-out hover:bg-white/50 hover:scale-[1.01] group",
                  index !== displayMessages.length - 1 && "border-b border-white/30",
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
            
            {/* ページネーション */}
            {!isLoading && gmailMessages.length > 0 && (
              <div className="p-6 border-t border-white/30">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-600">
                    {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, ((currentPage - 1) * itemsPerPage) + gmailMessages.length)}件目を表示
                    {totalEstimate > 0 && ` (全体約${totalEstimate}件)`}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="rounded-[12px] bg-white/50 backdrop-blur-[16px] border-white/40 hover:bg-white/70 transition-all duration-200"
                    >
                      前のページ
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {/* ページ番号表示 */}
                      {Array.from({ length: Math.min(5, Math.ceil(totalEstimate / itemsPerPage)) }, (_, i) => {
                        const pageNum = Math.max(1, currentPage - 2) + i
                        const maxPage = Math.ceil(totalEstimate / itemsPerPage)
                        if (pageNum > maxPage) return null
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            className={cn(
                              "w-10 h-10 rounded-[10px] transition-all duration-200",
                              currentPage === pageNum
                                ? "bg-blue-500 text-white shadow-[0_4px_12px_rgba(59,130,246,0.3)]"
                                : "bg-white/50 backdrop-blur-[16px] border-white/40 hover:bg-white/70"
                            )}
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pageTokens[currentPage + 1] && gmailMessages.length < itemsPerPage}
                      className="rounded-[12px] bg-white/50 backdrop-blur-[16px] border-white/40 hover:bg-white/70 transition-all duration-200"
                    >
                      次のページ
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
