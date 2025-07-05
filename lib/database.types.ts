// Supabaseの型定義（自動生成される予定）
export interface Database {
  public: {
    Tables: {
      knowledge_base: {
        Row: {
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
        Insert: {
          id?: string
          title: string
          content: string
          category: 'FAQ' | 'POLICY' | 'PRODUCT' | 'TROUBLESHOOT'
          tags?: string[]
          priority?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          content?: string
          category?: 'FAQ' | 'POLICY' | 'PRODUCT' | 'TROUBLESHOOT'
          tags?: string[]
          priority?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          is_active?: boolean
        }
      }
      conversations: {
        Row: {
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
        Insert: {
          id?: string
          user_id: string
          platform: 'GMAIL' | 'LINE' | 'CALL'
          query: string
          response: string
          knowledge_used?: string[]
          response_time?: number | null
          created_at?: string
          session_id?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          platform?: 'GMAIL' | 'LINE' | 'CALL'
          query?: string
          response?: string
          knowledge_used?: string[]
          response_time?: number | null
          created_at?: string
          session_id?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          conversation_id: string
          feedback_type: 'THUMBS_UP' | 'THUMBS_DOWN' | 'RATING'
          rating: number | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          feedback_type: 'THUMBS_UP' | 'THUMBS_DOWN' | 'RATING'
          rating?: number | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          feedback_type?: 'THUMBS_UP' | 'THUMBS_DOWN' | 'RATING'
          rating?: number | null
          comment?: string | null
          created_at?: string
        }
      }
      quality_metrics: {
        Row: {
          id: string
          conversation_id: string
          relevance_score: number | null
          accuracy_score: number | null
          helpfulness_score: number | null
          calculated_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          relevance_score?: number | null
          accuracy_score?: number | null
          helpfulness_score?: number | null
          calculated_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          relevance_score?: number | null
          accuracy_score?: number | null
          helpfulness_score?: number | null
          calculated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 