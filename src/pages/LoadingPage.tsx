import { Logo } from '@/components/WanderLogo'
import { product } from '@/config/product'

export const STARTUP_HOLD_MS = 2400

export function LoadingPage() {
  return (
    <div
      className="startup-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="startup-stage">
        <Logo framed={false} className="startup-logo" />
        <p className="startup-wordmark font-brand text-3xl tracking-wide text-forest">
          {product.name}
        </p>
        <p className="startup-tagline">{product.tagline}</p>
        <p className="startup-status">Loading</p>
      </div>
    </div>
  )
}
