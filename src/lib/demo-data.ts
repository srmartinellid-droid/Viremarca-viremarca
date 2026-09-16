import type { PortfolioProject } from "@/types"

export const DEMO_PROJECTS: PortfolioProject[] = [
  {
    id: "1",
    title: "Magia Glass",
    slug: "magia-glass",
    category: "Serviços · Vidraçaria",
    description: "Site institucional e comercial para empresa de vidros e esquadrias, com portfólio de projetos e formulário de orçamento.",
    thumbnail: "/portfolio/magia-glass.jpg",
    site_url: "https://viremarca-vidracaria-magiaglass.vercel.app/",
    display_order: 1,
    featured: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Clínica Horizonte",
    slug: "clinica-horizonte",
    category: "Odontologia",
    description: "Presença digital completa para clínica odontológica: agenda online, tratamentos e experiência premium no mobile.",
    thumbnail: "/portfolio/odonto.jpg",
    site_url: null,
    display_order: 2,
    featured: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    title: "Lima & Kowalski Advocacia",
    slug: "lima-kowalski",
    category: "Advocacia",
    description: "Site institucional para escritório de advocacia, com áreas de atuação, equipe e captura de leads qualificados.",
    thumbnail: "/portfolio/advocacia.jpg",
    site_url: null,
    display_order: 3,
    featured: true,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    title: "Casa Nova Imóveis",
    slug: "casa-nova-imoveis",
    category: "Corretor de imóveis",
    description: "Plataforma de imóveis com busca, destaques e formulário de interesse — pensada para corretores autônomos e imobiliárias.",
    thumbnail: "/portfolio/imoveis.jpg",
    site_url: null,
    display_order: 4,
    featured: false,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const DEMO_CONTENT = {
  heroTitle: "Seu negócio merece uma presença digital à altura.",
  heroSubtitle: "A VireMarca cria sites profissionais pensados para cada segmento — com design, performance e estrutura que realmente vendem.",
  aboutTitle: "Uma nova marca, construída sobre experiência real.",
  aboutBody: `A VireMarca nasce agora, mas não do zero.

Mais de duas décadas trabalhando com tecnologia, atendimento e operação de soluções técnicas formaram a base. Agora essa bagagem é direcionada para um propósito claro: transformar negócios locais em marcas digitais profissionais.

Não somos uma fábrica de sites genéricos. Não somos uma agência de marketing. Somos especialistas em criar presenças digitais que respeitam o segmento do cliente e conversam com o público certo.`,
  process: [
    { step: "01", title: "Entendemos o negócio", desc: "Conversamos sobre o que você vende, para quem e qual o objetivo do site." },
    { step: "02", title: "Definimos a estrutura", desc: "Escolhemos o template de nicho e a arquitetura de páginas e conversão." },
    { step: "03", title: "Construímos a experiência", desc: "Design, conteúdo, performance e integração — tudo alinhado à sua marca." },
    { step: "04", title: "Publicamos e evoluímos", desc: "Site no ar, com admin para você atualizar e acompanhamento contínuo." },
  ],
  delivers: [
    { title: "Sites institucionais", desc: "Presença profissional e confiável para a sua empresa." },
    { title: "Sites para profissionais", desc: "Advogados, médicos, corretores e especialistas." },
    { title: "Sites por segmento", desc: "Templates inteligentes que respeitam a lógica do nicho." },
    { title: "Landing pages", desc: "Páginas de conversão focadas em um objetivo." },
    { title: "Portfólios e galerias", desc: "Mostre o seu trabalho com elegância e clareza." },
    { title: "Estruturas personalizadas", desc: "Quando o projeto exige algo além do template." },
  ],
  contact: {
    whatsapp: "5548999999999",
    email: "contato@viremarca.com.br",
    instagram: "viremarca",
  },
}
