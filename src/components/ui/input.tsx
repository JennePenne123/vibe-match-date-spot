import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-md text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border border-input bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        glass: "border border-white/20 bg-glass-white backdrop-blur-glass px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 focus-visible:shadow-glow-sm",
        premium: "border border-brand-200 bg-gradient-to-br from-brand-50 to-white px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-0 focus-visible:shadow-premium-md",
        romantic: "border border-pink-200/60 bg-gradient-to-br from-pink-50 to-rose-50 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 focus-visible:ring-offset-0 focus-visible:shadow-glow-sm",
        elegant: "border border-neutral-200 bg-white px-3 py-2 shadow-premium-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-0 focus-visible:shadow-premium-md",
        floating: "border-0 border-b-2 border-input bg-transparent px-0 py-2 rounded-none focus-visible:outline-none focus-visible:border-brand-500 focus-visible:ring-0",
      },
      inputSize: {
        default: "h-10",
        sm: "h-8 text-sm",
        lg: "h-12 text-lg",
      }
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, inputSize }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
