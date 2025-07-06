# Cerafilm CS Agent

顧客サポート業務を効率化するAI搭載カスタマーサクセスツール

## 🚀 新機能: AI駆動型メール返信システム

### 📧 AI機能
- **メール解析**: GPT-4oによる自動カテゴリー分類、緊急度判定、感情分析
- **ナレッジベース検索**: Supabaseデータベースから関連情報を自動検索
- **AI返信文生成**: 選択されたナレッジと解析結果を組み合わせた適切な返信文を自動生成
- **手動修正機能**: AI生成文を手動で修正・確認してから送信

### 🔧 セットアップ

#### 1. 依存関係のインストール
```bash
npm install
```

#### 2. 環境変数の設定
`.env.local`ファイルを作成し、以下の設定を追加：

```bash
# Gmail API設定
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth.js設定
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# OpenAI API設定
OPENAI_API_KEY=sk-your-openai-api-key-here

# LINE API設定（オプション）
LINE_CHANNEL_ACCESS_TOKEN=your_line_channel_access_token
LINE_CHANNEL_SECRET=your_line_channel_secret
LINE_WEBHOOK_URL=http://localhost:3000/api/line/webhook
```

#### 3. OpenAI APIキーの取得
1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. APIキーを生成（GPT-4へのアクセス権限が必要）
3. `.env.local`の`OPENAI_API_KEY`に設定

#### 4. アプリケーションの起動
```bash
npm run dev
```

### 🎯 使用方法

1. **メール選択**: メール一覧から対応したいメールを選択
2. **AI解析**: 「AI解析」ボタンでメール内容を自動分析
3. **ナレッジ選択**: 関連するナレッジベース項目を選択（複数選択可能）
4. **AI返信生成**: 「AI返信生成」ボタンで返信文を自動生成
5. **手動修正**: 生成された返信文を必要に応じて修正
6. **送信確認**: 内容を確認してから送信

### 📊 機能詳細

#### メール解析機能
- カテゴリー自動分類（返品・交換、配送・納期、商品情報、技術サポート等）
- 緊急度判定（高・中・低）
- 感情分析（満足・中性・不満）
- キーワード抽出

#### AI返信文生成
- 株式会社Vallのトーンマナーに合わせた返信文
- 選択されたナレッジベース情報を活用
- 300-500文字の適切な長さ
- 敬語での丁寧な文体

### 🔒 セキュリティ
- 認証済みユーザーのみがAI機能を使用可能
- OpenAI APIキーは環境変数で安全に管理
- 送信前の必須確認プロセス

### 📈 分析・改善
- AI使用トークン数の追跡
- 返信品質の継続的な改善
- LLMOps機能による品質管理

---

## 🔧 既存機能

### Gmail統合
- Gmail API を使用したメール一覧取得
- リアルタイム更新（30秒間隔）
- メール詳細表示
- 認証済みユーザーのみアクセス可能

### LINE Bot
- 自動応答機能
- ユーザープロフィール取得
- Webhook対応

### カレンダー統合
- Google Calendar API連携
- 電話予約管理

### ナレッジベース
- Supabaseを使用したナレッジ管理
- カテゴリー別整理
- 全文検索機能

### LLMOps
- 会話履歴の記録
- フィードバック管理
- 品質メトリクス追跡

## 📞 サポート

設定や使用方法でご不明な点がありましたら、開発チームまでお問い合わせください。