import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { openai, SYSTEM_PROMPTS, validateOpenAIConfig } from '@/lib/openai-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { KnowledgeService } from '@/lib/supabase'

// POST /api/ai/analyze-email - メール解析
export async function POST(request: NextRequest) {
  try {
    console.log('メール解析API: リクエスト開始')

    // 認証チェック（開発環境では一時的にスキップ）
    if (process.env.NODE_ENV === 'production') {
      const session = await getServerSession(authOptions)
      if (!session) {
        return createErrorResponse('認証が必要です', 401)
      }
    } else {
      console.log('メール解析API: 開発環境 - 認証スキップ')
    }

    // リクエストボディの取得
    const body = await request.json()
    const { emailContent, emailSubject } = body

    // バリデーション
    if (!emailContent || !emailSubject) {
      return createErrorResponse('emailContent, emailSubjectは必須です', 400)
    }

    console.log('メール解析API: 解析対象メール', { 
      subject: emailSubject,
      contentLength: emailContent.length 
    })

    // OpenAI設定の検証
    try {
      validateOpenAIConfig()
    } catch (error) {
      console.error('OpenAI設定エラー:', error)
      return createErrorResponse('AI機能の設定に問題があります', 500)
    }

    // メール内容の整形
    const emailText = `件名: ${emailSubject}\n\n本文:\n${emailContent}`

    // OpenAI APIでメール解析
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.emailAnalysis
        },
        {
          role: 'user',
          content: emailText
        }
      ],
      temperature: 0.3, // 分析タスクなので低めの温度
      max_tokens: 1000,
    })

    const analysisResult = completion.choices[0]?.message?.content

    if (!analysisResult) {
      throw new Error('AI分析結果が取得できませんでした')
    }

    console.log('メール解析API: OpenAI生の応答:', analysisResult)
    
    // JSON形式の結果をパース
    let parsedResult
    try {
      // 応答にmarkdownコードブロックが含まれている場合の処理
      let cleanedResult = analysisResult
      if (analysisResult.includes('```json')) {
        cleanedResult = analysisResult.replace(/```json\s*/, '').replace(/\s*```$/, '')
      } else if (analysisResult.includes('```')) {
        cleanedResult = analysisResult.replace(/```\s*/, '').replace(/\s*```$/, '')
      }
      
      console.log('メール解析API: クリーニング後のJSON:', cleanedResult)
      parsedResult = JSON.parse(cleanedResult)
      
    } catch (parseError) {
      console.error('AI分析結果のパースエラー:', parseError)
      console.error('AI応答内容:', analysisResult)
      console.error('クリーニング試行後:', analysisResult.replace(/```json\s*/, '').replace(/\s*```$/, ''))
      
      // 再試行: 単純なJSONの検索と抽出
      try {
        const jsonMatch = analysisResult.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          console.log('メール解析API: JSON抽出試行:', jsonMatch[0])
          parsedResult = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('JSON形式のデータが見つかりませんでした')
        }
      } catch (secondParseError) {
        console.error('メール解析API: 二次パースエラー:', secondParseError)
        
        // パースに失敗した場合のフォールバック
        parsedResult = {
          category: "その他",
          priority: "中",
          sentiment: "中性",
          keywords: [],
          summary: "AI分析の結果解析でエラーが発生しました"
        }
      }
    }

    console.log('メール解析API: 解析結果', parsedResult)

    // 解析結果に基づいてSupabaseからナレッジを検索
    let relevantKnowledge = []
    try {
      console.log('メール解析API: ナレッジ検索開始')
      
      // カテゴリーに基づく検索
      const categoryKeywords = {
        '返品・交換': ['返品', '交換', 'return', 'exchange'],
        '配送・納期': ['配送', '納期', '発送', 'delivery', 'shipping'],
        '商品情報': ['商品', '製品', '仕様', 'product', 'specification'],
        '技術サポート': ['不具合', '故障', '問題', 'trouble', 'support'],
        'お支払い': ['支払い', '決済', '請求', 'payment', 'billing'],
        '会員・アカウント': ['会員', 'アカウント', 'ログイン', 'account', 'login']
      }

      const searchKeywords = [
        ...parsedResult.keywords || [],
        ...(categoryKeywords[parsedResult.category] || [])
      ]

      // 全ナレッジを取得してスコアリング
      const allKnowledge = await KnowledgeService.getAllKnowledge()
      console.log(`メール解析API: 全ナレッジ数 ${allKnowledge.length}`)
      
      // 各ナレッジにスコアを付与
      const scoredKnowledge = allKnowledge.map(knowledge => {
        let score = 0
        const knowledgeText = `${knowledge.title} ${knowledge.content}`.toLowerCase()
        
        // キーワードマッチングでスコア計算
        searchKeywords.forEach(keyword => {
          if (knowledgeText.includes(keyword.toLowerCase())) {
            score += 10
          }
        })
        
        // カテゴリー一致でボーナス
        if (knowledge.category === parsedResult.category) {
          score += 20
        }
        
        // 優先度によるスコア調整
        score += knowledge.priority * 2
        
        return {
          ...knowledge,
          relevanceScore: Math.min(score, 100) // 最大100%
        }
      })
      
      // スコアでソートして上位3つを選択
      relevantKnowledge = scoredKnowledge
        .filter(k => k.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 3)
        .map(k => ({
          id: k.id,
          title: k.title,
          description: k.content.substring(0, 100) + '...',
          category: k.category,
          relevanceScore: k.relevanceScore
        }))
      
      console.log(`メール解析API: 関連ナレッジ ${relevantKnowledge.length}件取得`)
      
    } catch (knowledgeError) {
      console.error('ナレッジ検索エラー:', knowledgeError)
      // ナレッジ検索に失敗してもメール解析結果は返す
    }

    return createSuccessResponse({
      analysis: parsedResult,
      relevantKnowledge,
      tokens_used: completion.usage?.total_tokens || 0,
      model_used: 'gpt-4o'
    })

  } catch (error) {
    console.error('メール解析エラー:', error)
    
    // OpenAI APIエラーの詳細処理
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return createErrorResponse('AI使用制限に達しました。しばらく待ってから再試行してください。', 429)
      }
      if (error.message.includes('api_key')) {
        return createErrorResponse('AI設定に問題があります。管理者に連絡してください。', 500)
      }
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'メール解析に失敗しました',
      500
    )
  }
} 