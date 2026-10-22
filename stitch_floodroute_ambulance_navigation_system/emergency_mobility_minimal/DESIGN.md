---
name: Emergency Mobility Minimal
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#3d4947'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#6d7a77'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a61'
  primary: '#00685e'
  on-primary: '#ffffff'
  primary-container: '#008377'
  on-primary-container: '#f4fffc'
  inverse-primary: '#72d8ca'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#bb0112'
  on-tertiary: '#ffffff'
  tertiary-container: '#e02928'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#8ff4e6'
  primary-fixed-dim: '#72d8ca'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005049'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb4ab'
  on-tertiary-fixed: '#410002'
  on-tertiary-fixed-variant: '#93000b'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-callout:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-callout-mobile:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-xl:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-lg-medium:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  label-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
  banner-notice:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system is engineered for life-critical, high-stress navigation and dispatch environments. Operating in conditions of torrential rainfall, vibration inside moving emergency vehicles, and rapid decision-making windows, the interface rejects decorative chrome in favor of absolute functional clarity, high legibility, and high-contrast spatial mapping. 

Drawing from modern utility paradigms seen in high-density mobility tools, the style is **Minimalist and Purpose-Driven**. It combines expansive whitespaces, subdued neutral structures, and hyper-targeted contextual alerts. Every interactive and informational surface acts to minimize cognitive load:
- Calm, disciplined base canvases ensure driver night/day readability without glare.
- Vital alert signals (water levels, hazard blockages, time penalties) leverage familiar traffic and medical semaphores.
- Friendly, humanist proportions eliminate clinical stiffness while preserving total authority.

## Colors

The palette enforces strict behavioral separation: operational teal for actions and success, functional transit blues for active tracks, tiered warning spectrums for water hazard depth, and tranquil neutral foundations.

### Core Foundation
- **Background / Canvas**: `#FFFFFF` creates maximum ambient contrast on high-vibration mobile mounts.
- **Card & Sheet Surface**: `#F6F8FA` separates elevated context drawers and sheet modules without harsh drop shadows.
- **Text Primary**: `#111827` delivers uncompromising typographic hierarchy and compliance under sunlight glare.
- **Muted Text / Metadata**: `#6B7280` keeps supplementary spatial stats legible without competing with directional prompts.
- **Subtle Borders**: `#E5E7EB` structures modules, dividing inputs, bottom-sheets, and waypoints cleanly.

### Emergency & Operational Accents
- **Primary Action (Teal)**: `#0B8A7E` signals safe paths, routing confirmation, and core interactive states.
- **Standard Route (Blue)**: `#2563EB` indicates baseline municipal roads and unobstructed routing vectors.

### Hazard & Status Spectrum
- **Low Risk / Monitoring (Amber)**: `#F5B83D` indicates standing water under 15cm.
- **Medium Hazard (Orange)**: `#F97316` marks roads impassable for compact emergency fleet, accessible only to heavy chassis.
- **Severe Hazard / Impassable (Red)**: `#DC2626` designates fully submerged routes, active flash floods, or total closures.
- **Patient Pin**: `#F59E0B` renders pickup vectors distinctly from standard traffic markers.
- **Hospital Anchor**: `#FFFFFF` disc background housing a bold `#111827` medical marker for rapid landmarking.

### Tonal Status Banners
- **Cut-Off / Critical Alert**: Surface `#FEF2F2` paired with text `#991B1B`.
- **Passable / Unaffected Clear**: Surface `#F0FDF4` paired with text `#166534`.

## Typography

The typographic engine uses **Inter** throughout all tiers to guarantee instantaneous optical clarity at arm's length or dashboard mount distance. 

Typographic principles for emergency routing:
- **Minimum Body Size**: All running text, metadata, and street descriptors maintain a minimum floor of `16px`. Microtext is prohibited within navigation cards.
- **No All-Caps Stylings**: Sentence case and title case are strictly observed across all badges, tags, buttons, and alert strips. Uppercase styling degrades rapid scanning under eye-movement saccades.
- **Time/ETA Prominence**: Critical metrics utilize `display-callout` (`56px` bold, scaling to `40px` on mobile screens) for instant parsing of dynamic detour additions and arrival estimations.
- **Numeric Clarity**: Tabular figures should be enabled (`tnum`) for timers, water depth figures (e.g., `+18 cm`), and distance values.

## Layout & Spacing

The system accommodates two primary form factors: an in-cab mounted mobile view (single-handed, high-vibration) and a widescreen dispatcher console.

