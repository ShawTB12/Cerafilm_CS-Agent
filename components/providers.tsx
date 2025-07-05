"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode, useEffect } from "react"
import { useRouter } from "next/navigation"

interface ProvidersProps {
  children: ReactNode
}

// エラーハンドリング用のコンポーネント
function ErrorBoundary({ children }: { children: ReactNode }) {
  const router = useRouter()

  useEffect(() => {
    // グローバルエラーハンドラー
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error)
      
      // NextAuthのエラーの場合は適切に処理
      if (event.error?.message?.includes('CLIENT_FETCH_ERROR')) {
        console.error('NextAuth client fetch error detected')
        // 必要に応じてリダイレクト
        if (event.error.message.includes('Failed to fetch')) {
          router.push('/login')
        }
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      
      // 認証関連のエラーの場合
      if (event.reason?.message?.includes('Failed to fetch') || 
          event.reason?.message?.includes('CLIENT_FETCH_ERROR')) {
        console.error('Authentication error detected in promise rejection')
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [router])

  return <>{children}</>
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider
      // セッションの自動更新を有効にする
      refetchInterval={5 * 60} // 5分ごと
      refetchOnWindowFocus={true}
      // エラー時の設定
      refetchWhenOffline={false}
    >
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </SessionProvider>
  )
} 