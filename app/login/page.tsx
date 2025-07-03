"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, Chrome, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError("")
      
      const result = await signIn("google", {
        redirect: false,
        callbackUrl: "/",
      })

      if (result?.error) {
        setError("Google認証に失敗しました。再度お試しください。")
      } else if (result?.ok) {
        // セッション確認後にリダイレクト
        const session = await getSession()
        if (session) {
          router.push("/")
        }
      }
    } catch (error) {
      setError("認証中にエラーが発生しました。")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex items-center justify-center p-4">
      {/* Background Glass Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-slate-500/5" />

      {/* Login Card */}
      <Card className="relative w-full max-w-md bg-white/55 backdrop-blur-[24px] border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.08)] rounded-[20px] p-8">
        {/* Logo Area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-[20px] flex items-center justify-center shadow-[0_4px_12px_rgba(45,142,255,0.3)]">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <h1 className="text-[28px] font-semibold text-slate-900 mb-2">Cerafilm CS</h1>
          <p className="text-sm text-slate-600">カスタマーサクセス管理ツール</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50/80 border-red-200/50 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Google Sign In */}
        <div className="space-y-4">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 bg-white hover:bg-gray-50 text-slate-700 font-medium rounded-[12px] border border-gray-200/50 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-150 ease-out hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] hover:scale-[1.02] flex items-center justify-center space-x-3"
          >
            <Chrome className="w-5 h-5 text-[#4285F4]" />
            <span>{isLoading ? "認証中..." : "Googleアカウントでログイン"}</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 px-2 text-slate-500">または</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <form className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              メールアドレス
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-12 bg-white/70 border-white/30 rounded-[12px] focus:ring-2 focus:ring-[#2D8EFF] focus:border-transparent transition-all duration-150 ease-out"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              パスワード
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-white/70 border-white/30 rounded-[12px] focus:ring-2 focus:ring-[#2D8EFF] focus:border-transparent transition-all duration-150 ease-out"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-150"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 bg-[#2D8EFF] hover:bg-[#2D8EFF]/90 text-white font-medium rounded-[12px] shadow-[0_4px_12px_rgba(45,142,255,0.3)] transition-all duration-150 ease-out hover:shadow-[0_6px_16px_rgba(45,142,255,0.4)] hover:scale-[1.02]"
          >
            ログイン
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-slate-500 hover:text-[#2D8EFF] transition-colors duration-150">
            パスワードを忘れた方はこちら
          </a>
        </div>
      </Card>
    </div>
  )
}
