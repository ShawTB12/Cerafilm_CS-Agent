-- RLSを一時的に無効化（データ挿入用）
-- Supabaseで実行してください

-- ================================================
-- 1. RLSを一時的に無効化
-- ================================================

ALTER TABLE public.knowledge_base DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_policy_master DISABLE ROW LEVEL SECURITY;

-- ================================================
-- 2. 初期データを挿入
-- ================================================

-- 返品ポリシーマスター
INSERT INTO public.return_policy_master (company_name, policy_version, effective_date) 
VALUES ('株式会社Vall', '1.0', '2024-01-01')
ON CONFLICT DO NOTHING;

-- 基本的なナレッジベース
INSERT INTO public.knowledge_base (title, content, category, tags, priority, is_active) VALUES 
('返品ポリシー', '株式会社Vallでは、商品の品質に問題がある場合の返品・交換を承っております。商品のお受け取り日から3日以内にお問い合わせフォームよりご連絡ください。', 'POLICY', ARRAY['返品', '交換', 'ポリシー'], 2, true),
('お問い合わせ方法', 'カスタマーサポートへのお問い合わせは、メールまたは電話にて承っております。営業時間は平日10:00-17:00です。', 'FAQ', ARRAY['お問い合わせ', 'サポート', '営業時間'], 1, true),
('Cerafilm製品について', 'Cerafilmは健康食品です。医薬品ではないため、効果には個人差があります。', 'PRODUCT', ARRAY['Cerafilm', '健康食品', '効果'], 1, true),
('配送について', '通常、ご注文から3-5営業日以内に発送いたします。配送状況は追跡番号にてご確認いただけます。', 'FAQ', ARRAY['配送', '発送', '追跡'], 1, true),
('品質保証', '弊社では厳格な品質管理のもと、安全で高品質な製品をお届けしております。', 'PRODUCT', ARRAY['品質', '安全', '管理'], 1, true)
ON CONFLICT DO NOTHING;

-- ================================================
-- 3. RLSを再度有効化（開発環境では緩いポリシー）
-- ================================================

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_policy_master ENABLE ROW LEVEL SECURITY;

-- 開発環境用：すべてのユーザーに全アクセス許可
CREATE POLICY "Enable full access for all users" ON public.knowledge_base
    FOR ALL USING (true);

CREATE POLICY "Enable full access for all users" ON public.return_policy_master
    FOR ALL USING (true);

-- 実行完了確認
SELECT 'データ挿入とRLS設定完了！' as status; 