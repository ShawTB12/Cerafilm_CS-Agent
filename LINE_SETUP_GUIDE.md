# LINE Messaging API統合 設定ガイド

## 📋 実装完了項目

✅ **依存関係の追加完了**
- @line/bot-sdk
- crypto (Node.js標準)

✅ **設定ファイル作成完了**
- `lib/line-config.ts` - LINE API設定
- `lib/line-client.ts` - LINE APIクライアント

✅ **APIエンドポイント作成完了**
- `/api/line/webhook` - LINE Webhook受信
- `/api/line/messages` - メッセージ送信・取得

✅ **AI自動応答機能**
- キーワードベース自動応答
- ユーザープロフィール取得
- フォロー/アンフォローイベント処理

## 🔧 LINE Official Account設定手順

### Step 1: Messaging APIの有効化

1. **LINE Developers Consoleにアクセス**
   - 画像の **「Messaging APIを利用する」** ボタンをクリック

2. **Provider情報の設定**
   - Provider名: `Cerafilm CS`
   - 確認情報を入力して作成

3. **チャネル作成**
   - チャネル名: `Cerafilm CS Bot`
   - チャネル説明: `カスタマーサクセス自動応答ボット`
   - 大業種: `サービス業`
   - 小業種: `IT・インターネット`

### Step 2: 必要な情報の取得

以下の情報を取得してください：

#### 2.1 Channel Access Token
1. **LINE Developers Console** → **Basic settings**
2. **Channel access token** セクション
3. **Issue** ボタンをクリック
4. 生成されたトークンをコピー

#### 2.2 Channel Secret
1. **LINE Developers Console** → **Basic settings**
2. **Channel secret** をコピー

### Step 3: 環境変数の設定

`.env.local` ファイルの以下の部分を更新してください：

```bash
# LINE Messaging API 設定
LINE_CHANNEL_ACCESS_TOKEN=取得したChannel Access Token
LINE_CHANNEL_SECRET=取得したChannel Secret
LINE_WEBHOOK_URL=http://localhost:3000/api/line/webhook
```

### Step 4: Webhook URLの設定

1. **LINE Developers Console** → **Messaging API**
2. **Webhook settings** セクション
3. **Webhook URL** に以下を設定：
   ```
   本番環境: https://your-domain.com/api/line/webhook
   開発環境: https://your-ngrok-url.ngrok.io/api/line/webhook
   ```
4. **Use webhook** を **Enabled** に変更
5. **Verify** ボタンで接続確認

### Step 5: 開発環境用のngrok設定

開発環境でLINE Webhookをテストするには：

```bash
# ngrokのインストール（初回のみ）
npm install -g ngrok

# 開発サーバーを起動
npm run dev

# 別ターミナルでngrok起動
ngrok http 3000

# 表示されるHTTPS URLをWebhook URLに設定
# 例: https://abc123.ngrok.io/api/line/webhook
```

### Step 6: ボット設定の調整

1. **LINE Developers Console** → **Messaging API**
2. **LINE Official Account features** セクション：
   - **Auto-reply messages**: **Disabled** （カスタム応答を使用）
   - **Greeting messages**: **Enabled** （任意）
   - **Webhooks**: **Enabled**

3. **Allow bot to join group chats**: 必要に応じて設定

## 🧪 動作テスト

### 1. 基本テスト
1. QRコードでボットを友達追加
2. 「こんにちは」メッセージを送信
3. 自動応答が返ってくることを確認

### 2. キーワードテスト
以下のメッセージで自動応答をテスト：
- 「返品について」→ 返品ガイド
- 「配送状況」→ 配送情報
- 「問い合わせ」→ サポート情報
- 「ありがとう」→ お礼メッセージ

### 3. Webhook確認
開発サーバーのログでWebhookイベントが受信されることを確認：
```bash
npm run dev
# LINE Webhookイベントのログが表示される
```

## 🔒 セキュリティ設定

### Channel Secretの検証
- すべてのWebhookリクエストで署名検証を実施
- 不正なリクエストは自動的に拒否

### アクセス制御
- Channel Access Tokenは環境変数で管理
- 本番環境では適切な権限設定を実施

## 📱 LINE Bot機能

### 実装済み機能
- ✅ テキストメッセージ送受信
- ✅ ユーザープロフィール取得
- ✅ AI自動応答（キーワードベース）
- ✅ フォロー/アンフォローイベント
- ✅ Webhook署名検証

### 今後追加予定
- 🔄 リッチメニュー対応
- 🔄 スタンプ・画像メッセージ対応
- 🔄 グループチャット対応
- 🔄 メッセージ履歴データベース保存
- 🔄 管理画面でのメッセージ履歴表示

## 🚨 トラブルシューティング

### よくあるエラー

#### 1. `Webhook verification failed`
**原因**: Webhook URLが正しく設定されていない
**解決**: ngrok URLが正しく設定されているか確認

#### 2. `Invalid signature`
**原因**: Channel Secretが間違っている
**解決**: `.env.local`のChannel Secretを確認

#### 3. `Failed to send message`
**原因**: Channel Access Tokenが無効
**解決**: トークンを再発行して設定し直す

#### 4. `User not found`
**原因**: ユーザーがボットをブロックしている
**解決**: ユーザーにブロック解除をお願いする

### デバッグ方法

1. **開発サーバーログの確認**
   ```bash
   npm run dev
   # コンソールでLINEイベントログを確認
   ```

2. **LINE Developers Consoleでの確認**
   - Webhook URL verification
   - Channel settings確認

3. **ngrok接続確認**
   ```bash
   curl https://your-ngrok-url.ngrok.io/api/line/webhook
   # 応答があることを確認
   ```

## 📞 サポート

設定でお困りの場合は、以下の情報と共にお問い合わせください：
- エラーメッセージの全文
- 設定した環境変数（値は隠してください）
- 開発サーバーのログ
- LINE Developers Consoleの設定画面スクリーンショット

---

設定完了後、実際のLINE公式アカウントと連携したカスタマーサポートボットが利用可能になります！ 