export type PortfolioProject = {
  id: string
  title: string
  slug: string
  category: string
  description: string
  thumbnail: string | null
  site_url: string | null
  display_order: number
  featured: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export type SiteContent = {
  id: string
  key: string
  value: string
  updated_at: string
}

export type ContactInfo = {
  whatsapp: string
  email: string
  instagram: string
  phone?: string
}
