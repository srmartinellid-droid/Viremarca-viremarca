export type TitleStyle = {
  text: string
  highlight?: string
  textColor?: string
  highlightColor?: string
  highlightStyle?: "color" | "italic" | "underline" | "marker"
  align?: "left" | "center"
  fontWeight?: 400 | 500 | 600 | 700
}

export const DEFAULT_TITLE_STYLES: Record<string, TitleStyle> = {
  hero: { text: "Seu negócio merece uma presença digital à altura.", highlight: "presença digital à altura.", textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color", align: "left", fontWeight: 600 },
  process: { text: "Como trabalhamos", highlight: "trabalhamos", textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 },
  about: { text: "Quem somos", highlight: "somos", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 },
  delivers: { text: "Não entregamos páginas. Construímos presença.", highlight: "Construímos presença.", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 },
  portfolio: { text: "Veja a VireMarca em ação", highlight: "VireMarca em ação", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 },
  contact: { text: "Pronto para virar a marca do seu negócio?", highlight: "virar a marca", textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color", fontWeight: 600 },
}
