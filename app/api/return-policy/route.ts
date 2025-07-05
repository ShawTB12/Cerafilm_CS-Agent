import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse } from '@/lib/utils'

// GET /api/return-policy - 正規化された返品ポリシー取得
export async function GET(request: NextRequest) {
  try {
    console.log('返品ポリシーAPI: リクエスト開始')
    
    // 認証チェック（開発環境では一時的に無効化）
    const session = await getServerSession(authOptions)
    if (!session && process.env.NODE_ENV === 'production') {
      console.log('返品ポリシーAPI: 認証失敗')
      return createErrorResponse('認証が必要です', 401)
    }
    
    if (!session) {
      console.log('返品ポリシーAPI: 開発環境 - 認証スキップ')
    } else {
      console.log('返品ポリシーAPI: 認証成功', { user: session.user?.email })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'structured' // 'structured' or 'unified'
    const searchKeyword = searchParams.get('search')

    console.log('返品ポリシーAPI: パラメータ', { format, searchKeyword })

    // まず基本的なテーブルの存在を確認
    console.log('返品ポリシーAPI: テーブル存在チェック')
    const { data: tableCheck, error: tableError } = await supabase
      .from('return_policy_master')
      .select('id, company_name, policy_version, effective_date')
      .limit(1)

    if (tableError) {
      console.error('返品ポリシーAPI: テーブルエラー:', tableError)
      return createErrorResponse(`テーブルエラー: ${tableError.message}`, 500)
    }

    console.log('返品ポリシーAPI: テーブル存在確認OK')

    // 基本的なクエリから開始
    console.log('返品ポリシーAPI: クエリ実行開始')
    const { data: policyData, error: policyError } = await supabase
      .from('return_policy_master')
      .select('id, company_name, policy_version, effective_date')
      .eq('company_name', '株式会社Vall')
      .eq('policy_version', '1.0')

    console.log('返品ポリシーAPI: クエリ結果', { 
      error: policyError, 
      dataCount: policyData?.length || 0,
      data: policyData 
    })

    if (policyError) {
      console.error('返品ポリシーAPI: データベースエラー:', policyError)
      return createErrorResponse(`データベースエラー: ${policyError.message}`, 500)
    }

    if (!policyData || policyData.length === 0) {
      console.log('返品ポリシーAPI: データが見つかりません - 全件取得を試行')
      // 全件取得を試行
      const { data: allData, error: allError } = await supabase
        .from('return_policy_master')
        .select('*')
        .limit(10)
      
      console.log('返品ポリシーAPI: 全件取得結果', { 
        error: allError, 
        count: allData?.length || 0,
        data: allData 
      })
      
      // 条件なしで最初の1件を取得
      if (allData && allData.length > 0) {
        const firstPolicy = allData[0]
        console.log('返品ポリシーAPI: 最初のデータを使用:', firstPolicy)
        
        if (format === 'unified') {
          const unifiedPolicy = {
            id: firstPolicy.id,
            title: `返品ポリシー（${firstPolicy.company_name}）`,
            content: `返品ポリシー情報\n\n会社名: ${firstPolicy.company_name}\nバージョン: ${firstPolicy.policy_version}\n有効日: ${firstPolicy.effective_date}`,
            category: 'POLICY',
            tags: ['返品', 'ポリシー'],
            priority: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: null,
            is_active: true
          }

          return createSuccessResponse({
            policy: unifiedPolicy,
            format: 'unified'
          })
        } else {
          const structuredPolicy = {
            master: {
              id: firstPolicy.id,
              company_name: firstPolicy.company_name,
              policy_version: firstPolicy.policy_version,
              effective_date: firstPolicy.effective_date
            },
            conditions: {
              valid: [],
              invalid: []
            },
            responses: [],
            procedures: [],
            keywords: []
          }

          return createSuccessResponse({
            policy: structuredPolicy,
            format: 'structured'
          })
        }
      }
      
      return createSuccessResponse({
        policy: null,
        message: '返品ポリシーが見つかりませんでした'
      })
    }

    const policy = policyData[0]
    console.log('返品ポリシーAPI: データ取得成功', { 
      id: policy.id,
      company_name: policy.company_name,
      policy_version: policy.policy_version,
      effective_date: policy.effective_date
    })

    if (format === 'unified') {
      // 統一形式（既存システム互換）
      const unifiedPolicy = {
        id: policy.id,
        title: `返品ポリシー（${policy.company_name}）`,
        content: `返品ポリシー情報\n\n会社名: ${policy.company_name}\nバージョン: ${policy.policy_version}\n有効日: ${policy.effective_date}`,
        category: 'POLICY',
        tags: ['返品', 'ポリシー'],
        priority: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: null,
        is_active: true
      }

      return createSuccessResponse({
        policy: unifiedPolicy,
        format: 'unified'
      })
    } else {
      // 構造化形式（新システム）
      const structuredPolicy = {
        master: {
          id: policy.id,
          company_name: policy.company_name,
          policy_version: policy.policy_version,
          effective_date: policy.effective_date
        },
        conditions: {
          valid: [],
          invalid: []
        },
        responses: [],
        procedures: [],
        keywords: []
      }

      return createSuccessResponse({
        policy: structuredPolicy,
        format: 'structured'
      })
    }

  } catch (error) {
    console.error('返品ポリシー取得エラー:', error)
    console.error('エラースタック:', error instanceof Error ? error.stack : 'スタック情報なし')
    
    return createErrorResponse(
      error instanceof Error ? error.message : '返品ポリシーの取得に失敗しました',
      500
    )
  }
}

// 統一形式のコンテンツ生成
function generateUnifiedContent(policy: any): string {
  let content = `【返品ポリシー（必ずご確認ください）】\n\n`
  content += `${policy.company_name}では、お客様に安心して商品をご利用いただけるよう、発送前の検品・品質管理を徹底しております。\n\n`

  // 有効な条件
  const validConditions = policy.return_conditions?.filter(c => c.condition_type === 'VALID') || []
  if (validConditions.length > 0) {
    content += `■ 返品・交換対象となる場合\n`
    validConditions.forEach(condition => {
      content += `• ${condition.condition_text}\n`
    })
    content += `\n弊社にて状況を確認のうえ、返品または交換にて対応させていただきます。\n\n`
  }

  // 対応方法
  const responses = policy.return_response_methods || []
  if (responses.length > 0) {
    content += `■ 対応内容\n`
    responses.forEach(response => {
      const typeMap = {
        'RETURN': '【返品の場合】',
        'EXCHANGE': '【交換の場合】',
        'RESEND': '【品違い・品不足の場合】'
      }
      content += `${typeMap[response.response_type] || response.response_type}\n`
      content += `${response.description}\n\n`
    })
  }

  // 手続きフロー
  const procedures = policy.return_procedures?.sort((a, b) => a.step_number - b.step_number) || []
  if (procedures.length > 0) {
    content += `■ ご連絡・手続きのお願い\n`
    procedures.forEach(procedure => {
      content += `${procedure.step_description}\n`
    })
    content += `\n`
  }

  // 免責事項
  const invalidConditions = policy.return_conditions?.filter(c => c.condition_type === 'INVALID') || []
  if (invalidConditions.length > 0) {
    content += `■ 免責事項（下記の場合は返品・交換をお受けできません）\n`
    
    // カテゴリ別に整理
    const groupedConditions = invalidConditions.reduce((acc, condition) => {
      const category = condition.category
      if (!acc[category]) acc[category] = []
      acc[category].push(condition)
      return acc
    }, {})

    Object.entries(groupedConditions).forEach(([category, conditions]) => {
      content += `【${category}】\n`
      conditions.forEach(condition => {
        content += `• ${condition.condition_text}\n`
      })
      content += `\n`
    })
  }

  content += `ご不明な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。`

  return content
} 