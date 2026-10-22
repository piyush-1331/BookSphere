---
name: Editorial Archive
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#47464f'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#787680'
  outline-variant: '#c8c5d0'
  surface-tint: '#5b598c'
  primary: '#070235'
  on-primary: '#ffffff'
  primary-container: '#1e1b4b'
  on-primary-container: '#8683ba'
  inverse-primary: '#c4c1fb'
  secondary: '#9b4500'
  on-secondary: '#ffffff'
  secondary-container: '#fd8a42'
  on-secondary-container: '#682c00'
  tertiary: '#050039'
  on-tertiary: '#ffffff'
  tertiary-container: '#14007a'
  on-tertiary-container: '#7d77ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e3dfff'
  primary-fixed-dim: '#c4c1fb'
  on-primary-fixed: '#181445'
  on-primary-fixed-variant: '#444173'
  secondary-fixed: '#ffdbca'
  secondary-fixed-dim: '#ffb68e'
  on-secondary-fixed: '#331200'
  on-secondary-fixed-variant: '#763300'
  tertiary-fixed: '#e3dfff'
  tertiary-fixed-dim: '#c3c0ff'
  on-tertiary-fixed: '#100069'
  on-tertiary-fixed-variant: '#372abf'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '600'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-xl-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 2rem
  margin-mobile: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system embodies the quiet authority of an elite archival institution merged with the high-velocity precision of modern SaaS. Designed for literary curators, academic organizations, enterprise libraries, and discerning bibliophiles, it avoids both cold utility and nostalgic clutter. 

The aesthetic style is **Editorial Minimalist with Modern SaaS Rigor**:
- **Tactile Dignity:** Physical book metaphors appear through precise proportions, deliberate vertical rhythm, and realistic cover depth rather than faux skeuomorphic textures.
- **Calm Authority:** Expansive, breathing negative space paired with razor-sharp data density where inventory demands it.
- **Editorial Contrast:** High-drama literary typography anchoring institutional layouts, giving metadata the visual weight of gallery placards.

## Colors

The palette establishes an intellectual, high-end atmosphere through deeply saturated midnight tones contrasted against crisp, warm mineral foundations.

- **Primary (`#1E1B4B` - Midnight Indigo):** Serves as the primary anchor for authoritative interactive states, primary action buttons, key brand moments, and prominent structural frames.
- **Secondary (`#B45309` - Bookcloth Amber):** An archival gold/amber accent reserved for badge highlights, curated collections, rare edition indicators, reading progress pins, and focal calls-to-action.
- **Tertiary (`#4338CA` - Royal Iris):** Supporting accent for secondary active states, active tab indicators, and digital interaction states.
- **Neutral (`#0F172A` - Deep Slate Charcoal):** Primary text color, ensuring stark readability and high contrast across editorial headlines and data grids.
- **Canvas & Surface Base:** Crisp off-white (`#FAFAF9` Warm Canvas) provides a gallery-like foundation, backed by `#F5F5F4` for subtle structural recessions and `#FFFFFF` for pristine floating card surfaces.

## Typography

The type system creates intentional tension between literary elegance and technical utility:

- **Headings (Playfair Display):** Imparts the cadence of fine book publishing. Used for page titles, collection titles, featured book names, and hero statistics. It is always set with tight tracking (`-0.01em` to `-0.02em`) to maintain contemporary discipline.
- **Body & Controls (Plus Jakarta Sans):** A crisp, geometrically balanced sans-serif providing uncompromising legibility across complex bibliographic tables, catalog filters, reading dashboards, and dense metadata screens.
- **Archival Tags & Badges (Label Small):** Set in uppercase with expanded tracking (`0.06em`) to echo library reference callouts and museum shelf tags.

## Layout & Spacing

The layout model utilizes a structured 12-column responsive grid anchored by generous exterior margins:

- **Desktop (1200px+):** 12-column grid with `2rem` gutters and a maximum bounded content container of 1440px. Shell layout utilizes a persistent 280px left navigation rail for library directories and taxonomies.
- **Tablet (768px - 1199px):** 8-column grid with `1.5rem` gutters. The primary navigation collapses into an off-canvas drawer or streamlined icon rail.
- **Mobile (< 768px):** 4-column fluid grid with `1rem` gutters and `1rem` margins. Complex metadata stacks vertically; action bars dock to the bottom viewport edge.
- **Rhythm Rules:** Vertical stacking respects a baseline 8px module. Section separations use `space-xl` (40px) or double increments for distinct topical domains.

