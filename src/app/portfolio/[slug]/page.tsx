import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getProjectBySlug, getPublicProjects } from "@/lib/projects"
import type { Metadata } from "next"

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const projects = await getPublicProjects()
  return projects.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: "Projeto" }
  return {
    title: project.title,
    description: project.description,
  }
}

export default async function PortfolioProjectPage({ params }: Props) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  return (
    <div className="pt-24 pb-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link
          href="/#sites"
          className="inline-flex items-center gap-2 text-sm text-vm-muted hover:text-vm-ink transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Voltar aos sites
        </Link>

        <div className="mb-8">
          <p className="text-sm font-medium text-vm-coral mb-2">{project.category}</p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-vm-ink">
            {project.title}
          </h1>
          <p className="mt-4 text-vm-muted max-w-2xl leading-relaxed">
            {project.description}
          </p>

          {project.site_url && (
            <a
              href={project.site_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-vm-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-vm-coral-deep transition-colors"
            >
              Visitar site
              <ExternalLink size={15} />
            </a>
          )}
        </div>

        <div className="rounded-2xl border border-vm-border overflow-hidden bg-vm-sand shadow-sm">
          {project.site_url ? (
            <div className="relative">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-vm-border bg-white">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-400/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="rounded-md bg-vm-bg px-3 py-1 text-xs text-vm-muted truncate text-center">
                    {project.site_url}
                  </div>
                </div>
              </div>
              <div className="relative aspect-[16/10] bg-white">
                <iframe
                  src={project.site_url}
                  title={project.title}
                  className="absolute inset-0 w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  allow="fullscreen"
                  loading="eager"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          ) : (
            <div className="aspect-[16/10] flex flex-col items-center justify-center gap-4 p-8 text-center">
              {project.thumbnail && (
                <div className="relative w-full max-w-md aspect-video rounded-xl overflow-hidden border border-vm-border">
                  <Image src={project.thumbnail} alt={project.title} fill className="object-cover" />
                </div>
              )}
              <p className="text-vm-muted text-sm max-w-sm">
                Preview em breve.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
