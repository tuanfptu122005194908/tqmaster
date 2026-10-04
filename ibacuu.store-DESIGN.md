---
version: alpha
name: Ibacuu
description: |
  IBACUU's design system embodies a modern, tech-forward aesthetic grounded in
  clarity and precision. The palette centers on a vibrant teal-cyan primary
  accent paired with a sophisticated dark slate secondary, creating a
  professional yet approachable digital marketplace. The design favors sharp,
  geometric edges (0px radius throughout) and minimal shadows, emphasizing clean
  lines and uncluttered layouts. The system uses generous whitespace and a light
  neutral canvas to ensure content remains the focal point. Subtle depth is
  achieved through color blocking and carefully calibrated opacity rather than
  heavy shadows. The overall impression is of a sleek, developer-friendly
  platform optimized for clarity, trust, and rapid task completion.
source:
  url: "https://ibacuu.store/vi/products"
  pagesAnalyzed: 6
  extractedAt: 2026-10-03
  tokensMeasured: true
colors:
  primary: "#0891B2"
  accent: "#12334D"
  link: "#07536C"
  canvas: "#F8FAFC"
  ink: "#0F172A"
  body: "#64748B"
  hairline: "#E2E8F0"
  error: "#71CED9"
  success: "#16A34A"
  accent-1: "#D97706"
  accent-2: "#94A3B8"
  accent-3: "#072F42"
  accent-4: "#67E8F9"
  neutral-1: "#000000"
  neutral-2: "#DAF1F2"
  neutral-3: "#CBD5E1"
  neutral-4: "#D3E3D6"
typography:
  display:
    fontFamily: GeistSans
    fontSize: 40px
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: -1px
  heading-xxl:
    fontFamily: GeistSans
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.27
    letterSpacing: 0px
  heading-xl:
    fontFamily: GeistSans
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0px
  heading-lg:
    fontFamily: GeistSans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: 0px
  heading-md:
    fontFamily: GeistSans
    fontSize: 18px
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: 0px
  heading-sm:
    fontFamily: GeistSans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.6
    letterSpacing: 0px
  heading-xs:
    fontFamily: GeistSans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.57
    letterSpacing: 0px
  body-lg:
    fontFamily: GeistSans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.57
    letterSpacing: 0px
  body-md:
    fontFamily: GeistSans
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1.57
    letterSpacing: 0px
  body-sm:
    fontFamily: GeistSans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0px
  body-sm-tight:
    fontFamily: GeistSans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.57
    letterSpacing: 0px
  body-sm-strong:
    fontFamily: GeistSans
    fontSize: 13px
    fontWeight: 700
    lineHeight: 1.57
    letterSpacing: 0px
  body-xs:
    fontFamily: GeistSans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.57
    letterSpacing: 0px
  button:
    fontFamily: GeistSans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.57
    letterSpacing: 0px
  label:
    fontFamily: GeistSans
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.57
    letterSpacing: 0px
  caption-md:
    fontFamily: GeistSans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: 0px
  caption-md-uppercase:
    fontFamily: GeistSans
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.57
    letterSpacing: 0.96px
    textTransform: uppercase
  caption-md-strong:
    fontFamily: GeistSans
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.67
    letterSpacing: 0.24px
  caption-md-tight:
    fontFamily: GeistSans
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0px
  caption-sm:
    fontFamily: GeistSans
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.57
    letterSpacing: 0px
  caption-xs:
    fontFamily: GeistSans
    fontSize: 8px
    fontWeight: 700
    lineHeight: 1.57
    letterSpacing: 0px
rounded:
  none: 0px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  xxl: 32px
  xxxl: 44px
  section: 48px
  band: 60px
borderWidths:
  thin: 1px
shadows:
  sm: "rgba(48, 63, 43, 0.1) 0px 4px 14px 0px"
  md: "rgba(0, 0, 0, 0.02) 0px 2px 0px 0px"
elevationStrategy: progressive
themes:
  derived: dark   # the other theme is the site's measured palette
  light:
    bg: "#F8FAFC"
    surface: "#F1F3F4"
    surfaceRaised: "#E8EAEC"
    text: "#0F172A"
    textMuted: "#64748B"
    border: "#E2E8F0"
    accent: "#0891B2"
    accentFg: "#000000"
    focusRing: "#0891B2"
    elevation: shadow
  dark:
    bg: "#0A1214"
    surface: "#192022"
    surfaceRaised: "#252C2E"
    text: "#F5FBFC"
    textMuted: "#9CA2A4"
    border: "#31383A"
    accent: "#0891B2"
    accentFg: "#0B0B0C"
    focusRing: "#0891B2"
    elevation: "border+surface"
gradients:
  - context: section
    kind: radial
    value: "radial-gradient(circle, rgba(0, 0, 0, 0) 54%, color(srgb 0.0313726 0.568627 0.698039 / 0.05) 66%, rgba(0, 0, 0, 0) 73%)"
  - context: section
    kind: linear
    value: "linear-gradient(135deg, rgb(22, 78, 99), rgb(8, 47, 73))"
