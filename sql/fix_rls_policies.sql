-- RLSポリシー修正用SQL
-- Supabaseで実行してください

-- ================================================
-- 1. 既存のポリシーを削除
-- ================================================

-- knowledge_base テーブルの既存ポリシーを削除
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.knowledge_base;

-- return_policy_master テーブルの既存ポリシーを削除
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.return_policy_master;

-- ================================================
-- 2. 新しいポリシーを追加（全アクセス許可）
-- ================================================

-- knowledge_base テーブル：全アクセス許可
CREATE POLICY "Enable full access for authenticated users" ON public.knowledge_base
    FOR ALL USING (auth.role() = 'authenticated');

-- return_policy_master テーブル：全アクセス許可
CREATE POLICY "Enable full access for authenticated users" ON public.return_policy_master
    FOR ALL USING (auth.role() = 'authenticated');

-- ================================================
-- 3. 開発用：匿名ユーザーにもアクセス許可（必要に応じて）
-- ================================================

-- 開発環境では匿名ユーザーにもアクセス許可
CREATE POLICY "Enable full access for anon users" ON public.knowledge_base
    FOR ALL USING (auth.role() = 'anon');

CREATE POLICY "Enable full access for anon users" ON public.return_policy_master
    FOR ALL USING (auth.role() = 'anon');

-- 実行完了確認
SELECT 'RLSポリシー修正完了！' as status; 