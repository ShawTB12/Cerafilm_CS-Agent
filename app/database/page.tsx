'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { 
  Database, 
  FileText, 
  BarChart3, 
  Shield, 
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Tag,
  Calendar,
  RefreshCw,
  Eye,
  Download
} from 'lucide-react'

interface PolicyMaster {
  id: string
  company_name: string
  policy_version: string
  effective_date: string
}

interface ReturnCondition {
  id: string
  condition_type: 'VALID' | 'INVALID'
  category: string
  subcategory?: string
  condition_text: string
  time_limit_days?: number
}

interface ResponseMethod {
  id: string
  response_type: 'RETURN' | 'EXCHANGE' | 'RESEND'
  description: string
  shipping_cost_bearer: 'CUSTOMER' | 'COMPANY'
}

interface Procedure {
  id: string
  step_number: number
  step_description: string
  is_mandatory: boolean
}

interface PolicyKeyword {
  id: string
  keyword: string
  keyword_type: 'CONDITION' | 'RESPONSE' | 'PROCEDURE' | 'EXCEPTION'
  weight: number
}

interface StructuredPolicy {
  master: PolicyMaster
  conditions: {
    valid: ReturnCondition[]
    invalid: ReturnCondition[]
  }
  responses: ResponseMethod[]
  procedures: Procedure[]
  keywords: PolicyKeyword[]
}

interface KnowledgeBase {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  priority: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function DatabasePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [structuredPolicy, setStructuredPolicy] = useState<StructuredPolicy | null>(null)
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase[]>([])
  const [unifiedPolicy, setUnifiedPolicy] = useState<KnowledgeBase | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'structured' | 'unified'>('structured')

