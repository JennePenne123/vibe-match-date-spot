import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-10 w-full rounded-xl text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
  {
    variants: {
      variant: {
        default: "border border-border/50 bg-card/50 backdrop-blur-sm px-4 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50",
        glass: "border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:border-white/40 focus-visible:shadow-glow-primary",
        "glass-strong": "border border-white/30 bg-white/15 backdrop-blur-lg px-4 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary/50",
        premium: "border border-primary/30 bg-primary/10 backdrop-blur-sm px-4 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/60 focus-visible:shadow-glow-primary",
        minimal: "border-0 border-b-2 border-border/50 bg-transparent px-0 py-2 rounded-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0",
        // Legacy mappings
        romantic: "border border-accent/30 bg-accent/10 backdrop-blur-sm px-4 py-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:border-accent/60 focus-visible:shadow-glow-accent",
        elegant: "border border-border/40 bg-card/80 backdrop-blur-sm px-4 py-2 shadow-gentle-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:shadow-gentle-md",
        floating: "border-0 border-b-2 border-border/50 bg-transparent px-0 py-2 rounded-none focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0",
      },
      inputSize: {
        default: "h-11",
        sm: "h-9 text-sm",
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
