# Supabaseセットアップガイド

## 🚀 Supabaseプロジェクトの作成

### 1. Supabaseアカウント作成
1. [Supabase](https://supabase.com)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでログイン（推奨）

### 2. 新規プロジェクト作成
1. 「New project」をクリック
2. プロジェクト名: `cerafilm-cs-agent`
3. データベースパスワードを設定（強力なパスワード推奨）
4. リージョン: `Northeast Asia (Tokyo)`を選択
5. 「Create new project」をクリック

### 3. 環境変数の設定
プロジェクト作成後、以下の情報を`.env.local`に追加：

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**取得方法:**
1. Supabaseダッシュボードの「Settings」→「API」
2. 「Project URL」をコピー → `NEXT_PUBLIC_SUPABASE_URL`
3. 「Project API keys」の「anon public」をコピー → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 📊 データベースセットアップ

### 1. SQL Editorでスキーマ実行
1. Supabaseダッシュボードの「SQL Editor」をクリック
2. `sql/schema.sql`の内容をコピー&ペースト
3. 「Run」をクリックしてスキーマを実行

### 2. 作成されるテーブル
- `knowledge_base` - ナレッジベース（FAQ、ポリシー等）
- `conversations` - 会話履歴（LLMOps用）
- `feedback` - フィードバック（品質評価）
- `quality_metrics` - 品質メトリクス

### 3. 初期データ
スキーマ実行により、以下の初期ナレッジが自動投入されます：
- 返品ポリシー
- 配送に関するFAQ
- 支払い方法について
- 商品の不具合・初期不良について
- 会員登録・ログインについて

## 🔐 セキュリティ設定

### Row Level Security (RLS)
自動的に以下のポリシーが適用されます：
- 認証済みユーザーのみがデータにアクセス可能
- 作成者のみが自身のナレッジを更新可能
- 会話履歴とフィードバックは認証必須

### 認証連携
現在のNextAuth設定と連携して、Supabaseの認証も利用できます。

## 🛠️ 使用方法

### ナレッジベースの操作
```typescript
import { KnowledgeService } from '@/lib/supabase'

// 全ナレッジ取得
const knowledge = await KnowledgeService.getAllKnowledge()

// カテゴリ別取得
const faqs = await KnowledgeService.getKnowledgeByCategory('FAQ')

// 検索
const results = await KnowledgeService.searchKnowledge('返品')

// 新規作成
const newKnowledge = await KnowledgeService.createKnowledge({
  title: '新しいFAQ',
  content: 'FAQ内容...',
  category: 'FAQ',
  tags: ['FAQ', '新規'],
  priority: 1,
  created_by: 'user-id',
  is_active: true
})
```

### LLMOps機能
```typescript
import { LLMOpsService } from '@/lib/supabase'

// 会話記録
await LLMOpsService.recordConversation({
  user_id: 'user123',
  platform: 'GMAIL',
  query: 'ユーザーの質問',
  response: 'AIの回答',
  knowledge_used: ['knowledge-id-1', 'knowledge-id-2'],
  response_time: 1500,
  session_id: 'session123'
})

// フィードバック記録
await LLMOpsService.recordFeedback({
  conversation_id: 'conv-id',
  feedback_type: 'THUMBS_UP',
  rating: 5,
  comment: '非常に役立ちました'
})
```

## 🚨 トラブルシューティング

### よくある問題

**1. 環境変数が読み込まれない**
- `.env.local`ファイルの場所を確認
- Next.jsサーバーを再起動
- 環境変数名に`NEXT_PUBLIC_`プレフィックスがあることを確認

**2. RLSエラーが発生する**
- 認証が正しく設定されているか確認
- Supabaseのポリシーが正しく適用されているか確認

**3. データベース接続エラー**
- Supabase URLとAPI Keyが正しいか確認
- プロジェクトが正しく作成されているか確認

### デバッグ方法
```typescript
// 接続テスト
import { supabase } from '@/lib/supabase'

const testConnection = async () => {
  const { data, error } = await supabase.from('knowledge_base').select('count')
  console.log('Connection test:', { data, error })
}
```

## 📈 次のステップ

1. **データベース管理画面の実装** (`/database`ページ)
2. **ナレッジベースAPIの実装** (`/api/knowledge`)
3. **LLMOps機能の統合**
4. **分析ダッシュボードの作成**

## 🔗 関連リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Next.js + Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security) 