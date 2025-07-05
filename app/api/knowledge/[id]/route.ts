import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeService } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

// GET /api/knowledge/[id] - 個別ナレッジ取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    const { id } = params
    
    if (!id) {
      return createErrorResponse('IDが必要です', 400)
    }

    // 全ナレッジを取得して該当するIDを検索
    const allKnowledge = await KnowledgeService.getAllKnowledge()
    const knowledge = allKnowledge.find(k => k.id === id)
    
    if (!knowledge) {
      return createErrorResponse('ナレッジが見つかりません', 404)
    }

    return createSuccessResponse(knowledge)

  } catch (error) {
    console.error('ナレッジ取得エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'ナレッジの取得に失敗しました',
      500
    )
  }
}

// PUT /api/knowledge/[id] - ナレッジ更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    const { id } = params
    const body = await request.json()
    
    if (!id) {
      return createErrorResponse('IDが必要です', 400)
    }

    const { title, content, category, tags, priority, is_active } = body

    // バリデーション
    if (category && !['FAQ', 'POLICY', 'PRODUCT', 'TROUBLESHOOT'].includes(category)) {
      return createErrorResponse('不正なカテゴリです', 400)
    }

    if (priority !== undefined && (priority < 0 || priority > 2)) {
      return createErrorResponse('優先度は0-2の範囲で指定してください', 400)
    }

    // 更新データの準備
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (category !== undefined) updateData.category = category
    if (tags !== undefined) updateData.tags = tags
    if (priority !== undefined) updateData.priority = priority
    if (is_active !== undefined) updateData.is_active = is_active

    // ナレッジ更新
    const updatedKnowledge = await KnowledgeService.updateKnowledge(id, updateData)

    return createSuccessResponse(updatedKnowledge)

  } catch (error) {
    console.error('ナレッジ更新エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'ナレッジの更新に失敗しました',
      500
    )
  }
}

// DELETE /api/knowledge/[id] - ナレッジ削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    const { id } = params
    
    if (!id) {
      return createErrorResponse('IDが必要です', 400)
    }

    // 論理削除（is_activeをfalseに設定）
    const deletedKnowledge = await KnowledgeService.deleteKnowledge(id)

    return createSuccessResponse({
      message: 'ナレッジが正常に削除されました',
      deletedKnowledge
    })

  } catch (error) {
    console.error('ナレッジ削除エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'ナレッジの削除に失敗しました',
      500
    )
  }
} 