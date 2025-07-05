-- 修正版基本スキーマ（正しい実行順序）
-- Supabaseで実行してください

-- ================================================
-- 1. 関数の定義（最初に実行）
-- ================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 2. ナレッジベーステーブル（既存システム用）
-- ================================================
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    tags TEXT[] DEFAULT '{}',
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID
);

-- ================================================
-- 3. 返品ポリシーマスターテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.return_policy_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL DEFAULT '株式会社Vall',
    policy_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 4. インデックス
-- ================================================
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_active ON public.knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_priority ON public.knowledge_base(priority);

-- ================================================
-- 5. トリガー（関数定義後に実行）
-- ================================================
DROP TRIGGER IF EXISTS handle_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER handle_knowledge_base_updated_at
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_return_policy_master_updated_at ON public.return_policy_master;
CREATE TRIGGER handle_return_policy_master_updated_at
    BEFORE UPDATE ON public.return_policy_master
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- 6. RLS（Row Level Security）
-- ================================================
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_policy_master ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.knowledge_base;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.return_policy_master;

-- 認証済みユーザーは読み取り可能
CREATE POLICY "Enable read access for authenticated users" ON public.knowledge_base
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.return_policy_master
FOR SELECT USING (auth.role() = 'authenticated');

-- ================================================
-- 7. 初期データ投入
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

-- 実行完了確認
SELECT 'スキーマ作成完了！' as status; 