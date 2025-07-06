import { NextRequest, NextResponse } from 'next/server'
import { KnowledgeService } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('返品ポリシー更新API: 開始')

    // 既存の返品関連ポリシーを削除
    console.log('1. 既存の返品関連ポリシーを削除中...')
    const allKnowledge = await KnowledgeService.getAllKnowledge()
    const oldPolicies = allKnowledge.filter(k => 
      k.title.includes('返品') || 
      k.title.includes('返金') || 
      k.title.includes('免責')
    )
    
    for (const policy of oldPolicies) {
      await KnowledgeService.deleteKnowledge(policy.id)
      console.log(`削除完了: ${policy.title}`)
    }

    // 正確な返品・返金ポリシーを挿入
    console.log('2. 正確な返品・返金ポリシーを挿入中...')
    
    const newPolicies = [
      {
        title: '返品ポリシー（基本情報）',
        content: `株式会社Vallでは、お客様に安心して商品をご利用いただけるよう、発送前の検品・品質管理を徹底しております。しかしながら、万が一以下のような不具合がございましたら、商品のお受け取り日から3日以内に、お問い合わせフォームよりご連絡ください。

■ 返品・交換対象となる場合
・届いた商品がご注文内容と異なる、または数量が不足している場合
・商品に破損・欠陥などの不備があった場合

弊社にて状況を確認のうえ、返品または交換にて対応させていただきます。

■ 対応内容
【返品の場合】
商品をご返送いただいた後、お支払金額の全額を返金いたします。

【交換の場合】
商品をご返送いただいた後、同一商品を再送いたします。

【送料について】
上記に該当する正当な理由による返品・交換にかかる返送送料は弊社にて負担いたします。

【品違い・品不足の場合】
不足分の再送にて対応させていただきます。`,
        category: 'POLICY',
        tags: ['返品', '交換', 'ポリシー', '対応条件', '不具合'],
        priority: 3,
        is_active: true
      },
      {
        title: '返品免責事項（商品品質・体感）',
        content: `■ 免責事項（下記の場合は返品・交換をお受けできません）

＜商品品質・体感に関するもの＞
Cerafilmは医薬品ではなく、健康食品に該当するため、すべての方に同じ効果や体感を保証するものではございません。
体感に個人差があることを理由とした返品・交換はご容赦ください。`,
        category: 'POLICY',
        tags: ['返品', '免責', '健康食品', '効果', '個人差', 'Cerafilm'],
        priority: 3,
        is_active: true
      },
      {
        title: '返品免責事項（保管・受取）',
        content: `■ 免責事項（下記の場合は返品・交換をお受けできません）

＜保管・受取に関するもの＞
・長期間のご不在や受取遅延などにより、商品が劣化・変質した場合
・弊社にご連絡なく商品を一方的に返送された場合`,
        category: 'POLICY',
        tags: ['返品', '免責', '保管', '受取', '遅延'],
        priority: 3,
        is_active: true
      },
      {
        title: '返品免責事項（お客様都合・その他）',
        content: `■ 免責事項（下記の場合は返品・交換をお受けできません）

＜お客様都合によるもの＞
・「イメージと違った」「味・使用感が好みでない」など個人の主観的理由
・「気が変わった」などご注文後の心変わりや自己都合によるキャンセル
・他社製品との比較による相違を理由とした場合

＜その他＞
・返品にご協力いただけない場合
・予期せぬ事故・災害などによるトラブル`,
        category: 'POLICY',
        tags: ['返品', '免責', 'お客様都合', '主観', 'キャンセル'],
        priority: 3,
        is_active: true
      },
      {
        title: '返品手続きについて',
        content: `■ ご連絡・手続きのお願い
ご返品・交換をご希望の場合は、必ず事前に弊社までご連絡ください。
ご連絡を確認後、弊社より返品手続きのご案内を差し上げます。
※ご連絡のないまま商品をご返送いただいた場合、対応いたしかねます。

ご不明な点がございましたら、お気軽にカスタマーサポートまでお問い合わせください。`,
        category: 'POLICY',
        tags: ['返品', '手続き', '連絡', '事前相談'],
        priority: 3,
        is_active: true
      },
      {
        title: '全額返金保証制度（基本情報）',
        content: `全額返金保証制度について（必ずご確認ください）
株式会社Vallでは、お客様に安心してお試しいただくため、初回ご購入分に限り、全額返金保証制度をご用意しております。以下の内容をご確認のうえ、お手続きください。

■ 返金の対象について
・返金対象は、初めてご購入されたCerafilmの初回お受け取り分に限ります。
・「全額返金保証制度」は、商品代金（税込）のみが対象です。決済手数料・送料は返金対象外となります。
・ご利用にあたっては、ご請求金額の一旦のお支払い（ご入金）をお願いしております。お支払いの確認が取れない場合は、返金いたしかねます。
・保証制度をご利用の場合、対象商品の定期コースは同時に解約となります。

■ 返金方法について
返金は、ご注文者様名義の銀行口座へのお振込みに限らせていただきます。現金書留やその他の方法には対応いたしかねます。`,
        category: 'POLICY',
        tags: ['返金', '保証', '初回限定', '銀行振込', 'Cerafilm'],
        priority: 3,
        is_active: true
      },
      {
        title: '全額返金手続きの流れ',
        content: `■ 返金手続きの流れ
1. お支払いの完了
2. 全額返金保証の申請
3. Cerafilmのパッケージご返送

上記3点を弊社にて確認後、翌月末までに返金処理を行います。
※申請内容に不備があった場合は、弊社よりメールまたはお電話にてご連絡差し上げます。

■ ご返送時の注意事項
・ご返送時の送料はお客様ご負担となります。
・輸送中の紛失防止のため、「配送確認」が取れる方法（追跡可能な配送）でご返送ください。`,
        category: 'POLICY',
        tags: ['返金', '手続き', 'パッケージ返送', '配送確認'],
        priority: 3,
        is_active: true
      },
      {
        title: '全額返金対象外条件',
        content: `■ 以下に該当する場合、返金を承ることができませんのでご注意ください
・商品がすべて未開封の場合
・初回分として複数個の商品をご購入された場合、使用済みのパッケージと未開封分をあわせて返送されていない場合
・NP後払いをご利用で、お支払い（ご入金）の確認ができない場合
・パッケージの返送先が異なる、または確認が取れない場合
・楽天市場、Amazon、Yahoo!ショッピングなど、弊社公式サイト以外からのご注文
・転売サイト（フリマアプリ等）からのご購入

何かご不明点がございましたら、お気軽に弊社カスタマーサポートまでお問い合わせください。`,
        category: 'POLICY',
        tags: ['返金', '対象外', '未開封', 'NP後払い', '転売サイト'],
        priority: 3,
        is_active: true
      }
    ]

    // 各ポリシーを挿入
    const createdPolicies = []
    for (const policy of newPolicies) {
      console.log(`   - ${policy.title} を挿入中...`)
      try {
        const created = await KnowledgeService.createKnowledge(policy)
        createdPolicies.push(created)
        console.log(`   ✅ ${policy.title} を挿入しました`)
      } catch (error) {
        console.error(`   ❌ ${policy.title} の挿入エラー:`, error)
      }
    }

    // Cerafilm製品についての情報も更新
    console.log('3. Cerafilm製品情報を更新中...')
    const cerafilmProduct = allKnowledge.find(k => k.title === 'Cerafilm製品について')
    if (cerafilmProduct) {
      const updatedContent = 'Cerafilmは医薬品ではなく、健康食品に該当するため、すべての方に同じ効果や体感を保証するものではございません。体感に個人差があることを理由とした返品・交換はご容赦ください。'
      await KnowledgeService.updateKnowledge(cerafilmProduct.id, {
        ...cerafilmProduct,
        content: updatedContent
      })
      console.log('✅ Cerafilm製品情報を更新しました')
    }

    // 更新後のナレッジ数を確認
    console.log('4. 更新後のナレッジ数を確認中...')
    const updatedKnowledge = await KnowledgeService.getAllKnowledge()
    const returnPolicies = updatedKnowledge.filter(k => k.tags.includes('返品') || k.tags.includes('返金'))
    
    console.log(`✅ 現在のナレッジ総数: ${updatedKnowledge.length}件`)
    console.log(`✅ 返品・返金関連ナレッジ: ${returnPolicies.length}件`)

    return NextResponse.json({
      success: true,
      message: '正確な返品・返金ポリシーの更新が完了しました',
      data: {
        totalKnowledge: updatedKnowledge.length,
        returnPolicies: returnPolicies.length,
        createdPolicies: createdPolicies.length
      }
    })

  } catch (error) {
    console.error('返品ポリシー更新エラー:', error)
    return NextResponse.json({
      success: false,
      error: '返品ポリシーの更新に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 