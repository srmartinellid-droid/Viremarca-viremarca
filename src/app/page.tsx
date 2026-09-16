import { Hero } from "@/components/Hero"
import { PortfolioShowcase } from "@/components/PortfolioShowcase"
import { Process } from "@/components/Process"
import { About } from "@/components/About"
import { Delivers } from "@/components/Delivers"
import { ContactCTA } from "@/components/ContactCTA"
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
      <PortfolioShowcase projects={projects} />
      <Process items={content.process} />
      <About content={content} />
      <Delivers items={content.delivers} />
      <ContactCTA contact={content.contact} />
    </>
  )
}
