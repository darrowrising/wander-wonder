import { Link } from 'react-router-dom'
import { product } from '@/config/product'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  className?: string
  as?: 'link' | 'text' | 'heading'
}

function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt=""
      width={40}
      height={40}
      className={cn('size-9 shrink-0 rounded-lg', className)}
    />
  )
}

export function BrandMark({ className, as = 'text' }: BrandMarkProps) {
  const classes = cn('font-brand inline-flex items-center gap-2 text-emerald-900 tracking-wide', className)
  const inner = (
    <>
      <Logo />
      <span>{product.name}</span>
    </>
  )

  if (as === 'link') {
    return (
      <Link to="/" className={classes}>
        {inner}
      </Link>
    )
  }

  if (as === 'heading') {
    return <h1 className={classes}>{inner}</h1>
  }

  return <p className={classes}>{inner}</p>
}
