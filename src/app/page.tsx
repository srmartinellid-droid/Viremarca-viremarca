import { Hero } from "@/components/Hero"
import { PortfolioShowcase } from "@/components/PortfolioShowcase"
import { Process } from "@/components/Process"
import { About } from "@/components/About"
import { Delivers } from "@/components/Delivers"
import { ContactCTA } from "@/components/ContactCTA"
import { getPublicProjects } from "@/lib/projects"

export default async function HomePage() {
  const projects = await getPublicProjects()

  return (
    <>
      <Hero />
      <PortfolioShowcase projects={projects} />
      <Process />
      <About />
      <Delivers />
      <ContactCTA />
    </>
  )
}
