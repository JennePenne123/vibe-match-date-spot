import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-lg border text-card-foreground transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-card shadow-sm hover:shadow-md hover:scale-[1.02] hover:-translate-y-1",
        elegant: "bg-card shadow-premium-md hover:shadow-premium-lg hover:scale-[1.02] hover:-translate-y-1 border-border/50",
        glass: "bg-glass-white backdrop-blur-glass border-white/20 shadow-glass hover:shadow-glass-strong hover:scale-[1.02]",
        premium: "bg-gradient-to-br from-brand-50 to-brand-100 shadow-premium-lg hover:shadow-premium-xl hover:scale-[1.02] border-brand-200/30",
        glow: "bg-card shadow-glow-md hover:shadow-glow-lg hover:scale-[1.02] border-brand-300/30",
        romantic: "bg-gradient-romantic border-pink-200/40 shadow-premium-md hover:shadow-premium-lg hover:scale-[1.02]",
        tinted: "bg-gradient-surface-light border-accent/20 shadow-premium-sm hover:shadow-premium-md hover:scale-[1.02]",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
