import { NextRequest, NextResponse } from 'next/server'
import { LLMOpsService } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

// GET /api/llmops/analytics - 分析データ取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    // 統計データ取得
    const analytics = await LLMOpsService.getAnalytics()

    return createSuccessResponse({
      analytics: {
        totalConversations: analytics.totalConversations,
        totalFeedback: analytics.totalFeedback,
        averageScores: analytics.averageScores,
        summary: {
          responseQuality: analytics.averageScores.relevance > 0.7 ? 'Good' : 'Needs Improvement',
          userSatisfaction: analytics.averageScores.helpfulness > 0.7 ? 'High' : 'Moderate',
          systemAccuracy: analytics.averageScores.accuracy > 0.8 ? 'Excellent' : 'Good'
        }
      }
    })

  } catch (error) {
    console.error('分析データ取得エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : '分析データの取得に失敗しました',
      500
    )
  }
}

// POST /api/llmops/analytics/metrics - 品質メトリクス記録
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    const body = await request.json()
    const { 
      conversation_id, 
      relevance_score = null, 
      accuracy_score = null, 
      helpfulness_score = null 
    } = body

    // バリデーション
    if (!conversation_id) {
      return createErrorResponse('conversation_idは必須です', 400)
    }

    // スコアの範囲チェック
    const validateScore = (score: number | null, name: string) => {
      if (score !== null && (score < 0 || score > 1)) {
        throw new Error(`${name}は0-1の範囲で指定してください`)
      }
    }

    validateScore(relevance_score, '関連性スコア')
    validateScore(accuracy_score, '正確性スコア')
    validateScore(helpfulness_score, '有用性スコア')

    // メトリクス記録
    const metrics = await LLMOpsService.recordQualityMetrics({
      conversation_id,
      relevance_score,
      accuracy_score,
      helpfulness_score
    })

    return createSuccessResponse(metrics, 201)

  } catch (error) {
    console.error('品質メトリクス記録エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : '品質メトリクスの記録に失敗しました',
      500
    )
  }
} 