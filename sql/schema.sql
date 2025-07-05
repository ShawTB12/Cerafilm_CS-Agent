-- Supabaseデータベーススキーマ
-- 実行順序: 1. Extensions → 2. Tables → 3. Policies → 4. Functions

-- ================================================
-- 1. Extensions
-- ================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 2. Tables
-- ================================================

-- ナレッジベーステーブル
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('FAQ', 'POLICY', 'PRODUCT', 'TROUBLESHOOT')),
    tags TEXT[] DEFAULT '{}',
    priority INTEGER DEFAULT 0 CHECK (priority >= 0 AND priority <= 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', title || ' ' || content)
    ) STORED
);

-- 会話履歴テーブル
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('GMAIL', 'LINE', 'CALL')),
    query TEXT NOT NULL,
    response TEXT NOT NULL,
    knowledge_used UUID[] DEFAULT '{}',
    response_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT
);

-- フィードバックテーブル
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('THUMBS_UP', 'THUMBS_DOWN', 'RATING')),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 品質メトリクステーブル
CREATE TABLE IF NOT EXISTS public.quality_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    relevance_score FLOAT CHECK (relevance_score >= 0 AND relevance_score <= 1),
    accuracy_score FLOAT CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
    helpfulness_score FLOAT CHECK (helpfulness_score >= 0 AND helpfulness_score <= 1),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- 3. Indexes
-- ================================================

-- 全文検索インデックス
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search ON public.knowledge_base USING gin(search_vector);

-- パフォーマンス向上のためのインデックス
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_priority ON public.knowledge_base(priority);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON public.knowledge_base(is_active);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_platform ON public.conversations(platform);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_conversation_id ON public.feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_quality_metrics_conversation_id ON public.quality_metrics(conversation_id);

-- ================================================
-- 4. Row Level Security (RLS)
-- ================================================

-- RLSを有効化
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quality_metrics ENABLE ROW LEVEL SECURITY;

-- ナレッジベースのポリシー（認証済みユーザーは読み取り可能）
CREATE POLICY "Enable read access for authenticated users" ON public.knowledge_base
FOR SELECT USING (auth.role() = 'authenticated');

-- 認証済みユーザーは新しいナレッジを作成可能
CREATE POLICY "Enable insert for authenticated users" ON public.knowledge_base
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 作成者のみが更新可能
CREATE POLICY "Enable update for owners" ON public.knowledge_base
FOR UPDATE USING (auth.uid() = created_by);

-- 会話履歴のポリシー（認証済みユーザーは読み取り・挿入可能）
CREATE POLICY "Enable read access for authenticated users" ON public.conversations
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.conversations
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- フィードバックのポリシー（認証済みユーザーは読み取り・挿入可能）
CREATE POLICY "Enable read access for authenticated users" ON public.feedback
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.feedback
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 品質メトリクスのポリシー（認証済みユーザーは読み取り・挿入可能）
CREATE POLICY "Enable read access for authenticated users" ON public.quality_metrics
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON public.quality_metrics
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ================================================
-- 5. Functions
-- ================================================

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- knowledge_baseテーブルのupdated_atトリガー
CREATE TRIGGER handle_knowledge_base_updated_at
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ================================================
-- 6. 初期データ
-- ================================================

-- 初期データは別ファイル（update_return_policy.sql）で投入します
-- このファイルはテーブル作成のみを行います

-- ================================================
-- 7. 完了メッセージ
-- ================================================

-- 完了通知（この行は実行されません）
-- SELECT 'Database schema created successfully!' as message; 