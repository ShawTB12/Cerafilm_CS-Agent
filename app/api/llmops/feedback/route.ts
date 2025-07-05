import { NextRequest, NextResponse } from 'next/server'
import { LLMOpsService } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

// POST /api/llmops/feedback - フィードバック記録
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
      feedback_type, 
      rating = null, 
      comment = null 
    } = body

    // バリデーション
    if (!conversation_id || !feedback_type) {
      return createErrorResponse('conversation_id, feedback_typeは必須です', 400)
    }

    if (!['THUMBS_UP', 'THUMBS_DOWN', 'RATING'].includes(feedback_type)) {
      return createErrorResponse('不正なフィードバックタイプです', 400)
    }

    if (feedback_type === 'RATING') {
      if (!rating || rating < 1 || rating > 5) {
        return createErrorResponse('評価は1-5の範囲で指定してください', 400)
      }
    }

    // フィードバック記録
    const feedback = await LLMOpsService.recordFeedback({
      conversation_id,
      feedback_type,
      rating,
      comment
    })

    return createSuccessResponse(feedback, 201)

  } catch (error) {
    console.error('フィードバック記録エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'フィードバックの記録に失敗しました',
      500
    )
  }
} 