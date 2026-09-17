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
  const [projects, featuredProjects, content] = await Promise.all([getPublicProjects(), getFeaturedProjects(), getPublicSiteContent()])
  return <><Hero content={content} featuredProjects={featuredProjects} /><SectionDivider config={content.dividerStyles.projects} /><PortfolioShowcase projects={projects} titleStyle={content.titleStyles.portfolio} /><SectionDivider config={content.dividerStyles.method} /><Process items={content.process} titleStyle={content.titleStyles.process} /><SectionDivider config={content.dividerStyles.presence} /><About content={content} /><Delivers items={content.delivers} titleStyle={content.titleStyles.delivers} /><ContactCTA contact={content.contact} titleStyle={content.titleStyles.contact} /></>
}
