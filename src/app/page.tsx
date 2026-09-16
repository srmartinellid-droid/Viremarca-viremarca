import { Hero } from "@/components/Hero"
import { PortfolioShowcase } from "@/components/PortfolioShowcase"
import { Process } from "@/components/Process"
import { About } from "@/components/About"
import { Delivers } from "@/components/Delivers"
import { ContactCTA } from "@/components/ContactCTA"
import { getPublicProjects } from "@/lib/projects"
import { getPublicSiteContent } from "@/lib/site-content"

export default async function HomePage() {
  const [projects, content] = await Promise.all([
    getPublicProjects(),
    getPublicSiteContent(),
  ])

  return (
    <>
      <Hero content={content} />
      <PortfolioShowcase projects={projects} />
      <Process />
      <About content={content} />
      <Delivers />
      <ContactCTA contact={content.contact} />
    </>
  )
}
