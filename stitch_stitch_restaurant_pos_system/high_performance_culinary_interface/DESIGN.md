---
name: High-Performance Culinary Interface
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#44474c'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#75777c'
  outline-variant: '#c5c6cc'
  surface-tint: '#555f6f'
  primary: '#0a1422'
  on-primary: '#ffffff'
  primary-container: '#1f2937'
  on-primary-container: '#8690a1'
  inverse-primary: '#bdc7d9'
  secondary: '#944a00'
  on-secondary: '#ffffff'
  secondary-container: '#fc8f34'
  on-secondary-container: '#663100'
  tertiary: '#001908'
  on-tertiary: '#ffffff'
  tertiary-container: '#003015'
  on-tertiary-container: '#16a558'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d9e3f6'
  primary-fixed-dim: '#bdc7d9'
  on-primary-fixed: '#121c2a'
  on-primary-fixed-variant: '#3d4756'
  secondary-fixed: '#ffdcc5'
  secondary-fixed-dim: '#ffb783'
  on-secondary-fixed: '#301400'
  on-secondary-fixed-variant: '#713700'
  tertiary-fixed: '#7efba4'
  tertiary-fixed-dim: '#61de8a'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005228'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  touch-target-min: 48px
  gutter: 1rem
  margin-mobile: 1rem
  margin-desktop: 2rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style
The design system focuses on high-utility professional environments where speed of recognition and execution are paramount. The brand personality is efficient, reliable, and subtly appetizing, combining the precision of an enterprise SaaS with the warmth of hospitality.

The design style is **Corporate / Modern** with a focus on functional density. It utilizes a high-contrast layout to ensure legibility under various kitchen and dining room lighting conditions. Visual noise is minimized to prioritize critical operational data like order status and table availability.

## Colors
The palette is engineered for rapid status assessment. 
- **Primary (Deep Charcoal):** Used for structural elements, sidebars, and primary navigation to provide a grounded, professional foundation.
- **Accent (Terracotta):** Reserved for primary calls to action (e.g., "Place Order", "Check Out") and interactive highlights.
- **Functional Palette:** Vibrant Green, Amber, and Soft Red are mapped directly to operational states (Available/Served, Occupied/Preparing, and Alert/New). 
- **Neutral:** A range of cool grays and off-whites are used for surface backgrounds to prevent eye strain during long shifts.

## Typography
Inter is chosen for its exceptional legibility and high x-height, which remains clear on POS tablets and handheld devices. 
- **Headlines:** Use tight letter-spacing and bold weights to anchor page sections.
- **Body:** Standardized at 16px for comfortable reading of menu items and notes.
- **Labels:** Uppercase styles are used for secondary metadata to distinguish it from primary content.
- **Data:** Numerical values (prices, table numbers, timestamps) should use tabular lining if available to ensure alignment in dense tables.

## Layout & Spacing
The layout follows a **Fluid Grid** system optimized for touch interaction. 
- **Grid:** 12-column system for desktop admin views, 4-column for mobile handhelds.
- **Touch-First:** All interactive elements must adhere to a minimum 48px touch target to accommodate fast-paced kitchen and floor environments.
- **Density:** Admin views (Inventory, Analytics) utilize a high-density spacing model with 8px paddings, while POS views use 16px-24px padding to prevent accidental taps.
- **Breakpoints:** Mobile (<640px), Tablet (640px-1024px), Desktop (>1024px).

## Elevation & Depth
This design system uses **Tonal Layers** to define hierarchy without relying on heavy shadows that can clutter the UI.
- **Level 0 (Background):** Neutral light gray (#F9FAFB).
- **Level 1 (Cards/Surface):** Pure white with a subtle 1px border (#E5E7EB).
- **Level 2 (Modals/Overlays):** White with a soft, diffused ambient shadow (10% opacity primary color) to indicate temporary focus.
- **State-Based Elevation:** Active items (like a selected table) use a 2px inset border of the Accent color rather than a shadow, maintaining a clean, professional aesthetic.

## Shapes
The shape language is modern and approachable.
- **Base Components:** 0.5rem (8px) for buttons, inputs, and small cards.
- **Large Containers:** 1rem (16px) for main dashboard sections and modals.
- **Full Rounded:** Used for status badges and "Pill" style chips to distinguish them from interactive square-ish buttons.

## Components
- **Buttons:** Primary buttons use the Accent color with white text. Secondary buttons use a primary-color outline. Size must be at least 48px height for touch safety.
- **Status Badges:** High-contrast capsules using the functional color palette. Text should be bold for readability.
- **Order Cards:** Feature a left-hand "Status Strip" (4px width) using the specific border tokens: Red (New), Yellow (Preparing), Green (Ready).
- **Data Tables:** Zebra-striped for long lists. Row height is fixed at 56px for tablet-friendly scrolling.
- **Table Map Icons:** Square or circular elements with a 2px border indicating occupancy status (Amber for occupied, Green for free, Red for "Needs Cleaning").
- **Input Fields:** Large text inputs with 12px internal padding and a prominent focus state using a 2px Accent border.