  // 認証チェック
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/login')
      return
    }
  }, [session, status, router])

  // データ取得
  useEffect(() => {
    if (session) {
      fetchAllData()
    }
  }, [session])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('データ取得開始...')

      // 順次データを取得してエラーを特定
      let structuredRes: Response
      let unifiedRes: Response
      let knowledgeRes: Response

      try {
        console.log('構造化ポリシー取得中...')
        structuredRes = await fetch('/api/return-policy?format=structured', { credentials: 'include' })
        console.log('構造化ポリシーレスポンス:', structuredRes.status, structuredRes.statusText)
      } catch (err) {
        console.error('構造化ポリシー取得エラー:', err)
        throw new Error('構造化ポリシーの取得に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }

      try {
        console.log('統一ポリシー取得中...')
        unifiedRes = await fetch('/api/return-policy?format=unified', { credentials: 'include' })
        console.log('統一ポリシーレスポンス:', unifiedRes.status, unifiedRes.statusText)
      } catch (err) {
        console.error('統一ポリシー取得エラー:', err)
        throw new Error('統一ポリシーの取得に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }

      try {
        console.log('ナレッジベース取得中...')
        knowledgeRes = await fetch('/api/knowledge', { credentials: 'include' })
        console.log('ナレッジベースレスポンス:', knowledgeRes.status, knowledgeRes.statusText)
      } catch (err) {
        console.error('ナレッジベース取得エラー:', err)
        throw new Error('ナレッジベースの取得に失敗しました: ' + (err instanceof Error ? err.message : '不明なエラー'))
      }

      // レスポンスステータスの詳細チェック
      if (!structuredRes.ok) {
        const errorText = await structuredRes.text()
        console.error('構造化ポリシーエラー:', structuredRes.status, errorText)
        throw new Error(`構造化ポリシー取得エラー (${structuredRes.status}): ${errorText}`)
      }

      if (!unifiedRes.ok) {
        const errorText = await unifiedRes.text()
        console.error('統一ポリシーエラー:', unifiedRes.status, errorText)
        throw new Error(`統一ポリシー取得エラー (${unifiedRes.status}): ${errorText}`)
      }

      if (!knowledgeRes.ok) {
        const errorText = await knowledgeRes.text()
        console.error('ナレッジベースエラー:', knowledgeRes.status, errorText)
        throw new Error(`ナレッジベース取得エラー (${knowledgeRes.status}): ${errorText}`)
      }

      // JSONパース
      let structuredData: any
      let unifiedData: any
      let knowledgeData: any

      try {
        console.log('構造化ポリシーJSONパース中...')
        structuredData = await structuredRes.json()
        console.log('構造化ポリシーデータ:', structuredData)
      } catch (err) {
        console.error('構造化ポリシーJSONパースエラー:', err)
        throw new Error('構造化ポリシーの解析に失敗しました')
      }

      try {
        console.log('統一ポリシーJSONパース中...')
        unifiedData = await unifiedRes.json()
        console.log('統一ポリシーデータ:', unifiedData)
      } catch (err) {
        console.error('統一ポリシーJSONパースエラー:', err)
        throw new Error('統一ポリシーの解析に失敗しました')
      }

      try {
        console.log('ナレッジベースJSONパース中...')
        knowledgeData = await knowledgeRes.json()
        console.log('ナレッジベースデータ:', knowledgeData)
      } catch (err) {
        console.error('ナレッジベースJSONパースエラー:', err)
        throw new Error('ナレッジベースの解析に失敗しました')
      }

      // データ設定
      if (structuredData.success) {
        setStructuredPolicy(structuredData.data.policy)
        console.log('構造化ポリシー設定完了')
      } else {
        console.warn('構造化ポリシー取得失敗:', structuredData.error)
      }

      if (unifiedData.success) {
        setUnifiedPolicy(unifiedData.data.policy)
        console.log('統一ポリシー設定完了')
      } else {
        console.warn('統一ポリシー取得失敗:', unifiedData.error)
      }

      if (knowledgeData.success) {
        setKnowledgeBase(knowledgeData.data.knowledge || [])
        console.log('ナレッジベース設定完了:', knowledgeData.data.knowledge?.length || 0, '件')
      } else {
        console.warn('ナレッジベース取得失敗:', knowledgeData.error)
      }

    } catch (err) {
      console.error('データ取得エラー:', err)
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const exportData = (format: 'json' | 'csv') => {
    const data = selectedView === 'structured' ? structuredPolicy : unifiedPolicy
    if (!data) return

    let content: string
    let filename: string

    if (format === 'json') {
      content = JSON.stringify(data, null, 2)
      filename = `policy_${selectedView}_${new Date().toISOString().split('T')[0]}.json`
    } else {
      // CSV形式の場合は簡略化
      if (selectedView === 'structured' && structuredPolicy) {
        const rows = [
          ['項目', '内容'],
          ['会社名', structuredPolicy.master.company_name],
          ['バージョン', structuredPolicy.master.policy_version],
          ['有効日', structuredPolicy.master.effective_date],
          ['有効な条件数', structuredPolicy.conditions.valid.length.toString()],
          ['無効な条件数', structuredPolicy.conditions.invalid.length.toString()],
          ['対応方法数', structuredPolicy.responses.length.toString()],
          ['手続き数', structuredPolicy.procedures.length.toString()],
          ['キーワード数', structuredPolicy.keywords.length.toString()]
        ]
        content = rows.map(row => row.join(',')).join('\n')
      } else {
        content = `title,category,tags,priority\n"${unifiedPolicy?.title}","${unifiedPolicy?.category}","${unifiedPolicy?.tags?.join(';')}","${unifiedPolicy?.priority}"`
      }
      filename = `policy_${selectedView}_${new Date().toISOString().split('T')[0]}.csv`
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>データベースから情報を取得中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            データベース管理
          </h1>
          <p className="text-muted-foreground mt-2">
            ナレッジベースと返品ポリシーの管理・分析
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            更新
          </Button>
          <Button onClick={() => exportData('json')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button onClick={() => exportData('csv')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="policy" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="policy">返品ポリシー</TabsTrigger>
          <TabsTrigger value="knowledge">ナレッジベース</TabsTrigger>
          <TabsTrigger value="analytics">分析</TabsTrigger>
        </TabsList>

        {/* 返品ポリシータブ */}
        <TabsContent value="policy" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">返品ポリシー管理</h2>
            <div className="flex gap-2">
              <Button
                variant={selectedView === 'structured' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('structured')}
              >
                構造化表示
              </Button>
              <Button
                variant={selectedView === 'unified' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('unified')}
              >
                統一表示
              </Button>
            </div>
          </div>

          {selectedView === 'structured' && structuredPolicy && (
            <div className="grid gap-6">
              {/* ポリシーマスター */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    ポリシー基本情報
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">会社名</label>
                      <p className="text-lg font-semibold">{structuredPolicy.master.company_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">バージョン</label>
                      <p className="text-lg font-semibold">{structuredPolicy.master.policy_version}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">有効日</label>
                      <p className="text-lg font-semibold">{structuredPolicy.master.effective_date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 返品条件 */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      有効な返品条件
                    </CardTitle>
                    <CardDescription>
                      {structuredPolicy.conditions.valid.length}件の条件
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {structuredPolicy.conditions.valid.map((condition, index) => (
                      <div key={condition.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{condition.category}</Badge>
                          {condition.time_limit_days && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {condition.time_limit_days}日以内
                            </div>
                          )}
                        </div>
                        {condition.subcategory && (
                          <p className="text-sm font-medium mb-1">{condition.subcategory}</p>
                        )}
                        <p className="text-sm">{condition.condition_text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      免責事項
                    </CardTitle>
                    <CardDescription>
                      {structuredPolicy.conditions.invalid.length}件の条件
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {structuredPolicy.conditions.invalid.map((condition, index) => (
                      <div key={condition.id} className="p-4 border rounded-lg">
                        <div className="mb-2">
                          <Badge variant="destructive">{condition.category}</Badge>
                        </div>
                        {condition.subcategory && (
                          <p className="text-sm font-medium mb-1">{condition.subcategory}</p>
                        )}
                        <p className="text-sm">{condition.condition_text}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* 対応方法と手続き */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>対応方法</CardTitle>
                    <CardDescription>
                      {structuredPolicy.responses.length}つの対応パターン
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {structuredPolicy.responses.map((response, index) => (
                      <div key={response.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge>{response.response_type}</Badge>
                          <Badge variant={response.shipping_cost_bearer === 'COMPANY' ? 'default' : 'secondary'}>
                            送料：{response.shipping_cost_bearer === 'COMPANY' ? '弊社負担' : 'お客様負担'}
                          </Badge>
                        </div>
                        <p className="text-sm">{response.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>手続きフロー</CardTitle>
                    <CardDescription>
                      {structuredPolicy.procedures.length}ステップの手続き
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {structuredPolicy.procedures.map((procedure, index) => (
                      <div key={procedure.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">ステップ {procedure.step_number}</Badge>
                          {procedure.is_mandatory && (
                            <Badge variant="destructive" className="text-xs">必須</Badge>
                          )}
                        </div>
                        <p className="text-sm">{procedure.step_description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* キーワード */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    RAG用キーワード
                  </CardTitle>
                  <CardDescription>
                    {structuredPolicy.keywords.length}個のキーワード（重要度順）
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {structuredPolicy.keywords.map((keyword, index) => (
                      <Badge
                        key={keyword.id}
                        variant={keyword.weight >= 4 ? 'default' : 'secondary'}
                        className="text-sm"
                      >
                        {keyword.keyword} ({keyword.weight})
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedView === 'unified' && unifiedPolicy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {unifiedPolicy.title}
                </CardTitle>
                <CardDescription>
                  統一形式での表示（既存システム互換）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Badge>{unifiedPolicy.category}</Badge>
                    <Badge variant="outline">優先度: {unifiedPolicy.priority}</Badge>
                    {unifiedPolicy.tags?.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  <Separator />
                  <div className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                    {unifiedPolicy.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ナレッジベースタブ */}
        <TabsContent value="knowledge" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">ナレッジベース</h2>
            <Badge variant="outline">{knowledgeBase.length}件のナレッジ</Badge>
          </div>

          <div className="grid gap-4">
            {knowledgeBase.map((knowledge, index) => (
              <Card key={knowledge.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {knowledge.title}
                    <div className="flex gap-2">
                      <Badge>{knowledge.category}</Badge>
                      <Badge variant="outline">優先度: {knowledge.priority}</Badge>
                      {knowledge.is_active ? (
                        <Badge className="bg-green-100 text-green-800">アクティブ</Badge>
                      ) : (
                        <Badge variant="secondary">非アクティブ</Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    作成: {new Date(knowledge.created_at).toLocaleDateString('ja-JP')} | 
                    更新: {new Date(knowledge.updated_at).toLocaleDateString('ja-JP')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {knowledge.tags && knowledge.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {knowledge.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {knowledge.content}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 分析タブ */}
        <TabsContent value="analytics" className="space-y-6">
          <h2 className="text-2xl font-semibold">データ分析</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">総ナレッジ数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{knowledgeBase.length}</div>
                <p className="text-xs text-muted-foreground">アクティブ: {knowledgeBase.filter(k => k.is_active).length}</p>
              </CardContent>
            </Card>

            {structuredPolicy && (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">返品条件</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {structuredPolicy.conditions.valid.length + structuredPolicy.conditions.invalid.length}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      有効: {structuredPolicy.conditions.valid.length} | 免責: {structuredPolicy.conditions.invalid.length}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">対応方法</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{structuredPolicy.responses.length}</div>
                    <p className="text-xs text-muted-foreground">手続き: {structuredPolicy.procedures.length}ステップ</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">キーワード</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{structuredPolicy.keywords.length}</div>
                    <p className="text-xs text-muted-foreground">
                      重要: {structuredPolicy.keywords.filter(k => k.weight >= 4).length}個
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {structuredPolicy && (
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ別分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div>
                    <h4 className="font-medium mb-2">返品条件カテゴリ</h4>
                    <div className="flex gap-2 flex-wrap">
                      {Array.from(new Set([
                        ...structuredPolicy.conditions.valid.map(c => c.category),
                        ...structuredPolicy.conditions.invalid.map(c => c.category)
                      ])).map(category => {
                        const validCount = structuredPolicy.conditions.valid.filter(c => c.category === category).length
                        const invalidCount = structuredPolicy.conditions.invalid.filter(c => c.category === category).length
                        return (
                          <Badge key={category} variant="outline" className="text-sm">
                            {category} ({validCount + invalidCount})
                          </Badge>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">キーワードタイプ</h4>
                    <div className="flex gap-2 flex-wrap">
                      {Array.from(new Set(structuredPolicy.keywords.map(k => k.keyword_type))).map(type => {
                        const count = structuredPolicy.keywords.filter(k => k.keyword_type === type).length
                        return (
                          <Badge key={type} variant="outline" className="text-sm">
                            {type} ({count})
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 