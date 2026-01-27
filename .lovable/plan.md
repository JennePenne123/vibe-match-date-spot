
# Fix Middle Feature Card Icon Background

## Problem
The middle feature card ("Plan Together") on the Landing page uses `bg-gradient-earth`, which renders as a dark gray/slate color. This doesn't match the vibrant indigo/violet design system used by the other two cards.

## Current State (Line 217 in Landing.tsx)
```tsx
<div className="w-16 h-16 rounded-2xl bg-gradient-earth flex items-center justify-center ...">
  <Users className="w-8 h-8 text-foreground" />
</div>
```

## Proposed Fix
Replace `bg-gradient-earth` with `bg-gradient-secondary` and change the icon color from `text-foreground` to `text-white` for proper contrast.

```tsx
<div className="w-16 h-16 rounded-2xl bg-gradient-secondary flex items-center justify-center ...">
  <Users className="w-8 h-8 text-white" />
</div>
```

## Visual Comparison

| Card | Current Background | Updated Background |
|------|-------------------|-------------------|
| Left (Sparkles) | `bg-gradient-primary` (indigo→violet) | No change |
| Middle (Users) | `bg-gradient-earth` (dark gray) | `bg-gradient-secondary` (violet→pink) |
| Right (Heart) | `bg-primary` (indigo) | No change |

## Technical Details

### Gradient Definitions
- `gradient-primary`: indigo → violet
- `gradient-secondary`: violet → pink (the fix)
- `gradient-earth`: dark slate (the problem)

### File to Modify
- `src/pages/Landing.tsx` - Line 217-218

### Changes
1. Change `bg-gradient-earth` → `bg-gradient-secondary`
2. Change `text-foreground` → `text-white` (for contrast on vibrant background)

## Result
All three feature cards will have consistent vibrant icon backgrounds following the Modern Design System palette, creating visual harmony across the Features section.
