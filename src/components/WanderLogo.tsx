import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  framed?: boolean
}

export function Logo({ className, framed = true }: LogoProps) {
  if (framed) {
    return (
      <img
        src="/logo.png"
        alt=""
        width={40}
        height={40}
        className={cn('size-9 shrink-0 rounded-lg', className)}
      />
    )
  }

  return (
    <img
      src="/logo-mark.png"
      alt=""
      width={621}
      height={371}
      className={cn('h-36 w-auto shrink-0', className)}
    />
  )
}
