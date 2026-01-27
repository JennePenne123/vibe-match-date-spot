
# Fix Step 2 Icon Background in "How It Works" Section

## Problem
Step 2 ("Discover Matches") in the "How It Works" section uses `bg-gradient-earth` which renders as a dark gray/slate color. This is inconsistent with the vibrant Modern Design System used elsewhere.

## Current State

| Element | Location | Current Style |
|---------|----------|---------------|
| Step number badge | Line 293 | `bg-gradient-earth text-foreground` |
| Card illustration | Line 306 | `bg-gradient-earth` with `text-foreground/40` icon |

## Proposed Fix

### 1. Step Number Badge (Line 293)
Change from dark slate to vibrant secondary gradient:
- `bg-gradient-earth text-foreground` → `bg-gradient-secondary text-white`

### 2. Card Illustration (Line 306-307)
Change background and icon color for proper contrast:
- `bg-gradient-earth` → `bg-gradient-secondary`
- `text-foreground/40` → `text-white/70`

## Visual Comparison

| Step | Current | Updated |
|------|---------|---------|
| 1 | `bg-gradient-primary` (indigo→violet) | No change |
| 2 | `bg-gradient-earth` (dark gray) | `bg-gradient-secondary` (violet→pink) |
| 3 | `bg-primary` (indigo) | No change |

## Technical Details

### File to Modify
- `src/pages/Landing.tsx`

### Changes
```text
Line 293: bg-gradient-earth text-foreground → bg-gradient-secondary text-white
Line 306: bg-gradient-earth → bg-gradient-secondary  
Line 307: text-foreground/40 → text-white/70
```

## Result
All three steps in "How It Works" will have consistent vibrant gradient styling, matching the Modern Design System used throughout the landing page.
