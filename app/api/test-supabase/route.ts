import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/test-supabase - Supabase接続テスト
export async function GET(request: NextRequest) {
  console.log('=== Supabase接続テスト開始 ===')
  
  try {
    // 1. 認証チェック
    console.log('1. 認証チェック...')
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log('認証失敗: セッションなし')
      return NextResponse.json({ 
        error: '認証が必要です',
        step: 'authentication' 
      }, { status: 401 })
    }
    console.log('認証成功:', { user: session.user?.email })

    // 2. Supabaseクライアント確認
    console.log('2. Supabaseクライアント確認...')
    if (!supabase) {
      console.log('Supabaseクライアントが初期化されていません')
      return NextResponse.json({ 
        error: 'Supabaseクライアントエラー',
        step: 'client_init' 
      }, { status: 500 })
    }
    console.log('Supabaseクライアント: OK')

    // 3. 基本的な接続テスト
    console.log('3. 基本接続テスト...')
    const { data: versionData, error: versionError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1)

    if (versionError) {
      console.log('基本接続エラー:', versionError)
      return NextResponse.json({ 
        error: '基本接続に失敗',
        details: versionError.message,
        step: 'basic_connection' 
      }, { status: 500 })
    }
    console.log('基本接続: OK')

    // 4. テーブル存在確認
    console.log('4. テーブル存在確認...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['knowledge_base', 'return_policy_master'])

    if (tablesError) {
      console.log('テーブル確認エラー:', tablesError)
      return NextResponse.json({ 
        error: 'テーブル確認に失敗',
        details: tablesError.message,
        step: 'table_check' 
      }, { status: 500 })
    }

    const tableNames = tables?.map(t => t.table_name) || []
    console.log('存在するテーブル:', tableNames)

    // 5. RLSを無視してデータ確認
    console.log('5. データ存在確認（RLS無視）...')
    
    let knowledgeCount = 0
    let policyCount = 0
    let knowledgeError = null
    let policyError = null

    // ナレッジベース確認
    try {
      const { count } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
      knowledgeCount = count || 0
    } catch (err) {
      knowledgeError = err instanceof Error ? err.message : String(err)
    }

    // ポリシー確認
    try {
      const { count } = await supabase
        .from('return_policy_master')
        .select('*', { count: 'exact', head: true })
      policyCount = count || 0
    } catch (err) {
      policyError = err instanceof Error ? err.message : String(err)
    }

    console.log('=== テスト完了 ===')

    return NextResponse.json({
      success: true,
      message: 'Supabase接続テスト完了',
      results: {
        authentication: '✅ 認証成功',
        client: '✅ クライアント初期化済み',
        connection: '✅ 基本接続成功',
        tables: {
          found: tableNames,
          knowledge_base_exists: tableNames.includes('knowledge_base'),
          return_policy_master_exists: tableNames.includes('return_policy_master')
        },
        data: {
          knowledge_count: knowledgeCount,
          knowledge_error: knowledgeError,
          policy_count: policyCount,
          policy_error: policyError
        }
      }
    })

  } catch (error) {
    console.error('テスト中に予期しないエラー:', error)
    return NextResponse.json({ 
      error: '予期しないエラー',
      details: error instanceof Error ? error.message : String(error),
      step: 'unexpected_error' 
    }, { status: 500 })
  }
} 