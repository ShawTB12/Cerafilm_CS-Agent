import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeService } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('ナレッジクリーンアップAPI: 開始')

    // 全ナレッジを取得
    const allKnowledge = await KnowledgeService.getAllKnowledge()
    console.log(`現在のナレッジ総数: ${allKnowledge.length}件`)

    // 重複データを特定し削除
    const duplicateIds = [
      // 古いCerafilm製品について（短いバージョン）
      '8ae3a070-5927-44d4-8d08-0e4298017bcf',
      // 古い重複データ
      '1dc26425-ebb2-4d77-9906-05946e1f7baa', // 品質保証
      'f06c0fa1-c242-4b70-b224-f931efef9c99', // 配送について
      '035d0d65-7274-47ec-8c68-8d42500a3ef9'  // お問い合わせ方法
    ]

    console.log('重複データの削除開始...')
    let deletedCount = 0
    
    for (const id of duplicateIds) {
      try {
        const knowledge = allKnowledge.find(k => k.id === id)
        if (knowledge) {
          await KnowledgeService.deleteKnowledge(id)
          console.log(`削除完了: ${knowledge.title} (${id})`)
          deletedCount++
        }
      } catch (error) {
        console.error(`削除エラー (${id}):`, error)
      }
    }

    // 更新後の状況を確認
    const updatedKnowledge = await KnowledgeService.getAllKnowledge()
    const returnPolicies = updatedKnowledge.filter(k => 
      k.tags.includes('返品') || k.tags.includes('返金')
    )
    
    console.log(`✅ クリーンアップ完了`)
    console.log(`✅ 削除したデータ: ${deletedCount}件`)
    console.log(`✅ 残存ナレッジ総数: ${updatedKnowledge.length}件`)
    console.log(`✅ 返品・返金関連: ${returnPolicies.length}件`)

    return NextResponse.json({
      success: true,
      message: 'ナレッジデータのクリーンアップが完了しました',
      data: {
        deletedCount,
        totalKnowledge: updatedKnowledge.length,
        returnPolicies: returnPolicies.length
      }
    })

  } catch (error) {
    console.error('クリーンアップエラー:', error)
    return NextResponse.json({
      success: false,
      error: 'クリーンアップに失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 