-- データ投入確認用クエリ

-- 1. ポリシーマスター確認
SELECT 'ポリシーマスター' as table_name, count(*) as record_count FROM public.return_policy_master;

-- 2. 返品条件確認
SELECT '返品条件' as table_name, count(*) as record_count FROM public.return_conditions;

-- 3. 対応方法確認
SELECT '対応方法' as table_name, count(*) as record_count FROM public.return_response_methods;

-- 4. 手続きフロー確認
SELECT '手続きフロー' as table_name, count(*) as record_count FROM public.return_procedures;

-- 5. キーワード確認
SELECT 'キーワード' as table_name, count(*) as record_count FROM public.policy_keywords;

-- 詳細データ確認
-- ポリシーマスター詳細
SELECT 
    'マスター詳細' as section,
    company_name,
    policy_version,
    effective_date
FROM public.return_policy_master;

-- 返品条件詳細
SELECT 
    '返品条件詳細' as section,
    condition_type,
    category,
    subcategory,
    time_limit_days
FROM public.return_conditions
ORDER BY condition_type, category;

-- 対応方法詳細
SELECT 
    '対応方法詳細' as section,
    response_type,
    shipping_cost_bearer,
    description
FROM public.return_response_methods;

-- 手続きフロー詳細
SELECT 
    '手続きフロー詳細' as section,
    step_number,
    step_description,
    is_mandatory
FROM public.return_procedures
ORDER BY step_number;

-- キーワード詳細
SELECT 
    'キーワード詳細' as section,
    keyword,
    keyword_type,
    weight
FROM public.policy_keywords
ORDER BY weight DESC, keyword_type; 