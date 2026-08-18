import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full rounded-lg border border-sand-300 bg-white px-3 text-base outline-none placeholder:text-sand-400 focus:border-forest focus:ring-2 focus:ring-forest/20',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
