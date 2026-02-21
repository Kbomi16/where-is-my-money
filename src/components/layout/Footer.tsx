export default function Footer() {
  return (
    <footer className="border-border bg-card w-full border-t py-8">
      <div className="base-layout flex flex-col items-center justify-between gap-4 md:flex-row">
        <p className="text-muted text-sm">
          © 2026 Where did it go? 내 돈 다 어디 갔니.
        </p>
        <div className="text-muted flex gap-6 text-sm">
          <span className="hover:text-foreground cursor-pointer">문의하기</span>
        </div>
      </div>
    </footer>
  )
}
