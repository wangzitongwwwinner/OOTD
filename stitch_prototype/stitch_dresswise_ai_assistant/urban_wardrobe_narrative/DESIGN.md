---
name: Urban Wardrobe Narrative
colors:
  surface: '#faf9f7'
  surface-dim: '#dadad8'
  surface-bright: '#faf9f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeec'
  surface-container-high: '#e9e8e6'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1b'
  on-surface-variant: '#4d4540'
  inverse-surface: '#2f3130'
  inverse-on-surface: '#f1f1ef'
  outline: '#7e756f'
  outline-variant: '#cfc4bd'
  surface-tint: '#635d5a'
  primary: '#181512'
  on-primary: '#ffffff'
  primary-container: '#2d2926'
  on-primary-container: '#96908b'
  inverse-primary: '#cdc5c0'
  secondary: '#685c50'
  on-secondary: '#ffffff'
  secondary-container: '#f0e0d0'
  on-secondary-container: '#6e6256'
  tertiary: '#161612'
  on-tertiary: '#ffffff'
  tertiary-container: '#2b2a26'
  on-tertiary-container: '#94918b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e9e1dc'
  primary-fixed-dim: '#cdc5c0'
  on-primary-fixed: '#1e1b18'
  on-primary-fixed-variant: '#4b4642'
  secondary-fixed: '#f0e0d0'
  secondary-fixed-dim: '#d3c4b5'
  on-secondary-fixed: '#221a11'
  on-secondary-fixed-variant: '#4f453a'
  tertiary-fixed: '#e6e2db'
  tertiary-fixed-dim: '#cac6bf'
  on-tertiary-fixed: '#1c1c17'
  on-tertiary-fixed-variant: '#484742'
  background: '#faf9f7'
  on-background: '#1a1c1b'
  surface-variant: '#e3e2e0'
typography:
  display-serif:
    fontFamily: Noto Serif SC
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Noto Serif SC
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-main:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  margin-page: 24px
  gutter-grid: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 48px
---

## Brand & Style

This design system is built for the sophisticated urbanite, functioning as an intelligent personal stylist that feels more like a quiet conversation than a utility tool. The personality is **Sophisticated, Warm, and Calm**, acting as a companion that simplifies the morning routine through editorial clarity.

The aesthetic follows a **Modern Editorial Minimalism** movement. It draws inspiration from high-end lifestyle journals and premium architectural spaces. The interface prioritizes large, immersive imagery of textiles and street photography, balanced by a generous use of whitespace (negative space) to reduce cognitive load. Visual elements are treated with a "soft touch"—avoiding harsh lines in favor of subtle depth and organic transitions, reminiscent of a well-curated fashion magazine.

## Colors

The palette is inspired by natural fibers—linen, wool, and stone—reflecting an urban lifestyle that values quality over quantity.

- **Primary (#2D2926):** "Onyx Wool." A deep, soft charcoal used for primary text and high-contrast elements. Never pure black.
- **Secondary (#A7998B):** "Warm Taupe." Used for sub-headers, icons, and secondary information.
- **Tertiary (#E5E1DA):** "Pebble." A soft mid-tone for borders, dividers, and disabled states.
- **Neutral (#F9F8F6):** "Canvas." The primary background color, providing a warmer, more premium feel than pure white.
- **Accent (#D4A373):** "Camel." A soft tan used sparingly for "Recommended" badges or active status indicators.

Maintain a low-saturation environment. Interaction states should use subtle opacity shifts rather than aggressive color changes.

## Typography

The typography strategy employs a high-contrast pairing between a classic serif and a contemporary geometric sans-serif.

1.  **Headlines (Serif):** Use *Noto Serif SC* for emotional moments, weather summaries, and daily "What to Wear" titles. This creates the editorial "magazine" feel.
2.  **Information (Sans-Serif):** Use *Plus Jakarta Sans* (or *PingFang SC* for Chinese) for technical details, garment descriptions, and UI controls to ensure readability and a modern edge.
3.  **Hierarchy:** Use exaggerated scale for "Display" text to create focal points on the mobile screen. Use the `label-caps` style for category headers (e.g., "OUTERWEAR", "ACCESSORIES") to provide a structural, rhythmic feel to the layout.

## Layout & Spacing

The system uses a **Fluid Grid** model optimized for the WeChat Mini Program environment (usually 375pt-414pt width). 

- **Margins:** A generous 24px side margin is mandatory to maintain the "premium" breathing room. 
- **The 8px Rhythm:** All spacing should be multiples of 8.
- **Vertical Rhythm:** Use `stack-xl` (48px) to separate major content sections (e.g., separating the Weather Hero from the Outfit Suggestion).
- **Asymmetric Balance:** Occasionally offset images or text blocks slightly to mimic modern editorial design, breaking the rigid central alignment of standard apps.

## Elevation & Depth

To maintain a soft, lifestyle aesthetic, this system avoids heavy shadows and traditional skeuomorphism.

- **Tonal Layering:** Depth is primarily communicated through color. Content cards sit on `Neutral` backgrounds using a pure white (#FFFFFF) surface to appear slightly lifted.
- **Soft Ambient Shadows:** Where elevation is necessary (e.g., the primary floating "Log Outfit" button), use extremely diffused shadows: `Y: 4, Blur: 20, Color: rgba(45, 41, 38, 0.05)`.
- **Micro-Borders:** Use 1px borders in `Tertiary` (#E5E1DA) for card outlines to provide structure without adding visual "weight."
- **Glassmorphism:** Use a subtle backdrop blur (15px-20px) on the navigation bar and bottom tab bar to allow colors of the outfit imagery to bleed through softly.

## Shapes

The shape language is **Organic and Welcoming**. 

- **Primary Corners:** A standard 8px (0.5rem) radius for secondary elements like input fields.
- **Card Surfaces:** Use 16px (1rem) for large content cards to evoke a "soft" tactile feel.
- **Image Containers:** Clothing items and photography should use 24px (1.5rem) or fully rounded corners to feel like smooth pebbles or fabric folds.
- **Icons:** Use "Outline" style icons with a 1.5pt stroke weight and rounded caps/joins. Avoid sharp 90-degree angles in iconography.

## Components

- **Editorial Cards:** Large, full-bleed or inset containers for outfit suggestions. Typography should overlay the image using a subtle gradient scrim (from transparent to 40% Onyx Wool) at the bottom.
- **Action Buttons:**
    - *Primary:* Solid `Primary` color, high contrast, slightly rounded (8px). 
    - *Secondary:* Ghost style with a `Tertiary` border and `Primary` text.
- **Outfit Chips:** Small, pill-shaped tags used for weather attributes (e.g., "Windy," "UV High") or clothing categories. Use a light wash of the `Secondary` color at 10% opacity for the background.
- **Minimalist Lists:** Use thin `Tertiary` dividers that do not span the full width of the screen (inset by the page margin).
- **Interactive Wardrobe Slots:** Square or slightly vertical containers with a high corner radius (24px) to display individual garment items, using a `Neutral` background to make fabric textures pop.
- **Weather Widget:** An immersive "Hero" component at the top of the home screen, using large Serif typography for the temperature and a soft icon representing the sky state.