'use client'

import * as React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'
import { toggleVariants } from './toggle-variants'
import { Toggle as TogglePrimitive } from 'radix-ui'

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle }
