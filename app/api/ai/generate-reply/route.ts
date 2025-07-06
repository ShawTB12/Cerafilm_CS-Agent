import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { openai, SYSTEM_PROMPTS, validateOpenAIConfig } from '@/lib/openai-config'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'
import { KnowledgeService } from '@/lib/supabase'

// POST /api/ai/generate-reply - AI返信文生成
export async function POST(request: NextRequest) {
  try {
    console.log('AI返信文生成API: リクエスト開始')

    // 認証チェック（開発環境では一時的にスキップ）
    if (process.env.NODE_ENV === 'production') {
      const session = await getServerSession(authOptions)
      if (!session) {
        return createErrorResponse('認証が必要です', 401)
      }
    } else {
      console.log('AI返信文生成API: 開発環境 - 認証スキップ')
    }

    // リクエストボディの取得
    const body = await request.json()
    const { 
      emailContent, 
      emailSubject, 
      senderName, 
      selectedKnowledgeIds = [],
      emailAnalysis = null 
    } = body

    // バリデーション
    if (!emailContent || !emailSubject) {
      return createErrorResponse('emailContent, emailSubjectは必須です', 400)
    }

    console.log('AI返信文生成API: 生成パラメータ', { 
      subject: emailSubject,
      senderName,
      knowledgeCount: selectedKnowledgeIds.length,
      hasAnalysis: !!emailAnalysis
    })

    // OpenAI設定の検証
    try {
      validateOpenAIConfig()
    } catch (error) {
      console.error('OpenAI設定エラー:', error)
      return createErrorResponse('AI機能の設定に問題があります', 500)
    }

    // 選択されたナレッジベース情報を取得
    let knowledgeInfo = ''
    if (selectedKnowledgeIds.length > 0) {
      try {
        console.log('AI返信文生成API: ナレッジベース情報取得中', selectedKnowledgeIds)
        
        const knowledgeData = await Promise.all(
          selectedKnowledgeIds.map(async (id: string) => {
            try {
              const knowledge = await KnowledgeService.getKnowledgeById(id)
              return knowledge
            } catch (error) {
              console.warn(`ナレッジID ${id} の取得に失敗:`, error)
              return null
            }
          })
        )

        const validKnowledge = knowledgeData.filter(Boolean)
        
        if (validKnowledge.length > 0) {
          knowledgeInfo = '\n\n参考情報（ナレッジベース）:\n' + 
            validKnowledge.map((k: any) => 
              `- ${k.title}: ${k.content}`
            ).join('\n')
          
          console.log('AI返信文生成API: ナレッジベース情報取得完了', {
            requestedCount: selectedKnowledgeIds.length,
            retrievedCount: validKnowledge.length
          })
        }
      } catch (error) {
        console.error('ナレッジベース取得エラー:', error)
        // ナレッジ取得に失敗しても処理は続行
      }
    }

    // 顧客名の抽出（提供されていない場合は元メールから推測）
    const customerName = senderName || '顧客'

    // メール分析情報を含める
    let analysisInfo = ''
    if (emailAnalysis) {
      analysisInfo = `\n\nメール分析結果:
- カテゴリー: ${emailAnalysis.category}
- 緊急度: ${emailAnalysis.priority}
- 感情: ${emailAnalysis.sentiment}
- 要約: ${emailAnalysis.summary}`
    }

    // プロンプトの構築
    const userPrompt = `
顧客からのメール:
件名: ${emailSubject}
送信者: ${customerName}
本文:
${emailContent}
${analysisInfo}
${knowledgeInfo}

上記の顧客メールに対して、適切な返信文を作成してください。`

    console.log('AI返信文生成API: OpenAI API呼び出し開始')

    // OpenAI APIで返信文生成
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPTS.replyGeneration
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7, // 自然な文章生成のため適度な創造性
      max_tokens: 1500,
    })

    const replyContent = completion.choices[0]?.message?.content

    if (!replyContent) {
      throw new Error('AI返信文の生成に失敗しました')
    }

    console.log('AI返信文生成API: 生成完了', {
      replyLength: replyContent.length,
      tokensUsed: completion.usage?.total_tokens || 0
    })

    // 返信件名の生成（元件名に「Re: 」を追加）
    const replySubject = emailSubject.startsWith('Re: ') 
      ? emailSubject 
      : `Re: ${emailSubject}`

    return createSuccessResponse({
      replyContent,
      replySubject,
      customerName,
      tokens_used: completion.usage?.total_tokens || 0,
      model_used: 'gpt-4o',
      knowledge_used: selectedKnowledgeIds.length,
      generated_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('AI返信文生成エラー:', error)
    
    // OpenAI APIエラーの詳細処理
    if (error instanceof Error) {
      if (error.message.includes('quota')) {
        return createErrorResponse('AI使用制限に達しました。しばらく待ってから再試行してください。', 429)
      }
      if (error.message.includes('api_key')) {
        return createErrorResponse('AI設定に問題があります。管理者に連絡してください。', 500)
      }
      if (error.message.includes('context_length')) {
        return createErrorResponse('メール内容が長すぎます。内容を短縮してください。', 400)
      }
    }

    return createErrorResponse(
      error instanceof Error ? error.message : 'AI返信文の生成に失敗しました',
      500
    )
  }
} 