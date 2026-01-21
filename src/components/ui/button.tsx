import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-all duration-300 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-gentle-md hover:shadow-glow-primary hover:scale-[1.02]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.02]",
        outline: "border-2 border-border bg-transparent hover:bg-white/10 hover:border-primary/50 text-foreground shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.02]",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-gentle-sm hover:shadow-glow-secondary hover:scale-[1.02]",
        ghost: "hover:bg-white/10 text-foreground hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
        // Modern glass-morphism variants
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-foreground hover:bg-white/20 shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.02]",
        "glass-primary": "bg-primary/20 backdrop-blur-md border border-primary/30 text-primary-foreground hover:bg-primary/30 shadow-gentle-md hover:shadow-glow-primary hover:scale-[1.02]",
        // Accent variants
        accent: "bg-gradient-accent text-accent-foreground shadow-gentle-md hover:shadow-glow-accent hover:scale-[1.02]",
        // Legacy variants
        premium: "bg-gradient-primary text-white shadow-gentle-lg hover:shadow-glow-primary hover:scale-[1.02] transition-all duration-300",
        soft: "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 hover:border-primary/40 backdrop-blur-sm hover:scale-[1.02]",
        glow: "bg-gradient-primary text-white shadow-glow-primary hover:shadow-glow-secondary hover:scale-[1.02]",
        wellness: "bg-gradient-primary text-white shadow-gentle-md hover:shadow-glow-primary hover:scale-[1.02] transition-all duration-300",
        calm: "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20 hover:border-primary/30 backdrop-blur-sm hover:scale-[1.02]",
        earth: "bg-gradient-secondary text-foreground shadow-gentle-md hover:shadow-glow-secondary hover:scale-[1.02]",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-lg",
        sm: "h-9 px-4 text-sm rounded-lg",
        default: "h-11 px-7 text-sm rounded-xl",
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
