import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        premium: "border-transparent bg-gradient-primary text-white shadow-premium-sm hover:shadow-premium-md hover:scale-105",
        glow: "border-transparent bg-brand-500 text-white shadow-glow-sm hover:shadow-glow-md hover:scale-105",
        romantic: "border-transparent bg-gradient-romantic text-white shadow-premium-sm hover:shadow-glow-sm hover:scale-105",
        glass: "border-white/20 bg-glass-white backdrop-blur-glass text-foreground shadow-glass hover:bg-white/30",
        success: "border-transparent bg-success-500 text-white hover:bg-success-600",
        warning: "border-transparent bg-warning-500 text-white hover:bg-warning-600",
        error: "border-transparent bg-error-500 text-white hover:bg-error-600",
        elegant: "border-neutral-200 bg-white text-neutral-700 shadow-premium-sm hover:shadow-premium-md hover:bg-neutral-50",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
