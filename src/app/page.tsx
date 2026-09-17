import { Hero } from "@/components/Hero"
import { PortfolioShowcase } from "@/components/PortfolioShowcase"
import { Process } from "@/components/Process"
import { About } from "@/components/About"
import { Delivers } from "@/components/Delivers"
import { ContactCTA } from "@/components/ContactCTA"
import { SectionDivider } from "@/components/SectionDivider"
import { getFeaturedProjects, getPublicProjects } from "@/lib/projects"
import { getPublicSiteContent } from "@/lib/site-content"

export default async function HomePage() {
  const [projects, featuredProjects, content] = await Promise.all([
    getPublicProjects(),
    getFeaturedProjects(),
    getPublicSiteContent(),
  ])

  return (
    <>
      <Hero content={content} featuredProjects={featuredProjects} />
      <SectionDivider variant="dark" label="Projetos em destaque" />
      <PortfolioShowcase projects={projects} />
      <SectionDivider variant="light" label="Método · Direção · Resultado" />
      <Process items={content.process} />
      <SectionDivider variant="dark" label="Uma marca que ganha presença" />
      <About content={content} />
      <Delivers items={content.delivers} />
      <ContactCTA contact={content.contact} />
    </>
  )
}
