-- 拡張スキーマ（PostgreSQL版）
-- 既存のknowledge_baseテーブルと併用可能な設計

-- ================================================
-- 1. 返品ポリシーマスターテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.return_policy_master (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name VARCHAR(100) NOT NULL DEFAULT '株式会社Vall',
    policy_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 2. 返品条件テーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.return_conditions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL,
    condition_type VARCHAR(20) NOT NULL CHECK (condition_type IN ('VALID', 'INVALID')),
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(100),
    condition_text TEXT NOT NULL,
    time_limit_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (policy_id) REFERENCES public.return_policy_master(id) ON DELETE CASCADE
);

-- ================================================
-- 3. 対応方法テーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.return_response_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('RETURN', 'EXCHANGE', 'RESEND')),
    description TEXT NOT NULL,
    shipping_cost_bearer VARCHAR(20) NOT NULL CHECK (shipping_cost_bearer IN ('CUSTOMER', 'COMPANY')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (policy_id) REFERENCES public.return_policy_master(id) ON DELETE CASCADE
);

-- ================================================
-- 4. 手続きフローテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.return_procedures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL,
    step_number INTEGER NOT NULL,
    step_description TEXT NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (policy_id) REFERENCES public.return_policy_master(id) ON DELETE CASCADE
);

-- ================================================
-- 5. RAG用キーワードテーブル
-- ================================================
CREATE TABLE IF NOT EXISTS public.policy_keywords (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_id UUID NOT NULL,
    keyword VARCHAR(100) NOT NULL,
    keyword_type VARCHAR(20) NOT NULL CHECK (keyword_type IN ('CONDITION', 'RESPONSE', 'PROCEDURE', 'EXCEPTION')),
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (policy_id) REFERENCES public.return_policy_master(id) ON DELETE CASCADE
);

-- ================================================
-- 6. インデックス
-- ================================================
CREATE INDEX IF NOT EXISTS idx_return_conditions_policy_id ON public.return_conditions(policy_id);
CREATE INDEX IF NOT EXISTS idx_return_conditions_type ON public.return_conditions(condition_type);
CREATE INDEX IF NOT EXISTS idx_return_response_methods_policy_id ON public.return_response_methods(policy_id);
CREATE INDEX IF NOT EXISTS idx_return_procedures_policy_id ON public.return_procedures(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_keywords_policy_id ON public.policy_keywords(policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_keywords_keyword ON public.policy_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_policy_keywords_type ON public.policy_keywords(keyword_type);

-- ================================================
-- 7. RLS（Row Level Security）
-- ================================================
ALTER TABLE public.return_policy_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_response_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_keywords ENABLE ROW LEVEL SECURITY;

-- 認証済みユーザーは読み取り可能
CREATE POLICY "Enable read access for authenticated users" ON public.return_policy_master
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.return_conditions
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.return_response_methods
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.return_procedures
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON public.policy_keywords
FOR SELECT USING (auth.role() = 'authenticated');

-- ================================================
-- 8. 更新日時の自動更新
-- ================================================
CREATE TRIGGER handle_return_policy_master_updated_at
    BEFORE UPDATE ON public.return_policy_master
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- 9. 初期データ投入
-- ================================================

-- 1. ポリシーマスター
INSERT INTO public.return_policy_master (company_name, policy_version, effective_date) 
VALUES ('株式会社Vall', '1.0', '2024-01-01')
ON CONFLICT DO NOTHING;

-- 現在作成されたポリシーIDを取得するための変数（後で使用）
-- PostgreSQLではこの方法でポリシーIDを取得して後続のINSERTで使用します

-- 2. 有効な返品条件
INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'VALID', '商品不具合', '注文内容相違', '届いた商品がご注文内容と異なる、または数量が不足している場合', 3
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'VALID', '商品不具合', '破損・欠陥', '商品に破損・欠陥などの不備があった場合', 3
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

-- 3. 無効な返品条件（免責事項）
INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'INVALID', '商品品質・体感', '個人差', 'Cerafilmは医薬品ではなく、健康食品に該当するため、すべての方に同じ効果や体感を保証するものではございません。体感に個人差があることを理由とした返品・交換はご容赦ください。', NULL
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'INVALID', '保管・受取', '長期不在', '長期間のご不在や受取遅延などにより、商品が劣化・変質した場合', NULL
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'INVALID', '保管・受取', '無断返送', '弊社にご連絡なく商品を一方的に返送された場合', NULL
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'INVALID', 'お客様都合', '主観的理由', '「イメージと違った」「味・使用感が好みでない」など個人の主観的理由', NULL
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'INVALID', 'お客様都合', '心変わり', '「気が変わった」などご注文後の心変わりや自己都合によるキャンセル', NULL
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_conditions (policy_id, condition_type, category, subcategory, condition_text, time_limit_days) 
SELECT rpm.id, 'INVALID', 'お客様都合', '他社比較', '他社製品との比較による相違を理由とした場合', NULL
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

-- 4. 対応方法
INSERT INTO public.return_response_methods (policy_id, response_type, description, shipping_cost_bearer) 
SELECT rpm.id, 'RETURN', '商品をご返送いただいた後、お支払金額の全額を返金いたします。', 'COMPANY'
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_response_methods (policy_id, response_type, description, shipping_cost_bearer) 
SELECT rpm.id, 'EXCHANGE', '商品をご返送いただいた後、同一商品を再送いたします。', 'COMPANY'
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_response_methods (policy_id, response_type, description, shipping_cost_bearer) 
SELECT rpm.id, 'RESEND', '品違い・品不足の場合、不足分の再送にて対応させていただきます。', 'COMPANY'
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

-- 5. 手続きフロー
INSERT INTO public.return_procedures (policy_id, step_number, step_description, is_mandatory) 
SELECT rpm.id, 1, '商品のお受け取り日から3日以内に、お問い合わせフォームよりご連絡ください。', TRUE
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_procedures (policy_id, step_number, step_description, is_mandatory) 
SELECT rpm.id, 2, '弊社にて状況を確認のうえ、返品または交換にて対応させていただきます。', TRUE
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_procedures (policy_id, step_number, step_description, is_mandatory) 
SELECT rpm.id, 3, 'ご連絡を確認後、弊社より返品手続きのご案内を差し上げます。', TRUE
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.return_procedures (policy_id, step_number, step_description, is_mandatory) 
SELECT rpm.id, 4, '※ご連絡のないまま商品をご返送いただいた場合、対応いたしかねます。', TRUE
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

-- 6. RAG用キーワード
INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '返品', 'CONDITION', 5
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '交換', 'RESPONSE', 5
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '3日以内', 'CONDITION', 4
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '破損', 'CONDITION', 4
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '欠陥', 'CONDITION', 4
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

-- 追加のキーワード
INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, 'Cerafilm', 'CONDITION', 3
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '健康食品', 'CONDITION', 3
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '体感', 'EXCEPTION', 3
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING;

INSERT INTO public.policy_keywords (policy_id, keyword, keyword_type, weight) 
SELECT rpm.id, '個人差', 'EXCEPTION', 3
FROM public.return_policy_master rpm WHERE rpm.company_name = '株式会社Vall' AND rpm.policy_version = '1.0'
ON CONFLICT DO NOTHING; 