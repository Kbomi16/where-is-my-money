'use client'

import { useState } from 'react'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
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
import { Mail, Lock, Wallet, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/')
    } catch (error: any) {
      alert('이메일이나 비밀번호가 올바르지 않습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* 배경 장식 포인트 */}
      <div className="bg-accent/5 absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />
      <div className="bg-income/5 absolute -right-[10%] -bottom-[10%] h-[40%] w-[40%] rounded-full blur-[120px]" />

      <Card className="bg-card/60 w-full max-w-md border-none shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-8 text-center">
          <div className="bg-accent shadow-accent/30 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-foreground text-3xl font-bold tracking-tight">
              로그인
            </CardTitle>
            <CardDescription className="text-muted text-balance">
              어디로 새어 나갔는지 기록할 준비 되셨나요?
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="ml-1 text-sm font-semibold">
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
              <div className="ml-1 flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-semibold">
                  비밀번호
                </Label>
                <Link href="#" className="text-accent text-xs hover:underline">
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <div className="group relative">
                <Lock className="text-muted group-focus-within:text-accent absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-background/50 border-border/50 focus:border-accent focus:ring-accent/20 h-12 rounded-xl pl-10 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 pt-4">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인하기'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="text-center">
              <p className="text-muted text-sm">
                처음이신가요?{' '}
                <Link
                  href="/signup"
                  className="text-accent font-bold underline-offset-4 hover:underline"
                >
                  지금 바로 가입하기
                </Link>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
