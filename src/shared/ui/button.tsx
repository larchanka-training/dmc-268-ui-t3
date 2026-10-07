import * as React from 'react'
import { type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'
import { buttonVariants } from './button-variants'
import { Slot } from 'radix-ui'

type ButtonProps = React.ComponentPropsWithoutRef<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

// forwardRef: on React 18 a ref is not a regular prop, and Radix triggers
// (`asChild`) need the element to restore focus and position popovers.
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', asChild = false, ...props },
  ref,
) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      ref={ref}
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
})

export { Button }
