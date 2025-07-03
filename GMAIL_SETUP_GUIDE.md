# Gmail API統合 設定ガイド

## 📋 Phase 1: 基盤設定 - 完了項目

✅ **依存関係の追加完了**
- googleapis
- next-auth 
- @auth/core
- nodemailer
- @types/nodemailer

✅ **設定ファイル作成完了**
- `lib/gmail-config.ts` - Gmail API設定
- `lib/gmail-client.ts` - Gmail APIクライアント
- `lib/auth.ts` - NextAuth.js設定

✅ **APIエンドポイント作成完了**
- `/api/auth/[...nextauth]` - NextAuth.js認証
- `/api/gmail/messages` - メール一覧取得
- `/api/gmail/messages/[id]` - 個別メール取得・操作
- `/api/gmail/send` - メール送信

✅ **UI改修完了**
- ログインページにGoogle認証追加
- SessionProvider設定

## 🔧 次の設定手順

### 1. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# Google OAuth 2.0 設定
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth.js 設定
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000

# Gmail API 設定
GMAIL_API_SCOPES=https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.modify
```

### 2. Google Cloud Console設定

#### 2.1 プロジェクトの作成・設定
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. **APIs & Services** → **Library** で「Gmail API」を検索
4. **Gmail API**を有効化

#### 2.2 OAuth 2.0認証情報の作成
1. **APIs & Services** → **Credentials** に移動
2. **+ CREATE CREDENTIALS** → **OAuth client ID** を選択
3. アプリケーションタイプ: **Web application**
4. 名前: `Cerafilm CS Gmail Integration`
5. **Authorized redirect URIs** に以下を追加：
   - `http://localhost:3000/api/auth/callback/google` (開発環境)
   - `https://your-domain.com/api/auth/callback/google` (本番環境)

#### 2.3 認証情報の取得
1. 作成されたOAuth 2.0クライアントから**Client ID**と**Client Secret**を取得
2. `.env.local`の`GOOGLE_CLIENT_ID`と`GOOGLE_CLIENT_SECRET`に設定

### 3. NextAuth Secret の生成

```bash
# ランダムなシークレットキーを生成
openssl rand -base64 32
```

生成された値を`.env.local`の`NEXTAUTH_SECRET`に設定してください。

### 4. アプリケーションの起動

```bash
npm run dev
```

### 5. 動作確認

1. `http://localhost:3000/login` にアクセス
2. **Googleアカウントでログイン** ボタンをクリック
3. Gmail APIへのアクセス許可を承認
4. ダッシュボードにリダイレクトされることを確認

## 🔒 セキュリティ注意事項

### 環境変数の管理
- `.env.local`ファイルは**絶対に**バージョン管理にコミットしないでください
- 本番環境では環境変数を適切に設定してください

### OAuth設定
- **Authorized redirect URIs**は実際に使用するドメインのみ設定
- 不要なスコープは要求しない
- 定期的にアクセストークンをローテーション

### APIレート制限
- Gmail APIには[使用量制限](https://developers.google.com/gmail/api/reference/quota)があります
- 1日あたり10億クォータユニット（通常は十分）
- 過度なAPI呼び出しを避ける実装を心がけてください

## 🚨 トラブルシューティング

### よくあるエラー

#### 1. `Error: Missing required environment variables`
**原因**: 環境変数が正しく設定されていない
**解決**: `.env.local`ファイルの内容を確認

#### 2. `redirect_uri_mismatch`
**原因**: Google Cloud ConsoleのAuthorized redirect URIsが正しくない
**解決**: リダイレクトURIを正確に設定

#### 3. `invalid_client`
**原因**: Client IDまたはClient Secretが間違っている
**解決**: Google Cloud Consoleから正しい値を取得

#### 4. `insufficient_scope`
**原因**: 必要なGmail APIスコープが許可されていない
**解決**: ログアウト後、再度認証して全てのスコープを許可

## 📞 サポート

設定でお困りの場合は、以下の情報と共にお問い合わせください：
- エラーメッセージの全文
- 設定した環境変数（値は隠してください）
- ブラウザのデベロッパーツールのエラーログ

## 📈 次のステップ（Phase 2以降）

Phase 1の設定が完了したら、以下の機能拡張を進めることができます：

1. **リアルタイム更新機能**
2. **AI自動回答機能**
3. **メール分類・ラベリング**
4. **パフォーマンス最適化**

---

設定完了後、実際のGmailアカウントと連携したメール管理が可能になります！ 