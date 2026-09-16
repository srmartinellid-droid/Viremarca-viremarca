import { Hero } from "@/components/Hero"
import { PortfolioShowcase } from "@/components/PortfolioShowcase"
import { Process } from "@/components/Process"
import { About } from "@/components/About"
import { Delivers } from "@/components/Delivers"
import { ContactCTA } from "@/components/ContactCTA"
import { DEMO_PROJECTS } from "@/lib/demo-data"

export default function HomePage() {
  const projects = DEMO_PROJECTS.filter((p) => p.active).sort(
    (a, b) => a.display_order - b.display_order
  )

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
