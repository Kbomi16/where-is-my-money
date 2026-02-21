'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Mail, Lock, UserPlus, ShieldCheck, ArrowRight } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      router.push('/')
    } catch (error: any) {
      alert(error.message || '회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* 배경 장식 포인트 (전체 블루 톤) */}
      <div className="bg-accent/10 absolute -top-[15%] -right-[10%] h-[50%] w-[50%] rounded-full blur-[120px]" />
      <div className="bg-accent/5 absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />

      <Card className="bg-card/60 w-full max-w-md border-none shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-8 text-center">
          <div className="bg-accent shadow-accent/30 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-foreground text-3xl font-bold tracking-tight">
              회원가입
            </CardTitle>
          </div>
        </CardHeader>

        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-foreground ml-1 text-sm font-semibold"
              >
                이메일 주소
              </Label>
              <div className="group relative">
                <Mail className="text-muted group-focus-within:text-accent absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20 h-12 rounded-xl pl-10 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-foreground ml-1 text-sm font-semibold"
              >
                비밀번호 설정
              </Label>
              <div className="group relative">
                <Lock className="text-muted group-focus-within:text-accent absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="6자리 이상 비밀번호"
                  className="bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20 h-12 rounded-xl pl-10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-muted ml-1 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="text-accent/70 h-3.5 w-3.5" />{' '}
                개인정보는 안전하게 보호됩니다.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 pt-4">
            <Button
              type="submit"
              className="bg-accent hover:bg-accent/90 shadow-accent/20 h-12 w-full rounded-xl text-base font-bold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? '처리 중...' : '계정 만들기'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="border-border/50 w-full border-t pt-6 text-center">
              <p className="text-muted text-sm">
                이미 가입하셨나요?{' '}
                <Link
                  href="/login"
                  className="text-accent font-bold underline-offset-4 hover:underline"
                >
                  로그인하러 가기
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
