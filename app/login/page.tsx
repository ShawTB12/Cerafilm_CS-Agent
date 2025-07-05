"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, Chrome, AlertCircle, Shield, Sparkles } from "lucide-react"
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-500/3 via-purple-500/2 to-cyan-500/3" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/8 to-purple-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-500/8 to-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.03),transparent_50%)]" />
      </div>

      {/* Login Card */}
      <Card className="relative w-full max-w-md bg-white/80 backdrop-blur-[32px] border border-gray-200/30 shadow-[0_25px_50px_rgba(0,0,0,0.08)] rounded-[24px] p-8 overflow-hidden">
        {/* Card Background Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/50 rounded-[24px]" />
        
        {/* Logo Area */}
        <div className="text-center mb-8 relative">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gray-100/80 to-gray-50/80 rounded-[24px] flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-sm border border-gray-200/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Image
              src="/vall_logo.png"
              alt="Cerafilm CS Agent Logo"
              width={48}
              height={48}
              className="object-contain relative z-10 drop-shadow-lg"
            />
          </div>
          <div className="relative">
            <h1 className="text-[32px] font-bold text-slate-900 mb-2 tracking-tight">
              Cerafilm CS Agent
            </h1>
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-slate-600">次世代カスタマーサクセス管理ツール</p>
            </div>
            <div className="flex items-center justify-center space-x-1">
              <Sparkles className="w-3 h-3 text-blue-500 animate-pulse" />
              <span className="text-xs text-slate-500 font-medium">Powered by Vall inc</span>
            </div>
          </div>
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
            className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-[16px] shadow-[0_8px_32px_rgba(59,130,246,0.3)] transition-all duration-300 ease-out hover:shadow-[0_12px_40px_rgba(59,130,246,0.4)] hover:scale-[1.02] transform flex items-center justify-center space-x-3 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Chrome className="w-6 h-6 text-white relative z-10" />
            <span className="relative z-10">{isLoading ? "認証中..." : "Googleアカウントでログイン"}</span>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-r from-white to-gray-50 px-3 text-slate-500 font-medium">または</span>
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
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 h-14 bg-gray-50/80 border-gray-200/50 rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-out text-slate-900 placeholder-slate-400 backdrop-blur-sm"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              パスワード
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-12 h-14 bg-gray-50/80 border-gray-200/50 rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ease-out text-slate-900 placeholder-slate-400 backdrop-blur-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors duration-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white font-semibold rounded-[16px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] transition-all duration-300 ease-out hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:scale-[1.02] transform relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="relative z-10">ログイン</span>
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <a href="#" className="text-sm text-slate-500 hover:text-blue-600 transition-colors duration-300">
            パスワードを忘れた方はこちら
          </a>
        </div>
      </Card>
    </div>
  )
}
