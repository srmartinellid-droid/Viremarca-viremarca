/** VireLab preference model — ready for future Supabase persistence */

export type Atmosphere =
  | "Minimal"
  | "Editorial"
  | "Premium"
  | "Dark"
  | "Light"
  | "Technical"
  | "Organic"
  | "Bold"

export type MotionLevel =
  | "Subtle"
  | "Smooth"
  | "Dynamic"
  | "Expressive"
  | "Immersive"

export type CardStyle =
  | "Minimal"
  | "Image"
  | "Bento"
  | "Interactive"
  | "Glass"
  | "Editorial"
  | "Feature"

export type ImageTreatment =
  | "Static"
  | "Zoom"
  | "Parallax"
  | "Reveal"
  | "Grayscale → Color"
  | "Mask Reveal"
  | "Depth"

export type NavStyle =
  | "Minimal"
  | "Floating"
  | "Sticky"
  | "Transparent"
  | "Editorial"

export type TypographyStyle =
  | "Modern"
  | "Editorial"
  | "Technical"
  | "Luxury"
  | "Bold"
  | "Minimal"

export type InteractionStyle =
  | "Magnetic button"
  | "Cursor spotlight"
  | "Hover card"
  | "Accordion"
  | "Image reveal"
  | "Sticky section"
  | "Horizontal scroll"
  | "Case cascade"

export type VireLabPreferences = {
  atmosphere: Atmosphere
  motion: MotionLevel
  cards: CardStyle[]
  image: ImageTreatment
  navigation: NavStyle
  typography: TypographyStyle
  interaction: InteractionStyle[]
}

export const DEFAULT_PREFS: VireLabPreferences = {
  atmosphere: "Premium",
  motion: "Dynamic",
  cards: ["Bento", "Interactive"],
  image: "Grayscale → Color",
  navigation: "Floating",
  typography: "Editorial",
  interaction: ["Magnetic button", "Hover card", "Image reveal"],
}

export const ATMOSPHERES: Atmosphere[] = [
  "Minimal",
  "Editorial",
  "Premium",
  "Dark",
  "Light",
  "Technical",
  "Organic",
  "Bold",
]

export const MOTIONS: MotionLevel[] = [
  "Subtle",
  "Smooth",
  "Dynamic",
  "Expressive",
  "Immersive",
]

export const CARD_STYLES: CardStyle[] = [
  "Minimal",
  "Image",
  "Bento",
  "Interactive",
  "Glass",
  "Editorial",
  "Feature",
]

export const IMAGE_TREATMENTS: ImageTreatment[] = [
  "Static",
  "Zoom",
  "Parallax",
  "Reveal",
  "Grayscale → Color",
  "Mask Reveal",
  "Depth",
]

export const NAV_STYLES: NavStyle[] = [
  "Minimal",
  "Floating",
  "Sticky",
  "Transparent",
  "Editorial",
]

export const TYPOGRAPHY_STYLES: TypographyStyle[] = [
  "Modern",
  "Editorial",
  "Technical",
  "Luxury",
  "Bold",
  "Minimal",
]

export const INTERACTIONS: InteractionStyle[] = [
  "Magnetic button",
  "Cursor spotlight",
  "Hover card",
  "Accordion",
  "Image reveal",
  "Sticky section",
  "Horizontal scroll",
  "Case cascade",
]

export function formatBriefing(prefs: VireLabPreferences): string {
  return `VIREMARCA — DIREÇÃO VISUAL

Atmosfera:
${prefs.atmosphere}

Motion:
${prefs.motion}

Layout:
Bento / Editorial

Cards:
${prefs.cards.join(" + ")}

Image treatment:
${prefs.image}

Navigation:
${prefs.navigation}

Typography:
${prefs.typography}

Interaction:
${prefs.interaction.join(", ")}`
}
