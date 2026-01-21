import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "rounded-2xl border text-card-foreground transition-all duration-300 ease-out",
  {
    variants: {
      variant: {
        default: "bg-card/80 backdrop-blur-sm border-border/40 shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.01] hover:-translate-y-0.5",
        elegant: "bg-card/90 backdrop-blur-md border-border/50 shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.01] hover:-translate-y-0.5",
        glass: "bg-white/10 backdrop-blur-md border-white/20 shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.01]",
        "glass-strong": "bg-white/15 backdrop-blur-lg border-white/25 shadow-gentle-lg hover:shadow-glow-primary hover:scale-[1.01]",
        modern: "bg-card/80 backdrop-blur-md border-border/40 shadow-gentle-md hover:shadow-glow-primary hover:border-primary/40 hover:scale-[1.02]",
        wellness: "bg-card/80 backdrop-blur-sm border-border/40 shadow-gentle-md hover:shadow-gentle-lg hover:scale-[1.01] hover:border-primary/30",
        earth: "bg-gradient-earth border-border/30 shadow-gentle-lg hover:shadow-gentle-xl hover:scale-[1.01]",
        calm: "bg-gradient-calm border-border/30 shadow-gentle-md hover:shadow-gentle-lg",
        // Legacy variants
        premium: "bg-card/90 backdrop-blur-lg border-border/40 shadow-gentle-lg hover:shadow-glow-primary hover:scale-[1.01] hover:border-primary/40",
        glow: "bg-card/80 backdrop-blur-sm shadow-glow-primary hover:shadow-glow-secondary hover:scale-[1.01] border-primary/30",
        romantic: "bg-gradient-secondary/10 backdrop-blur-sm border-accent/30 shadow-gentle-md hover:shadow-glow-accent hover:scale-[1.01]",
        tinted: "bg-gradient-meadow border-border/30 shadow-gentle-sm hover:shadow-gentle-md hover:scale-[1.01]",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
        xl: "p-10",
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