components:
  button-filled:
    typography: "{typography.body-md}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    height: 40px
    padding: "0px 15px 0px 15px"
    boxShadow: "rgba(0, 0, 0, 0.02) 0px 2px 0px 0px"
    backgroundColor: "rgb(255, 255, 255)"
  button-filled-lg:
    typography: "{typography.body-sm-tight}"
    textColor: "{colors.primary}"
    height: 42px
    padding: "0px 12px 0px 12px"
    backgroundColor: "rgb(236, 254, 255)"
  button-icon:
    typography: "{typography.body-md}"
    textColor: "{colors.primary}"
    border: "1px solid {colors.hairline}"
    height: 40px
    boxShadow: "rgba(48, 63, 43, 0.1) 0px 4px 14px 0px"
    backgroundColor: "rgb(255, 255, 255)"
  button-primary:
    typography: "{typography.body-md}"
    textColor: "rgb(255, 255, 255)"
    height: 40px
    padding: "0px 15px 0px 15px"
    backgroundColor: "{colors.primary}"
  button-primary-sm:
    typography: "{typography.button}"
    textColor: "rgb(255, 255, 255)"
    height: 32px
    padding: "0px 8px 0px 8px"
    backgroundColor: "{colors.primary}"
  card:
    typography: "{typography.label}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    backgroundColor: "rgb(255, 255, 255)"
  card-sm:
    typography: "{typography.body-lg}"
    textColor: "{colors.ink}"
    padding: "0px 24px 0px 24px"
  badge-filled:
    textColor: "rgb(56, 158, 13)"
    height: 22px
    padding: "0px 7px 0px 7px"
    fontSize: 12px
    fontFamily: GeistSans
    fontWeight: 400
    lineHeight: 1.67
    backgroundColor: "rgb(246, 255, 237)"
  badge-filled-2:
    textColor: "rgb(9, 88, 217)"
    height: 22px
    padding: "0px 7px 0px 7px"
    fontSize: 12px
    fontFamily: GeistSans
    fontWeight: 400
    lineHeight: 1.67
    backgroundColor: "rgb(230, 244, 255)"
  navigation:
    typography: "{typography.caption-sm}"
    textColor: "{colors.body}"
    height: 22px
  footer:
    typography: "{typography.label}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    padding: "65px 30px 25px 30px"
    backgroundColor: "rgb(255, 255, 255)"
  link:
    textColor: "{colors.primary}"
    fontSize: 18px
    fontFamily: GeistSans
    fontWeight: 800
    lineHeight: 1.57
    backgroundColor: "rgb(255, 255, 255)"
  link-sm:
    typography: "{typography.body-sm-tight}"
    textColor: "{colors.body}"
    padding: "0px 12px 0px 12px"
states:
  button-disabled:
    target: button
    state: disabled
    opacity: 0.5
  button-hover:
    target: button
    state: hover
    filter: "brightness(1.12)"
  card-hover:
    target: card
    state: hover
    transform: "translateY(-2px)"
  other-hover:
    target: other
    state: hover
    filter: "brightness(1.08)"
    transform: "translateY(-2px)"
  other-focus-visible:
    target: other
    state: focus-visible
    outline: "solid 2px"
    outlineWidth: 2px
  link-hover:
    target: link
    state: hover
    backgroundColor: transparent
  input-focus:
    target: input
    state: focus
    outline: none
breakpoints:
  - width: 375
    containerWidth: 293
    gridColumns: 2
    navLinksVisible: 17
    menuToggleVisible: true
    headingPx: 30
    bodyPx: 14
    sectionPaddingX: 16
  - width: 768
    containerWidth: 686
    gridColumns: 2
    navLinksVisible: 1
    menuToggleVisible: true
    headingPx: 30
    bodyPx: 14
    sectionPaddingX: 16
  - width: 1024
    containerWidth: 1024
    gridColumns: 4
    navLinksVisible: 17
    menuToggleVisible: true
    headingPx: 30
    bodyPx: 14
    sectionPaddingX: 16
  - width: 1280
    containerWidth: 1280
    gridColumns: 4
    navLinksVisible: 17
    menuToggleVisible: true
    headingPx: 30
    bodyPx: 14
    sectionPaddingX: 16
  - width: 1440
    containerWidth: 1440
    gridColumns: 4
    navLinksVisible: 17
    menuToggleVisible: true
    headingPx: 30
    bodyPx: 14
    sectionPaddingX: 16
coverage:
  statesFound: 70
  gradientsFound: 2
  rolesUnassigned: 8
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: false
  semanticRampDeclared: true
---

# Design System Inspired by IBACUU

## 1. Visual Theme & Atmosphere

IBACUU's design system embodies a modern, tech-forward aesthetic grounded in clarity and precision. The palette centers on a vibrant teal-cyan primary accent paired with a sophisticated dark slate secondary, creating a professional yet approachable digital marketplace. The design favors sharp, geometric edges (0px radius throughout) and minimal shadows, emphasizing clean lines and uncluttered layouts. The system uses generous whitespace and a light neutral canvas to ensure content remains the focal point. Subtle depth is achieved through color blocking and carefully calibrated opacity rather than heavy shadows. The overall impression is of a sleek, developer-friendly platform optimized for clarity, trust, and rapid task completion.

