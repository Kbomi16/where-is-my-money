'use client'

import { useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
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
import {
  Mail,
  Lock,
  User,
  UserPlus,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { doc, setDoc } from 'firebase/firestore'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  // ! 회원가입
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. 닉네임 유효성 검사
      if (nickname.trim().length < 2) {
        toast.error('닉네임은 최소 2자 이상이어야 해요!')
        return
      }

      // 2. 비밀번호 유효성 검사
      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/

      if (!passwordRegex.test(password)) {
        toast.error('비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요!')
        return
      }

      // 2. Firebase Auth 계정 생성
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      )
      const user = userCredential.user

      // 3. Auth 계정 생성이 성공했다면 후속 작업 진행
      if (user) {
        try {
          // 프로필과 DB 저장을 동시에 시도
          await Promise.all([
            updateProfile(user, {
              displayName: nickname,
              photoURL: 'ghost_1',
            }),
            setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              nickname: nickname,
              photoURL: 'ghost_1',
              createdAt: new Date().toISOString(),
              role: 'user',
            }),
          ])

          // ✅ 모든 저장이 확실히 성공했을 때만 성공 메시지 및 이동
          toast.success(`${nickname}님, 환영해요!`, {
            description: '회원가입이 완료되었어요.',
          })

          router.push('/')
        } catch (dbError) {
          console.error('DB 저장 오류:', dbError)
          toast.error('정보 저장 중 오류가 발생했습니다.', {
            description:
              '계정은 생성되었으나 프로필 설정에 실패했습니다. 마이페이지에서 수정해주세요.',
          })
          router.push('/')
        }
      }
    } catch (error: any) {
      let message = '회원가입에 실패했어요.'
      if (error.code === 'auth/email-already-in-use')
        message = '이미 사용 중인 이메일이에요.'
      if (error.code === 'auth/weak-password')
        message = '비밀번호가 너무 취약해요.'

      toast.error('오류 발생', { description: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* 배경 장식 포인트 (블루 톤) */}
      <div className="absolute -top-[15%] -right-[10%] h-[50%] w-[50%] rounded-full bg-[#1677ff]/10 blur-[120px]" />
      <div className="absolute -bottom-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-[#1677ff]/5 blur-[120px]" />

      <Card className="bg-card/60 w-full max-w-md border-none shadow-2xl backdrop-blur-xl">
        <CardHeader className="space-y-3 pb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1677ff] shadow-lg shadow-[#1677ff]/30">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-foreground text-3xl font-bold tracking-tight">
              시작하기
            </CardTitle>
            <CardDescription>
              내 돈이 어디로 나갔는지 기록할 준비 되셨나요?
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-5">
            {/* 닉네임 입력 필드 */}
            <div className="space-y-2">
              <Label
                htmlFor="nickname"
                className="text-foreground ml-1 text-sm font-semibold"
              >
                닉네임
              </Label>
              <div className="group relative">
                <User className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors group-focus-within:text-[#1677ff]" />
                <Input
                  id="nickname"
                  type="text"
                  placeholder="닉네임을 입력해주세요"
                  className="bg-background/50 border-border/50 h-12 rounded-xl pl-10 transition-all focus:border-[#1677ff] focus:ring-[#1677ff]/20"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-foreground ml-1 text-sm font-semibold"
              >
                이메일 주소
              </Label>
              <div className="group relative">
                <Mail className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors group-focus-within:text-[#1677ff]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="bg-background/50 border-border/50 h-12 rounded-xl pl-10 transition-all focus:border-[#1677ff] focus:ring-[#1677ff]/20"
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
                <Lock className="text-muted absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transition-colors group-focus-within:text-[#1677ff]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="8자 이상 (영문과 숫자 포함)"
                  className="bg-background/50 border-border/50 h-12 rounded-xl pl-10 transition-all focus:border-[#1677ff] focus:ring-[#1677ff]/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <p className="text-muted ml-1 flex items-center gap-1 text-[11px]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#1677ff]/70" />
                데이터는 암호화되어 안전하게 보관됩니다.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-6 pt-4">
            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-[#1677ff] text-base font-bold shadow-lg shadow-[#1677ff]/20 transition-all hover:scale-[1.02] hover:bg-[#1677ff]/90 active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? '가입 진행 중...' : '계정 만들기'}
              {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>

            <div className="border-border/50 w-full border-t pt-6 text-center">
              <p className="text-muted text-sm">
                이미 가입하셨나요?{' '}
                <Link
                  href="/login"
                  className="font-bold text-[#1677ff] underline-offset-4 hover:underline"
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
