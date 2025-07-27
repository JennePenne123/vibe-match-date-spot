import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Display heading component (Playfair Display)
const displayVariants = cva(
  "font-display font-bold tracking-tight text-foreground",
  {
    variants: {
      size: {
        "2xl": "text-5xl leading-none -tracking-tight",
        xl: "text-4xl leading-tight -tracking-tight", 
        lg: "text-3xl leading-tight -tracking-tight",
      },
      color: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
      }
    },
    defaultVariants: {
      size: "xl",
      color: "default",
    },
  }
);

export interface DisplayProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    VariantProps<typeof displayVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ className, size, color, as: Comp = "h1", ...props }, ref) => {
    return (
      <Comp
        className={cn(displayVariants({ size, color, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Display.displayName = "Display";

// Heading component (Inter)
const headingVariants = cva(
  "font-sans font-semibold text-foreground",
  {
    variants: {
      size: {
        h1: "text-2xl font-bold leading-tight",
        h2: "text-xl font-semibold leading-tight",
        h3: "text-lg font-semibold leading-snug",
        h4: "text-base font-semibold leading-snug",
        h5: "text-sm font-semibold leading-normal",
        h6: "text-xs font-semibold leading-normal",
      },
      color: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
      }
    },
    defaultVariants: {
      size: "h2",
      color: "default",
    },
  }
);

export interface HeadingProps
  extends Omit<React.HTMLAttributes<HTMLHeadingElement>, 'color'>,
    VariantProps<typeof headingVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, color, as, ...props }, ref) => {
    const Comp = as || (size === "h1" ? "h1" : size === "h2" ? "h2" : size === "h3" ? "h3" : size === "h4" ? "h4" : size === "h5" ? "h5" : "h6");
    
    return (
      <Comp
        className={cn(headingVariants({ size, color, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

// Text component
const textVariants = cva(
  "font-sans text-foreground",
  {
    variants: {
      size: {
        lg: "text-lg font-normal leading-relaxed",
        base: "text-base font-normal leading-relaxed",
        sm: "text-sm font-normal leading-normal",
        xs: "text-xs font-normal leading-normal",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      color: {
        default: "text-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        muted: "text-muted-foreground",
        accent: "text-accent-foreground",
      }
    },
    defaultVariants: {
      size: "base",
      weight: "normal",
      color: "default",
    },
  }
);

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLParagraphElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: "p" | "span" | "div" | "label";
}

const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, size, weight, color, as: Comp = "p", ...props }, ref) => {
    return (
      <Comp
        className={cn(textVariants({ size, weight, color, className }))}
        ref={ref as React.Ref<HTMLElement>}
        {...(props as any)}
      />
    );
  }
);
Text.displayName = "Text";

// Caption component
const captionVariants = cva(
  "font-sans text-xs font-medium leading-normal tracking-wide uppercase",
  {
    variants: {
      color: {
        default: "text-muted-foreground",
        primary: "text-primary",
        secondary: "text-secondary-foreground",
        accent: "text-accent-foreground",
      }
    },
    defaultVariants: {
      color: "default",
    },
  }
);

export interface CaptionProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof captionVariants> {
  as?: "span" | "div" | "label";
}

const Caption = React.forwardRef<HTMLElement, CaptionProps>(
  ({ className, color, as: Comp = "span", ...props }, ref) => {
    return (
      <Comp
        className={cn(captionVariants({ color, className }))}
        ref={ref as any}
        {...props}
      />
    );
  }
);
Caption.displayName = "Caption";

export { Display, displayVariants, Heading, headingVariants, Text, textVariants, Caption, captionVariants };