## Elevation & Depth

Visual depth combines warm tonal stratification with hyper-soft, indigo-tinted drop shadows to reflect physical volume without visual heaviness.

- **Base Layer (Ground):** `#FAFAF9` matte canvas.
- **Surface Elevation 1 (Cards, Shelves):** Crisp `#FFFFFF` surface container framed by a hairline border: `1px solid rgba(15, 23, 42, 0.06)`. Shadows are soft and diffused: `0 1px 3px rgba(30, 27, 75, 0.04), 0 4px 12px rgba(30, 27, 75, 0.03)`.
- **Surface Elevation 2 (Dropdowns, Hover States, Floating Panels):** `#FFFFFF` paired with layered depth: `0 4px 6px -1px rgba(30, 27, 75, 0.05), 0 10px 24px -3px rgba(30, 27, 75, 0.08)`.
- **Book Cover Dimension:** Book spine and sleeve cards apply an asymmetrical, compound shadow to mimic genuine paper bound volume: a 2px dark spine-edge gradient combined with a `4px 16px 24px rgba(30, 27, 75, 0.14)` soft projection.
- **Overlays (Modals, Sheet Drawers):** Backdrop uses `#0F172A` at 40% opacity with a `4px` blur. Modal shells utilize `0 20px 40px rgba(30, 27, 75, 0.16)`.

## Shapes

The design system adopts a balanced roundedness (Level 2) that softens SaaS structural rigidity while retaining the tailored silhouette of fine publishing:

- **Default Form & Button Controls:** `0.5rem` (8px) for buttons, inputs, segmented controls, and dropdown lists.
- **Cards & Data Modules:** `1rem` (16px) for standard catalog cards, book lists, and dashboard metric panels.
- **Modal Containers & High-Level Shells:** `1.5rem` (24px) for expansive dialogues, book summary panels, and floating drawers.
- **Book Covers:** Strictly `0.25rem` (4px) with subtle right-side corner softening, honoring true hardcover paperboard geometry.
- **Badges & Indicators:** Pill shapes (`9999px`) to visually isolate status metadata from structural boxes.

## Components

### Buttons
- **Primary:** Background `#1E1B4B`, foreground `#FFFFFF`, border `none`, corner radius `0.5rem`. Hover state transitions to `#312E81` with an elevated shadow.
- **Secondary / Outline:** Background `#FFFFFF`, foreground `#0F172A`, border `1px solid rgba(15, 23, 42, 0.12)`. Hover state adopts background `#F5F5F4`.
- **Accent (Editorial Actions):** Background `#B45309`, foreground `#FFFFFF`. Used selectively for checkout, reserve, and primary highlight actions.
- **Ghost:** Text-only in `#0F172A` with `#F5F5F4` fill on hover.

### Badges & Chips
- **Status & Taxonomy Chips:** Height 24px, pill-shaped (`9999px`), horizontal padding `0.75rem`. 
- **Curator & Award Badge:** Background `rgba(180, 83, 9, 0.10)`, text `#B45309`, font `label-sm` (uppercase, bold).
- **Format Chips (Hardcover, PDF, EPUB):** Background `#F5F5F4`, text `#475569`, border `1px solid rgba(15, 23, 42, 0.06)`.

### Form Fields & Inputs
- **Search & Text Inputs:** Background `#FFFFFF`, border `1px solid rgba(15, 23, 42, 0.12)`, radius `0.5rem`, height 42px, padding `0 1rem`. Focus state features a sharp `2px` focus ring in `#4338CA` with zero pixel offset.
- **Global Catalog Search Bar:** Extended 48px height, rounded `1rem`, pre-pended with subtle search iconography, hotkey hint badge (`⌘K`) aligned right.

### Book Cards & Showcase Elements
- **Book Grid Tile:** White background container, padding `1rem`, radius `1rem`, subtle hairline border. Top slot reserved for vertical 2:3 aspect ratio book cover rendered with book depth shadow. Bottom metadata section houses title in `Playfair Display` (`headline-sm`), author in muted text, and ISBN/category pill below.
- **Shelf Row List:** Horizontally stacked layout with 64px thumbnail preview, primary title, author, checkout status badge, reader count, and an overflow action trigger aligned right.

### Checkboxes & Radios
- **Checkboxes:** 18px × 18px square with `0.25rem` rounding. Checked fill is `#1E1B4B` bearing a crisp white micro checkmark.
- **Radio Buttons:** 18px circle, checked state shows a centered `#1E1B4B` solid dot surrounded by a 2px white gap.