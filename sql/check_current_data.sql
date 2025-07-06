-- 現在のナレッジデータを確認するSQL

-- 1. テーブル構造の確認
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'knowledge_base' 
ORDER BY ordinal_position;

-- 2. 現在のナレッジデータ数
SELECT 
    category,
    COUNT(*) as count
FROM public.knowledge_base 
GROUP BY category
ORDER BY category;

-- 3. 返品関連ナレッジの確認
SELECT 
    id,
    title,
    category,
    tags,
    created_at,
    LENGTH(content) as content_length
FROM public.knowledge_base 
WHERE 
    '返品' = ANY(tags) OR 
    '返金' = ANY(tags) OR 
    title LIKE '%返品%' OR 
    title LIKE '%返金%'
ORDER BY created_at DESC;

-- 4. 全ナレッジの一覧（簡略版）
SELECT 
    id,
    title,
    category,
    tags,
    created_at
FROM public.knowledge_base 
ORDER BY created_at DESC;

-- 5. RLSポリシーの確認
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'knowledge_base';

-- 6. テーブルの権限確認
SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_name = 'knowledge_base'; 