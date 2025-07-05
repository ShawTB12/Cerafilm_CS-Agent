import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeService } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

// GET /api/knowledge - ナレッジ一覧取得
export async function GET(request: NextRequest) {
  try {
    console.log('ナレッジAPI: リクエスト開始')
    
    // 認証チェック（開発環境では一時的に無効化）
    const session = await getServerSession(authOptions)
    if (!session && process.env.NODE_ENV === 'production') {
      console.log('ナレッジAPI: 認証失敗')
      return createErrorResponse('認証が必要です', 401)
    }
    
    if (!session) {
      console.log('ナレッジAPI: 開発環境 - 認証スキップ')
    } else {
      console.log('ナレッジAPI: 認証成功', { user: session.user?.email })
    }

    // Supabase接続テスト
    console.log('ナレッジAPI: Supabase接続テスト開始')
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    console.log('ナレッジAPI: パラメータ', { category, search, limit, offset })

    let knowledge
    
    if (search) {
      // 検索
      console.log('ナレッジAPI: 検索実行', search)
      knowledge = await KnowledgeService.searchKnowledge(search)
    } else if (category) {
      // カテゴリフィルタ
      console.log('ナレッジAPI: カテゴリフィルタ実行', category)
      knowledge = await KnowledgeService.getKnowledgeByCategory(category)
    } else {
      // 全件取得
      console.log('ナレッジAPI: 全件取得実行')
      knowledge = await KnowledgeService.getAllKnowledge()
    }

    console.log('ナレッジAPI: データ取得成功', { count: knowledge.length })

    // ページネーション適用
    const paginatedKnowledge = knowledge.slice(offset, offset + limit)
    
    const result = {
      knowledge: paginatedKnowledge,
      total: knowledge.length,
      limit,
      offset,
      hasMore: offset + limit < knowledge.length
    }

    console.log('ナレッジAPI: レスポンス準備完了', { 
      resultCount: paginatedKnowledge.length,
      total: knowledge.length 
    })
    
    return createSuccessResponse(result)

  } catch (error) {
    console.error('ナレッジ取得エラー:', error)
    console.error('エラースタック:', error instanceof Error ? error.stack : 'スタック情報なし')
    
    return createErrorResponse(
      error instanceof Error ? error.message : 'ナレッジの取得に失敗しました',
      500
    )
  }
}

// POST /api/knowledge - ナレッジ作成
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session) {
      return createErrorResponse('認証が必要です', 401)
    }

    const body = await request.json()
    const { title, content, category, tags, priority = 0 } = body

    // バリデーション
    if (!title || !content || !category) {
      return createErrorResponse('タイトル、内容、カテゴリは必須です', 400)
    }

    if (!['FAQ', 'POLICY', 'PRODUCT', 'TROUBLESHOOT'].includes(category)) {
      return createErrorResponse('不正なカテゴリです', 400)
    }

    if (priority < 0 || priority > 2) {
      return createErrorResponse('優先度は0-2の範囲で指定してください', 400)
    }

    // ナレッジ作成
    const newKnowledge = await KnowledgeService.createKnowledge({
      title,
      content,
      category,
      tags: tags || [],
      priority,
      created_by: session.user?.email || null,
      is_active: true
    })

    return createSuccessResponse(newKnowledge, 201)

  } catch (error) {
    console.error('ナレッジ作成エラー:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'ナレッジの作成に失敗しました',
      500
    )
  }
} 