**Key Characteristics**
- Sharp, geometric aesthetic with zero border radius across interactive components
- Teal-cyan (#0891B2) brand identity paired with dark navy secondary (#12334D)
- Light neutral canvas (#F8FAFC) with minimal shadow elevation
- Color-blocking strategy for depth; minimal drop shadows
- Generous vertical rhythm and consistent spacing scale
- Vietnamese-localized UX with multilingual support evident in navigation
- Marketplace-focused product cards with hero imagery and pricing prominently displayed
- Accessible link hierarchy with understandable colour contrast

## 2. Color Palette & Roles

### Primary

- **Primary / Brand** (`{colors.primary}` — `#0891B2`): Primary call-to-action buttons, brand accent, active navigation states, hero bands, link focus states. Dominates the visual hierarchy as the main interactive accent.
- **Link** (`{colors.link}` — `#07536C`): Inline hyperlink color throughout body content and navigation elements.

### Secondary & Accent

- **Accent** (`{colors.accent}` — `#12334D`): Secondary accent used in hero band gradients and alternative interactive states.
- **Decorative** (`{colors.accent-1}` — `#D97706`): Amber/orange accent, no measured role; used for visual interest in product badges and tags.
- **Decorative** (`{colors.accent-2}` — `#94A3B8`): Slate-grey accent, no measured role; appears in secondary UI patterns.
- **Decorative** (`{colors.accent-3}` — `#072F42`): Deep navy accent, no measured role; used in layered backgrounds.
- **Decorative** (`{colors.accent-4}` — `#67E8F9`): Bright cyan accent, no measured role; decorative highlights and overlays.

### Neutral Scale

- **Canvas** (`{colors.canvas}` — `#F8FAFC`): Default page background; light slate-off-white.
- **Ink** (`{colors.ink}` — `#0F172A`): Primary heading and headline text; near-black with subtle slate tone.
- **Body** (`{colors.body}` — `#64748B`): Body copy, secondary text, and descriptive content.
- **Hairline** (`{colors.hairline}` — `#E2E8F0`): Thin 1px borders, dividers, and card edges.
- **Neutral** (`{colors.neutral-1}` — `#000000`): Absolute black, rare use in shadows and extreme contrast.
- **Neutral** (`{colors.neutral-2}` — `#DAF1F2`): Pale cyan tint; very light surface variant.
- **Neutral** (`{colors.neutral-3}` — `#CBD5E1`): Mid-grey; secondary borders and disabled states.
- **Neutral** (`{colors.neutral-4}` — `#D3E3D6`): Pale greenish-grey; softer secondary surface.

### Semantic & Status

- **Error** (`{colors.error}` — `#71CED9`): Error states and destructive action indicators.
- **Success** (`{colors.success}` — `#16A34A`): Success confirmation states, positive feedback, and completion indicators.

## 3. Typography Rules

### Font Family

**Primary Font**: GeistSans (sans-serif)
- Fallback stack: `GeistSans, system-ui, -apple-system, sans-serif`

No secondary serif font is used; the system is entirely sans-serif.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display | GeistSans | 40px | 400 | 1.18 | −1px | Page hero headings; dramatic negative tracking |
| Heading XL | GeistSans | 28px | 600 | 1.30 | 0px | Section headers, major titles |
| Heading LG | GeistSans | 20px | 600 | 1.40 | 0px | Subsection headers |
| Heading MD | GeistSans | 18px | 600 | 1.35 | 0px | Card titles, form section heads |
| Heading SM | GeistSans | 16px | 600 | 1.60 | 0px | Smaller section titles, labels |
| Heading XS | GeistSans | 14px | 500 | 1.57 | 0px | Minor headings, sidebar labels |
| Heading XXL | GeistSans | 30px | 600 | 1.27 | 0px | Large section headings |
| Body LG | GeistSans | 16px | 600 | 1.57 | 0px | Prominent body copy, button labels (large) |
| Body MD | GeistSans | 14px | 600 | 1.57 | 0px | Table headers, compact labels, button text |
| Body SM | GeistSans | 13px | 400 | 1.70 | 0px | Standard body copy, descriptions |
| Body SM Tight | GeistSans | 13px | 400 | 1.57 | 0px | Inline link text (tighter spacing) |
| Body SM Strong | GeistSans | 13px | 700 | 1.57 | 0px | Emphasis within body text |
| Body XS | GeistSans | 12px | 400 | 1.57 | 0px | List items, minor text |
| Button | GeistSans | 12px | 600 | 1.57 | 0px | Button interior text |
| Caption MD | GeistSans | 12px | 400 | 1.50 | 0px | Captions, hints, supplementary text |
| Caption MD Strong | GeistSans | 12px | 600 | 1.67 | 0.24px | Bold captions with subtle letter-spacing |
| Caption MD Uppercase | GeistSans | 12px | 400 | 1.57 | 0.96px | Uppercase labels (e.g. product tags); high tracking |
| Caption MD Tight | GeistSans | 12px | 700 | 1.20 | 0px | Condensed bold captions |
| Caption SM | GeistSans | 11px | 400 | 1.57 | 0px | Smallest captions and footnotes |
| Caption XS | GeistSans | 8px | 700 | 1.57 | 0px | Micro-text and badge labels |
| Label | GeistSans | 14px | 400 | 1.57 | 0px | Form input labels and legend text |

### Principles

- **Progressive reduction**: Font sizes decrease in steps of 2–4px between hierarchy levels, with weight and line-height adjusting to maintain readability.
- **Negative tracking at scale**: The display size (40px) employs −1px letter-spacing to reinforce dominance and visual density; all other sizes use 0px spacing except decorative uppercase labels which use high tracking (0.96px).
- **Line-height consistency**: Body text uses 1.57–1.70 line-height for comfort; headings tighten to 1.20–1.40 to maintain visual weight.
- **Weight discipline**: Regular (400) is used for body and captions; semi-bold (600) for headings and button text; bold (700) for accented text and micro-labels.

## 4. Component Stylings

### Buttons

**Primary Button (Large)**
- Background: `#0891B2` (`{colors.primary}`)
- Text Color: `#FFFFFF` (white)
- Font: {typography.body-md} — 14px, 600 weight, 1.57 line-height
- Padding: `0px 15px`
- Height: `40px`
- Border: `1px solid transparent`
- Border Radius: `0px` (sharp corners)
- Box Shadow: `none`
- Hover: `filter: brightness(1.12)` (lightens the teal)

**Primary Button (Small)**
- Background: `#0891B2` (`{colors.primary}`)
- Text Color: `#FFFFFF` (white)
- Font: {typography.button} — 12px, 600 weight, 1.57 line-height
- Padding: `0px 8px`
- Height: `32px`
- Border: `1px solid transparent`
- Border Radius: `0px` (sharp corners)
- Box Shadow: `none`
- Hover: `filter: brightness(1.12)`

**Secondary Button (Filled Light)**
- Background: `#ECFEFF` (very light cyan tint)
- Text Color: `#0891B2` (`{colors.primary}`)
- Font: {typography.body-sm} — 13px, 400 weight, 1.70 line-height
- Padding: `0px 12px`
- Height: `42px`
- Border: `0px`
- Border Radius: `0px`
- Box Shadow: `none`
- Hover: `brightness(1.12)`

**Default Button (Outlined)**
- Background: `#FFFFFF` (white)
- Text Color: `#0F172A` (`{colors.ink}`)
- Font: {typography.body-md} — 14px, 600 weight, 1.57 line-height
- Padding: `0px 15px`
- Height: `40px`
- Border: `1px solid #E2E8F0` (`{colors.hairline}`)
- Border Radius: `0px`
- Box Shadow: `rgba(0, 0, 0, 0.02) 0px 2px 0px 0px` (subtle elevation)
- Hover: `filter: brightness(1.12)`

**Icon Button**
- Background: `#FFFFFF` (white)
- Text Color: `#0891B2` (`{colors.primary}`)
- Font: {typography.body-md} — 14px, 600 weight, 1.57 line-height
- Padding: `0px` (icon-centered)
- Width: `40px`
- Height: `40px`
- Border: `1px solid #E2E8F0` (`{colors.hairline}`)
- Border Radius: `0px`
- Box Shadow: `rgba(48, 63, 43, 0.1) 0px 4px 14px 0px` (subtle shadow)
- Hover: `transform: translateY(-2px) scale(1.08)`

**Disabled Button**
- Opacity: `0.5`
- Cursor: `not-allowed`

**Focus State**
- Outline: `2px solid var(--primary)` (`#0891B2`)
- Outline Offset: As per browser default

### Cards & Containers

**Product Card (Default)**
- Background: `#FFFFFF` (white)
- Text Color: `#0F172A` (`{colors.ink}`)
- Font: {typography.body-sm} — 13px, 400 weight, 1.70 line-height
- Padding: `0px` (image fills width; content padding applied internally)
- Border: `1px solid #E2E8F0` (`{colors.hairline}`)
- Border Radius: `0px` (sharp edges)
- Box Shadow: `none`
- Hover: `transform: translateY(-2px); box-shadow: var(--shadow-subtle); border-color: var(--primary)`

**Card Small (Compact)**
- Background: `transparent`
- Text Color: `#0F172A` (`{colors.ink}`)
- Font: {typography.body-lg} — 16px, 600 weight, 1.57 line-height
- Padding: `0px 24px`
- Height: `56px` (flex vertically centered)
- Border: `0px`
- Border Radius: `0px`
- Box Shadow: `none`

**Hero Section**
- Background Gradient (linear): `linear-gradient(135deg, rgb(22, 78, 99), rgb(8, 47, 73))` (dark teal to navy blue)
- Radial Overlay: `radial-gradient(circle, rgba(0, 0, 0, 0) 54%, rgba(8, 145, 178, 0.05) 66%, rgba(0, 0, 0, 0) 73%)` (subtle teal glow)
- Padding: `{spacing.band}` — `60px` on vertical, `{spacing.md}` — `16px` on horizontal

### Inputs & Forms

**Text Input (Default)**
- Background: `#FFFFFF` (white)
- Text Color: `#0F172A` (`{colors.ink}`)
- Font: {typography.label} — 14px, 400 weight, 1.57 line-height
- Border: `1px solid #E2E8F0` (`{colors.hairline}`)
- Border Radius: `0px`
- Padding: `8px 12px`
- Height: `40px`
- Focus: `outline: 0px; box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1); border-color: #0891B2`
- Hover: `border-color: #CBD5E1`; `background: #F8FAFC`
- Disabled: `background: #F3F4F6`; `border-color: #E5E7EB`; opacity `0.6`

**Dropdown Select**
- Background: `#FFFFFF` (white)
- Text Color: `#0F172A` (`{colors.ink}`)
- Font: {typography.label} — 14px, 400 weight, 1.57 line-height
- Border: `1px solid #E2E8F0` (`{colors.hairline}`)
- Border Radius: `0px`
- Padding: `8px 12px`
- Height: `40px`
- Icon Color: `#0891B2` (`{colors.primary}`)
- Focus: `box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1)`; border blue

**Form Label**
- Font: {typography.label} — 14px, 400 weight, 1.57 line-height
- Color: `#0F172A` (`{colors.ink}`)
- Margin Bottom: `{spacing.xs}` — `8px`

### Navigation

**Navigation Link (Default)**
- Text Color: `#64748B` (`{colors.body}`)
- Font: {typography.caption-sm} — 11px, 400 weight, 1.57 line-height
- Background: `transparent`
- Border: `none`
- Padding: `0px`
- Hover: `color: #0891B2` (`{colors.primary}`)
- Active: `color: #0891B2`; font-weight `600`

**Sidebar Menu Item**
- Text Color: `#64748B` (`{colors.body}`)
- Font: {typography.body-sm} — 13px, 400 weight, 1.70 line-height
- Background: `transparent`
- Padding: `12px 16px`
- Border Radius: `0px`
- Hover: `color: #0891B2`; `background: rgba(8, 145, 178, 0.05)`
- Active: `color: #0891B2`; `font-weight: 600`

**Breadcrumb**
- Font: {typography.caption-sm} — 11px, 400 weight, 1.57 line-height
- Link Color: `#0891B2` (`{colors.primary}`)
- Separator Color: `#CBD5E1`
- Hover: `color: #0891B2`

### Badges

**Success Badge (Filled)**
- Background: `#F6FFF5` (very pale green)
- Text Color: `#389E0D` (dark green)
- Font: {typography.caption-md} — 12px, 400 weight, 1.50 line-height
- Padding: `0px 7px`
- Height: `22px`
- Border: `1px solid transparent`
- Border Radius: `0px`
- Box Shadow: `none`

**Info Badge (Filled)**
- Background: `#E6F4FF` (very pale blue)
- Text Color: `#0958D9` (dark blue)
- Font: {typography.caption-md} — 12px, 400 weight, 1.50 line-height
- Padding: `0px 7px`
- Height: `22px`
- Border: `1px solid transparent`
- Border Radius: `0px`
- Box Shadow: `none`

### Price & Rating

**Price Text (Large/Prominent)**
- Font: {typography.body-lg} — 16px, 600 weight, 1.57 line-height
- Color: `#0F172A` (`{colors.ink}`)

**Strike-through Price (Original)**
- Font: {typography.body-sm} — 13px, 400 weight, 1.70 line-height
- Color: `#CBD5E1` (`{colors.neutral-3}`)
- Text Decoration: `line-through`

**Rating Stars**
- Star Color (filled): `#D97706` (`{colors.accent-1}`)
- Star Color (empty): `#E2E8F0` (`{colors.hairline}`)
- Font: {typography.caption-sm} — 11px, 400 weight, 1.57 line-height (rating count)

## 5. Layout Principles

### Spacing System

Base unit: `4px` ({spacing.xxs})

**Scale**:
- `{spacing.xxs}` = `4px` — Micro adjustments, compact UI density
- `{spacing.xs}` = `8px` — Small gaps, button padding
- `{spacing.sm}` = `12px` — Form field padding, card title spacing
- `{spacing.md}` = `16px` — Standard content padding, horizontal gutters
- `{spacing.lg}` = `20px` — Moderate section separation
- `{spacing.xl}` = `24px` — Footer/header padding, block margins
- `{spacing.xxl}` = `32px` — Large section spacing
- `{spacing.xxxl}` = `44px` — Extra-large gaps
- `{spacing.section}` = `48px` — Section container top/bottom padding
- `{spacing.band}` = `60px` — Hero bands and full-width sections

**Usage Context**:
- Button padding: `{spacing.xs}` (8px) to `{spacing.sm}` (12px)
- Card internal padding: `0px` to `{spacing.xl}` (24px)
- Section vertical rhythm: `{spacing.section}` (48px) to `{spacing.band}` (60px)
- Form field vertical spacing: `{spacing.sm}` (12px) to `{spacing.md}` (16px)

### Grid & Container

- **Max Width**: `1440px` (full-width responsive up to 1440px)
- **Content Column Width at 1440px**: `1440px` (full bleed)
- **Content Column Width at 1280px**: `1280px` (full bleed)
- **Content Column Width at 1024px**: `1024px` (full bleed)
- **Content Column Width at 768px**: `686px` (left sidebar visible; approximately 60% of viewport)
- **Content Column Width at 375px**: `293px` (sidebar hidden; mobile-only content)

**Grid Columns**:
- Desktop (1024px+): 4 columns with equal width (`1280px / 4` = `320px` per column)
- Tablet (768px–1023px): 2 columns; sidebar remains visible and narrow
- Mobile (< 768px): 2 columns, tight margins

**Horizontal Padding**:
- All viewport sizes: `{spacing.md}` (`16px`) left/right on the page container
- Hero sections: Stretch edge-to-edge; internal content respects `{spacing.md}` padding

**Section Pattern**:
- Page sections: Vertical padding `{spacing.section}` (48px) top and bottom
- Hero/feature sections: Vertical padding `{spacing.band}` (60px) top and bottom
- Card grids: Gap between cards `{spacing.md}` (16px)

### Whitespace Philosophy

IBACUU employs aggressive whitespace to prioritize content clarity. The light canvas background ({colors.canvas} — #F8FAFC) is rarely interrupted; cards float on this surface with minimal shadow, relying on border definition instead. Vertical rhythm is maintained through consistent section spacing ({spacing.section} — 48px), with larger gaps (60px) reserved for hero regions. Within components, padding is conservative but sufficient—button padding uses just 8–12px, while card interiors breathe with 16–24px margins. This approach reflects a developer-first, minimalist philosophy where whitespace is as important as filled space.

### Border Radius Scale

The system uses exclusively **sharp corners** across all interactive components:
- `{rounded.none}` = `0px` — All buttons, cards, inputs, badges, and navigation elements

This geometric, modern aesthetic reinforces the tech-forward brand identity. No pill-shaped or rounded variants are present in the measured system.

### Border Widths

- **Thin**: `1px` — Applied to card borders, input borders, button outlines, and hairline dividers
- **Separator/Rule**: `1px` — Footer dividers, section borders
- **No thick borders**: The system uses only 1px stroke throughout; no 2px or 3px borders are defined

## 6. Depth & Elevation

| Level | Treatment | Use |
|---|---|---|
| Flat | No shadow; 1px border `#E2E8F0` | Default card, outlined button, input fields, navigation |
| Subtle | `rgba(0, 0, 0, 0.02) 0px 2px 0px 0px` | Outlined button, slight lift |
| Soft | `rgba(48, 63, 43, 0.1) 0px 4px 14px 0px` | Icon button, micro-elevation |
| Hover Lift | `box-shadow: var(--shadow-subtle)` + `transform: translateY(-2px)` | Card on hover, button on hover |

**Shadow Philosophy**: IBACUU uses a color-blocking elevation strategy rather than heavy shadows. Most components sit flat on the canvas, differentiated by border color and background tone. When depth is required, the system applies subtle, near-transparent shadows with a very short blur radius (2–4px) to suggest a paper-thin lift. On interaction (hover), cards gain a slightly more pronounced shadow alongside a small vertical translate (−2px) and optional scale (1.08x), creating a responsive, tactile feel without sacrificing minimalist aesthetics.

### Opacity Levels

- `14%` (0.14) — Very subtle overlays, disabled elements at reduced prominence
- `55%` (0.55) — Moderate secondary emphasis (e.g. secondary text tint over white)
- `70%` (0.70) — Prominent secondary state (e.g. hover overlay)
- `75%` (0.75) — High-opacity secondary state (e.g. active overlay)
- `90%` (0.90) — Near-full opacity, minor transparency for depth

### Z-index / Layering

- Base layer: `z-index: 1`
- Content elevation: `z-index: 2`
- Sticky header/nav: `z-index: 3`
- Dropdown menu: `z-index: 30`
- Modal/overlay: `z-index: 60`

The layering strategy is shallow and intentional. Most content operates at base levels (1–3); dropdowns and modals are segregated at higher tiers (30, 60) to prevent accidental overlap.

## 7. Do's and Don'ts

### Do

- **Use the primary teal** (`{colors.primary}` — `#0891B2`) for all primary CTAs and interactive focus states. It is the dominant brand colour and immediately signals interactivity.
- **Respect the sharp corner aesthetic** across all components. 0px radius is non-negotiable; this is a defining visual trait of the system.
- **Build spacing from the scale** (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, etc.). Never invent intermediate spacing values; use the defined scale.
- **Pair dark heading text** (`{colors.ink}` — `#0F172A`) with body copy (`{colors.body}` — `#64748B`) for robust contrast and legibility.
- **Leverage color blocking** for depth. Use background color shifts and border colours to separate UI regions, not shadow manipulation.
- **Apply hover transforms** sparingly: `translateY(-2px)` and optional `scale(1.08)` for cards and tertiary buttons; avoid excessive motion.
- **Keep inputs and form fields minimal**: white background, thin border, minimal padding. The system favours clarity over decorative styling.
- **Use GeistSans exclusively**. It is the only typeface in this system; no serif, monospace, or display fonts are employed elsewhere.
- **Test all links in the primary colour** (`#0891B2`) for sufficient contrast against white backgrounds and light neutrals.

### Don't

- **Do not introduce rounded corners** anywhere in the system (border-radius > 0px is off-brand). If a component feels too sharp, reconsider its proportions, not its corners.
- **Do not use drop shadows as the primary depth cue**. Shadows are optional and subtle; use border colours and background shifts first.
- **Do not invent new spacing values**. All gaps, padding, and margins must derive from the `4px` base scale.
- **Do not override the typography hierarchy** without strong justification. The measured font sizes and weights are precise; deviating breaks visual harmony.
- **Do not use decorative accent colours** (`#D97706`, `#94A3B8`, `#072F42`, `#67E8F9`) for interactive elements. These are reserved for secondary visual interest (badges, tags, illustrations) and cannot carry interaction semantics.
- **Do not apply high-opacity backgrounds** to disabled states. Use opacity 0.5 or reduce colour saturation; the user must still perceive the element as present but inactive.
- **Do not forget to test focus states**. Links and buttons require a `2px` outline in `{colors.primary}` for keyboard accessibility.
- **Do not force dark mode or high-contrast overrides** without measuring them. The extracted design reflects one theme only; derived themes are not guaranteed accurate.
- **Do not mix fonts or weights erratically**. Every text element has a defined role (Display, Heading XL, Body MD, Caption SM, etc.); use these roles consistently.

## 8. Responsive Behavior

### Breakpoints

| Viewport | Content Width | Grid Columns | Layout Change | Nav Behavior | Heading Size | Body Size | Padding |
|---|---|---|---|---|---|---|---|
| 375px (mobile) | 293px | 2 | Sidebar hidden; stacked layout | Hamburger menu visible | 30px | 14px | 16px |
| 768px (tablet) | 686px | 2 | Sidebar visible as narrower panel | Hamburger menu visible | 30px | 14px | 16px |
| 1024px (desktop) | 1024px | 4 | Full-width content; sidebar inline | All nav links visible | 30px | 14px | 16px |
| 1280px (wide desktop) | 1280px | 4 | Grid expands proportionally | All nav links visible | 30px | 14px | 16px |
| 1440px (ultra-wide) | 1440px | 4 | Max-width enforced; full bleed to 1440px | All nav links visible | 30px | 14px | 16px |

**Breakpoint Thresholds**:
- Mobile-to-Tablet: `768px` — Sidebar becomes visible; hamburger menu remains but full nav menu becomes available
- Tablet-to-Desktop: `1024px` — Grid column count increases from 2 to 4; full navigation links appear and menu toggle remains but is deprioritized

### Touch Targets

- **Minimum height for interactive elements**: `40px` (buttons, nav links, card clickable zones)
- **Minimum width for interactive elements**: `40px` (icon buttons)
- **Recommended minimum spacing between touch targets**: `8px` (prevents accidental mis-taps)

Form fields, buttons, and navigation links all adhere to the 40px minimum to ensure comfortable interaction on touch devices.

### Collapsing Strategy

**Mobile (< 768px)**:
- Sidebar collapses into a hamburger menu drawer (overlay on top of main content)
- Product card grid collapses to single column or 2-column tight layout
- Form inputs stack vertically; dropdown menus are full-width
- Hero section text and images reflow; font sizes remain consistent (30px heading, 14px body)
- Section padding remains `16px` left/right; top/bottom spacing tightens slightly to conserve vertical space (48px → 32px for non-hero sections)

**Tablet (768px–1023px)**:
- Sidebar remains visible but fixed at narrower width (approximately 120–160px)
- Main content area takes remaining width (686px on 768px viewport)
- Product cards remain 2-column grid
- Form layouts stay vertical but may use side-by-side labels on larger inputs
- Navigation hamburger menu visible but sidebar is simultaneously accessible

**Desktop (1024px+)**:
- Full sidebar always visible; main content unfolds to 4-column grid
- No hamburger menu (all nav items visible)
- Cards expand to fill grid cells proportionally
- Form inputs may use inline (side-by-side) label arrangements
- Section padding increases to `{spacing.section}` (48px) and `{spacing.band}` (60px) for larger screens

**Typography on Responsive**:
- Headings (30px, 40px display) remain fixed across all breakpoints; no scaling
- Body text (13–14px) remains fixed; no resizing
- This approach ensures consistency and prevents layout instability during resize events

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA Fill**: Primary Teal (`{colors.primary}` — `#0891B2`) — use for main call-to-action buttons, active links, hero accents
- **Secondary Accent**: Accent Navy (`{colors.accent}` — `#12334D`) — use in hero gradients, secondary interactive states
- **Link Text**: Link Teal (`{colors.link}` — `#07536C`) — use for inline hyperlinks
- **Page Background**: Canvas (`{colors.canvas}` — `#F8FAFC`) — default page background
- **Heading Text**: Ink (`{colors.ink}` — `#0F172A`) — headings, strong emphasis
- **Body Text**: Body (`{colors.body}` — `#64748B`) — standard paragraph text
- **Borders & Dividers**: Hairline (`{colors.hairline}` — `#E2E8F0`) — thin 1px borders, card edges
- **Error States**: Error Cyan (`{colors.error}` — `#71CED9`) — validation errors, destructive actions
- **Success States**: Success Green (`{colors.success}` — `#16A34A`) — confirmations, positive feedback

### Iteration Guide

1. **Start with sharp, geometric components**: All interactive elements use 0px border-radius. If a component needs visual softening, adjust padding, spacing, or background contrast—never add border-radius.

2. **Apply the spacing scale religiously**: Every gap, margin, and padding value must be a multiple of 4px. Common sizes: 8px (button padding), 12px (form field padding), 16px (section gutters), 24px (section padding), 48px (vertical rhythm).

3. **Use teal (`#0891B2`) for all primary interactions**: Buttons, links, focus outlines, active states—all derive from this single accent. Do not introduce competing blues or cyans.

4. **Build elevation through colour and borders, not shadows**: Most components are flat with a 1px hairline border. When depth is needed, apply subtle shadows (max blur 14px, near-transparent opacity 0.02–0.1) paired with a micro-transform on hover (translateY −2px).

5. **Typography is frozen in place**: Font sizes and weights are measured precisely. Do not scale them responsively; rely on spacing and layout restructuring to adapt to screen size.

6. **Hover/Focus states are essential for accessibility**: Buttons, cards, and links require visible focus outlines (2px solid `#0891B2`) and hover transforms (brightness 1.12 or translateY −2px). Do not omit these.

7. **Leverage background colours for secondary elements**: Badges, labels, and secondary buttons use soft background tints (e.g. `#ECFEFF` for light cyan, `#F6FFF5` for pale green) paired with darker text, not the reverse.

8. **Inputs and forms are minimal**: White background, thin border, no excessive padding. Focus states use a soft box-shadow (not border colour change) to avoid reflow.

9. **Test responsive layout at 375px, 768px, 1024px, and 1440px**: These are the critical breakpoints where layout shifts occur. Mobile layout hides sidebar and reflows to single-column grid; desktop unfolds to 4-column with visible sidebar.

10. **Reserve decorative accent colours for non-interactive elements**: Amber (`#D97706`), slate (`#94A3B8`), deep navy (`#072F42`), and bright cyan (`#67E8F9`) are used only for visual ornamentation (badges, tags, illustrations), never for interactive feedback or CTA states.

## 10. Known Gaps

- **8 decorative accent colours** (`#D97706`, `#94A3B8`, `#072F42`, `#67E8F9`, `#000000`, `#DAF1F2`, `#CBD5E1`, `#D3E3D6`) have no measurable semantic role. They appear in the design but are used only for secondary visual interest; no interaction or status logic derives from them. Their exact usage contexts may vary beyond the measured pages.
- **Interaction states for form inputs** (error, warning focus states) were partially observed but not fully measured. The extraction includes some Ant Design-specific pseudo-classes (`:hover`, `:focus`) but the full state matrix for all field types (error/warning/success) is not guaranteed complete.
- **Dark mode or theme variants** are not present in the measured data. IBACUU operates in a single light theme; any dark-mode adaptation is not documented here and should be designed separately.
- **Animation timings and transition durations** (e.g. hover transitions, modal animations) were not extracted. Component states are instant or assume browser defaults; no custom easing curves are documented.
- **Surfaces behind authentication** (account pages, admin dashboards, premium tiers) were not visited during extraction. The design system reflects publicly accessible product pages and marketplace UI only.
- **Micro-interactions** (loading states, skeleton screens, inline validation feedback) may exist but were not explicitly measured. Assume standard loading spinners and error messages follow the colour and typography tokens provided.
- **Print styles** are not covered. The design system is optimized for screen viewing only.
- **Accessibility (WCAG) conformance** has not been formally validated. Contrast ratios and colour blindness considerations should be independently verified for critical UI paths.

---

**Design System Version**: 1.0  
**Extracted from**: ibacuu.store/vi/products (6 pages analysed)  
**Primary Font**: GeistSans  
**Primary Brand Colour**: #0891B2 (Teal-Cyan)  
**Canvas Background**: #F8FAFC (Slate-Off-White)  
**Radius Strategy**: Sharp Geometric (0px throughout)  
**Elevation Model**: Color-Blocking + Micro-Shadows  