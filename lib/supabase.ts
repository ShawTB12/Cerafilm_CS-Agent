import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Supabaseクライアント
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// ナレッジベース関連の型定義
export interface KnowledgeBase {
  id: string
  title: string
  content: string
  category: 'FAQ' | 'POLICY' | 'PRODUCT' | 'TROUBLESHOOT'
  tags: string[]
  priority: number
  created_at: string
  updated_at: string
  created_by: string | null
  is_active: boolean
}

export interface Conversation {
  id: string
  user_id: string
  platform: 'GMAIL' | 'LINE' | 'CALL'
  query: string
  response: string
  knowledge_used: string[]
  response_time: number | null
  created_at: string
  session_id: string | null
}

export interface Feedback {
  id: string
  conversation_id: string
  feedback_type: 'THUMBS_UP' | 'THUMBS_DOWN' | 'RATING'
  rating: number | null
  comment: string | null
  created_at: string
}

export interface QualityMetrics {
  id: string
  conversation_id: string
  relevance_score: number | null
  accuracy_score: number | null
  helpfulness_score: number | null
  calculated_at: string
}

// ナレッジベース操作のヘルパー関数
export class KnowledgeService {
  // 全ナレッジ取得
  static async getAllKnowledge() {
    console.log('Supabase: getAllKnowledge 開始')
    
    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('updated_at', { ascending: false })

      console.log('Supabase: クエリ実行結果', { 
        error: error?.message || null, 
        dataCount: data?.length || 0 
      })

      if (error) {
        console.error('Supabase: データベースエラー:', error)
        throw error
      }
      
      console.log('Supabase: データ取得成功', { count: data.length })
      return data as KnowledgeBase[]
    } catch (err) {
      console.error('Supabase: getAllKnowledge エラー:', err)
      throw err
    }
  }

  // カテゴリ別ナレッジ取得
  static async getKnowledgeByCategory(category: string) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) throw error
    return data as KnowledgeBase[]
  }

  // 全文検索
  static async searchKnowledge(query: string) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('*')
      .textSearch('search_vector', query)
      .eq('is_active', true)
      .order('priority', { ascending: false })

    if (error) throw error
    return data as KnowledgeBase[]
  }

  // ナレッジ作成
  static async createKnowledge(knowledge: Omit<KnowledgeBase, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .insert([knowledge])
      .select()

    if (error) throw error
    return data[0] as KnowledgeBase
  }

  // ナレッジ更新
  static async updateKnowledge(id: string, updates: Partial<KnowledgeBase>) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as KnowledgeBase
  }

  // ナレッジ削除（論理削除）
  static async deleteKnowledge(id: string) {
    const { data, error } = await supabase
      .from('knowledge_base')
      .update({ is_active: false })
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as KnowledgeBase
  }
}

// LLMOps関連のヘルパー関数
export class LLMOpsService {
  // 会話記録
  static async recordConversation(conversation: Omit<Conversation, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('conversations')
      .insert([conversation])
      .select()

    if (error) throw error
    return data[0] as Conversation
  }

  // フィードバック記録
  static async recordFeedback(feedback: Omit<Feedback, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedback])
      .select()

    if (error) throw error
    return data[0] as Feedback
  }

  // 品質メトリクス記録
  static async recordQualityMetrics(metrics: Omit<QualityMetrics, 'id' | 'calculated_at'>) {
    const { data, error } = await supabase
      .from('quality_metrics')
      .insert([metrics])
      .select()

    if (error) throw error
    return data[0] as QualityMetrics
  }

  // 会話履歴取得（分析用）
  static async getConversationHistory(limit: number = 100) {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        feedback(*),
        quality_metrics(*)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  // 統計データ取得
  static async getAnalytics() {
    // 基本統計
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })

    const { count: totalFeedback } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })

    // 平均評価スコア
    const { data: avgScores } = await supabase
      .from('quality_metrics')
      .select('relevance_score, accuracy_score, helpfulness_score')

    const averages = avgScores?.reduce(
      (acc, score) => ({
        relevance: acc.relevance + (score.relevance_score || 0),
        accuracy: acc.accuracy + (score.accuracy_score || 0),
        helpfulness: acc.helpfulness + (score.helpfulness_score || 0),
      }),
      { relevance: 0, accuracy: 0, helpfulness: 0 }
    )

    const count = avgScores?.length || 1
    
    return {
      totalConversations: totalConversations || 0,
      totalFeedback: totalFeedback || 0,
      averageScores: {
        relevance: (averages?.relevance || 0) / count,
        accuracy: (averages?.accuracy || 0) / count,
        helpfulness: (averages?.helpfulness || 0) / count,
      },
    }
  }
} 