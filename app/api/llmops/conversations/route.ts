import { NextRequest, NextResponse } from 'next/server'
import { LLMOpsService } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

// GET /api/llmops/conversations - 会話履歴取得
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const user_id = searchParams.get('user_id')
    const platform = searchParams.get('platform')
    
    // 会話履歴取得
    const conversations = await LLMOpsService.getConversationHistory(limit)
    
    // フィルタリング
    let filteredConversations = conversations || []
    
    if (user_id) {
      filteredConversations = filteredConversations.filter(c => c.user_id === user_id)
    }
    
    if (platform) {
      filteredConversations = filteredConversations.filter(c => c.platform === platform)
    }

    return createSuccessResponse({
      conversations: filteredConversations,
      total: filteredConversations.length,
      limit
    })

  } catch (error) {
    console.error('会話履歴取得エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : '会話履歴の取得に失敗しました',
      500
    )
  }
}

// POST /api/llmops/conversations - 会話記録
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    const body = await request.json()
    const { 
      user_id, 
      platform, 
      query, 
      response, 
      knowledge_used = [], 
      response_time = null, 
      session_id = null 
    } = body

    // バリデーション
    if (!user_id || !platform || !query || !response) {
      return createErrorResponse('user_id, platform, query, responseは必須です', 400)
    }

    if (!['GMAIL', 'LINE', 'CALL'].includes(platform)) {
      return createErrorResponse('不正なプラットフォームです', 400)
    }

    // 会話記録
    const conversation = await LLMOpsService.recordConversation({
      user_id,
      platform,
      query,
      response,
      knowledge_used,
      response_time,
      session_id
    })

    return createSuccessResponse(conversation, 201)

  } catch (error) {
    console.error('会話記録エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : '会話の記録に失敗しました',
      500
    )
  }
} 