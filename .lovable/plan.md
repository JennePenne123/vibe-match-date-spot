

# Update Pages to Modern Design System

## Overview

This plan updates three pages (`Profile.tsx`, `VenueDetail.tsx`, and `MyFriends.tsx`) to use the modern design system's semantic color tokens and glass-morphism effects, removing all legacy hardcoded colors like `bg-gray-50`, `bg-white`, `text-gray-*`, and old wellness palette colors (`sage-*`, `sand-*`, `terracotta-*`).

---

## Current Issues Summary

| File | Legacy Colors Found | Line Numbers |
|------|---------------------|--------------|
| `Profile.tsx` | `bg-gray-50`, `bg-white`, `text-gray-600`, `hover:bg-gray-100` | 47-48, 75, 78, 83 |
| `VenueDetail.tsx` | `bg-gray-50`, `bg-white`, `border-gray-100`, `text-gray-*`, `bg-orange-50`, `border-orange-200`, `text-orange-700` | 46, 106, 108, 115, 118, 122, 129-133, 139-156, 180-188 |
| `MyFriends.tsx` | `sage-*`, `sand-*`, `terracotta-*` colors in stats cards | 58-64, 82-95 |

---

## Modern Design System Token Mapping

| Legacy Token | Modern Token |
|--------------|--------------|
| `bg-gray-50` | `bg-background` |
| `bg-white` | `bg-card` |
| `border-gray-100` | `border-border` |
| `text-gray-900` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground` |
| `hover:bg-gray-100` | `hover:bg-muted` |
| `bg-orange-50` | `bg-warning-50 dark:bg-warning-500/10` |
| `border-orange-200` | `border-warning-500/30` |
| `text-orange-700` | `text-warning-600 dark:text-warning-500` |
| `sage-*`, `sand-*`, `terracotta-*` | `indigo-*`, `violet-*`, `pink-*` (Modern palette) |

---

## File Changes

### 1. Profile.tsx

**Changes:**
- Line 47: `bg-gray-50` → `bg-background`
- Line 48: `text-gray-600` → `text-muted-foreground`
- Line 75: `bg-gray-50` → `bg-background`
- Line 78: `bg-white` → `bg-card`
- Line 83: `text-gray-600 hover:bg-gray-100` → `text-muted-foreground hover:bg-muted`

**Result:** Loading state and page background use semantic tokens; back button uses proper dark-mode-aware styling.

---

### 2. VenueDetail.tsx

**Changes:**

**Background & Container:**
- Line 46: `bg-gray-50` → `bg-background`

**Content Cards (lines 106, 139, 151):**
- `bg-white rounded-xl p-6 shadow-sm border border-gray-100` → `bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-gentle-sm border border-border/50`

**Text Colors:**
- Line 108: `text-gray-900` → `text-foreground`
- Line 115: `text-gray-600` → `text-muted-foreground`
- Lines 118, 122: `text-gray-600` → `text-muted-foreground`
- Line 140, 152: `text-gray-900` → `text-foreground`
- Lines 155-156, 161, 166, 180-188: `text-gray-400`, `text-gray-600`, `text-gray-500` → `text-muted-foreground`

**Discount Banner (lines 129-135):**
- `bg-orange-50 border-orange-200` → `bg-amber-500/10 border-amber-500/30`
- `text-orange-700` → `text-amber-500`

**Result:** All venue detail cards use glass-morphism styling with proper semantic tokens and dark mode support.

---

### 3. MyFriends.tsx

**Changes:**

**Add Friend Button (lines 58-64):**
- `text-sage-600 dark:text-sage-400 border-sage-200 dark:border-sage-800 hover:bg-sage-50 dark:hover:bg-sage-900/20` 
- → `text-primary border-border hover:bg-primary/10`

**Stats Cards (lines 82-95):**

Total Friends Card:
- `bg-gradient-to-br from-sage-50 to-sand-50 dark:from-sage-950/30 dark:to-sand-950/30 border-sage-200 dark:border-sage-800`
- → `bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20`
- `text-sage-600 dark:text-sage-400` → `text-indigo-400`

Online Now Card:
- `bg-gradient-to-br from-sand-50 to-terracotta-50 dark:from-sand-950/30 dark:to-terracotta-950/30 border-sand-200 dark:border-sand-800`
- → `bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-pink-500/20`
- `text-terracotta-600 dark:text-terracotta-400` → `text-pink-400`

**Result:** Stats cards use the modern Indigo/Violet/Pink palette with consistent glass-morphism effects.

---

## Visual Comparison

```text
BEFORE (Legacy)                    AFTER (Modern)
┌─────────────────────┐           ┌─────────────────────┐
│ bg-gray-50          │    →      │ bg-background       │
│ (Light gray)        │           │ (Slate-900 dark)    │
├─────────────────────┤           ├─────────────────────┤
│ bg-white            │    →      │ bg-card/80          │
│ (Solid white)       │           │ (Glass + blur)      │
├─────────────────────┤           ├─────────────────────┤
│ border-gray-100     │    →      │ border-border/50    │
│ (Light border)      │           │ (Semantic border)   │
├─────────────────────┤           ├─────────────────────┤
│ text-gray-900       │    →      │ text-foreground     │
│ (Hard-coded dark)   │           │ (Theme-aware)       │
├─────────────────────┤           ├─────────────────────┤
│ sage/terracotta     │    →      │ indigo/violet/pink  │
│ (Wellness colors)   │           │ (Modern vibrant)    │
└─────────────────────┘           └─────────────────────┘
```

---

## Implementation Steps

1. **Update Profile.tsx**
   - Replace loading state background and text
   - Replace main container background
   - Update back button styling

2. **Update VenueDetail.tsx**
   - Replace page background
   - Convert all content cards to glass-morphism style
   - Update all text colors to semantic tokens
   - Convert discount banner to amber/warning colors

3. **Update MyFriends.tsx**
   - Replace add friend button colors
   - Update both stats cards to modern gradient palette

---

## Technical Notes

- All changes use existing CSS variables from `src/index.css`
- Glass-morphism pattern: `bg-card/80 backdrop-blur-sm border-border/50`
- Card hover states already defined in tailwind config
- No new dependencies required
- Changes are backward compatible with both light and dark themes

