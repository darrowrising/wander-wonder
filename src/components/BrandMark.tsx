import { Link } from 'react-router-dom'
import { Logo } from '@/components/WanderLogo'
import { product } from '@/config/product'
import { cn } from '@/lib/utils'

export { Logo } from '@/components/WanderLogo'

type BrandMarkProps = {
  className?: string
  as?: 'link' | 'text' | 'heading'
  showLogo?: boolean
}

function Wordmark() {
  return <span className="text-forest">{product.name}</span>
}

export function BrandMark({ className, as = 'text', showLogo = true }: BrandMarkProps) {
  const classes = cn('font-brand inline-flex items-center gap-2 tracking-wide', className)
  const inner = (
    <>
      {showLogo ? <Logo /> : null}
      <Wordmark />
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
