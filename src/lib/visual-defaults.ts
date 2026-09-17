export type TitleStyle = {
  text: string
  highlight?: string
  textColor?: string
  highlightColor?: string
  highlightStyle?: "color" | "italic" | "underline" | "marker"
  align?: "left" | "center"
}

export const DEFAULT_TITLE_STYLES: Record<string, TitleStyle> = {
  process: { text: "Como trabalhamos", highlight: "trabalhamos", textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color" },
  about: { text: "Quem somos", highlight: "somos", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color" },
  delivers: { text: "Não entregamos páginas. Construímos presença.", highlight: "Construímos presença.", textColor: "#171717", highlightColor: "#E07A5F", highlightStyle: "color" },
  contact: { text: "Pronto para virar a marca do seu negócio?", highlight: "virar a marca", textColor: "#FFFFFF", highlightColor: "#E07A5F", highlightStyle: "color" },
}
