import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border text-card-foreground transition-all duration-400 ease-out",
  {
    variants: {
      variant: {
        default: "bg-card shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.01] hover:-translate-y-0.5",
        elegant: "bg-card shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.01] hover:-translate-y-0.5 border-border/40",
        glass: "bg-card/80 backdrop-blur-lg border-border/20 shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.01]",
        wellness: "bg-gradient-to-br from-card to-secondary/30 shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.01] border-border/30",
        earth: "bg-gradient-earth border-border/20 shadow-gentle-lg hover:shadow-gentle-xl hover:scale-[1.01]",
        calm: "bg-gradient-calm border-border/25 shadow-gentle-md hover:shadow-gentle-lg",
        // Legacy variants mapped to wellness equivalents
        premium: "bg-gradient-to-br from-card to-secondary/30 shadow-gentle-lg hover:shadow-gentle-xl hover:scale-[1.01] border-border/30",
        glow: "bg-card shadow-focus hover:shadow-gentle-lg hover:scale-[1.01] border-primary/20",
        romantic: "bg-gradient-calm border-border/30 shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.01]",
        tinted: "bg-gradient-surface-light border-border/20 shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.01]",
      },
      size: {
        default: "p-8",      // Increased from p-6 for generous padding
        sm: "p-5",           // Increased from p-4
        lg: "p-10",          // Increased from p-8
        xl: "p-12",          // New extra-large size
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
    className={cn("flex flex-col space-y-2", className)}
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
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
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
