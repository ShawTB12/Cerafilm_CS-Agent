"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

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