- **Mobile Drivers**: Full-bleed contextual map underlay, bounded by safe-area anchors. Overlays sit as sticky bottom sheets and floating top cards with `1rem` outer screen margins.
- **Desktop Dispatchers**: Fluid two-pane or three-pane split. The control sidebar anchors at a fixed `420px` width while the GIS canvas claims the remaining fluid viewport. Gutters remain consistent at `1.5rem` (`24px`).
- **Touch-First Rhythm**: Spacing is scaled to prevent accidental taps. Elements rely on `space-md` (`16px`) and `space-lg` (`24px`) internal card padding to maintain calm separation between conflicting commands.

## Elevation & Depth

To preserve the clean aesthetic while maintaining crisp operational layering over high-contrast maps:
- **Low-Contrast Outlines & Direct Stacking**: Cards and panels rely on a dual strategy: crisp `#E5E7EB` 1px architectural borders coupled with smooth, high-diffusion ambient shadows.
- **Sheet Elevation**: Floating route cards, top navigation banners, and detour prompts utilize an extra-soft shadow: `0 8px 30px rgba(17, 24, 39, 0.08)`.
- **Map Overlays**: Waypoints, patient beacons, and transit markers feature a focused micro-shadow: `0 2px 8px rgba(0, 0, 0, 0.16)` to guarantee legibility over saturated cartographic land masses or water zones.

## Shapes

The design uses a standard geometric radius of **14px (`0.875rem`)** across actionable surfaces, structural cards, and floating route HUDs. This provides a friendly, human, and modern hand feel without encroaching on circular or pill extremes.

- **Buttons, Bottom Sheets, and Floating Cards**: Standardized to `14px` border radius.
- **Map Indicators & Pin Avatars**: True circular geometry (`9999px`) for point targets, keeping markers distinct from rectangular system surfaces.
- **Persistent Header Notice**: A compact `24px` tall status banner with subtle `0px` full-bleed or `8px` containerized corners depending on map docking mode.

## Components

### Buttons
- **Height**: Standard primary and secondary controls are fixed at a generous `56px` touch-target height.
- **Corner Radius**: `14px`.
- **Primary CTA**: `#0B8A7E` background with `#FFFFFF` text, `Inter` `label-lg` (`16px` weight 600). Hover/Active shifts to `#09756B`.
- **Secondary / Reroute Action**: Solid `#F6F8FA` fill with `#111827` label and a 1px `#E5E7EB` structural border.
- **Destructive / Abort**: Deep red outline or filled variant with `#DC2626`.

### Cards & Route Sheets
- **Background**: `#FFFFFF` or `#F6F8FA` with `14px` radius and a 1px solid border (`#E5E7EB`).
- **Internal Padding**: `1.5rem` (`24px`).
- **Layout**: Top zone features dynamic ETA callout (`56px` bold in `#111827`, accompanied by positive or negative detour diffs like `+14 min` in `#DC2626`). Bottom section houses primary execution controls.

### Status Banners
- **Top Notice Ribbon (24px height)**: Amber status bar (`#F5B83D` or `#FEF3C7` background with `#92400E` text) indicating live monsoon warning telemetry.
- **Contextual Route Banners**:
  - *Cut-off Road*: `#FEF2F2` background, `#991B1B` typography, detailing flood crest height and alternate diversion.
  - *All Clear*: `#F0FDF4` background, `#166534` typography, affirming safe, unhindered municipal transit.

### Map Overlay Graphics
- **Active Emergency Path**: Solid `#0B8A7E` polyline (stroke width `6px`) or dashed active path `#2563EB` for alternate transit tracks.
- **Hazard Zones**: Polylines coded to danger tiers (`#F5B83D` amber for caution, `#F97316` orange for intermediate risk, `#DC2626` red for submerged impassable streets).
- **Patient Pin**: Circular `#F59E0B` pin (minimum 32px diameter) with pure white inner icon glyph.
- **Hospital Anchor**: Crisp `#FFFFFF` circle (minimum 36px diameter) with high-contrast `#111827` bold serif/grotesque letter **H** centered.

### Input Fields & Search Bars
- **Height**: `56px`.
- **Corner Radius**: `14px`.
- **Surface**: `#FFFFFF` with `#E5E7EB` 1px border. Focus state replaces border with a 2px `#0B8A7E` ring.
- **Text & Placeholder**: Typographic size `16px`, placeholder in `#6B7280`.

### Chips & Badges
- **Height**: `36px` touch-friendly chips for toggling water logs or hospital ICU statuses.
- **Typography**: `14px` Medium (no uppercase text).
- **Radius**: `10px` or `14px` to match card ergonomics.