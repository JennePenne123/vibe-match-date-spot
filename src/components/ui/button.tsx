import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-400 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.02]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.02]",
        outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.02]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.02]",
        ghost: "hover:bg-accent hover:text-accent-foreground hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
        // Wellness-specific variants
        wellness: "bg-gradient-primary text-white shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.02] transition-all duration-400",
        calm: "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 hover:border-primary/30 backdrop-blur-sm hover:scale-[1.02]",
        earth: "bg-gradient-earth text-foreground shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.02]",
        // Legacy variants mapped to wellness equivalents
        premium: "bg-gradient-primary text-white shadow-gentle-lg hover:shadow-gentle-xl hover:scale-[1.02] transition-all duration-400",
        soft: "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 hover:border-primary/30 backdrop-blur-sm hover:scale-[1.02]",
        glass: "bg-card/60 backdrop-blur-lg border border-border/30 text-foreground hover:bg-card/80 shadow-gentle-md hover:scale-[1.02]",
        glow: "bg-gradient-primary text-white shadow-focus hover:shadow-gentle-lg hover:scale-[1.02]",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-lg",
        sm: "h-9 px-4 text-sm rounded-lg",
        default: "h-11 px-7 text-sm rounded-xl",  // Slightly larger with more padding
        lg: "h-12 px-9 text-base rounded-xl",
        xl: "h-14 px-12 text-lg rounded-2xl",
        icon: "h-11 w-11 rounded-xl",
        "icon-sm": "h-9 w-9 rounded-lg",
        "icon-lg": "h-14 w-14 rounded-2xl",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
