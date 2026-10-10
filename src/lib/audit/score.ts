import type { Facts } from "./collect"
import type { Psi } from "./psi"

export type Severity = "critico" | "atencao" | "info"
export type Finding = { id: string; severity: Severity; criterion: string; title: string; evidence: string; impact: string; fix: string; source: "regra" | "ia" }
export type CriterionId = "clareza" | "navegacao" | "confianca" | "conversao" | "conteudo" | "desempenho" | "mobile" | "seo" | "seguranca" | "presenca"
export type CriterionResult = { id: CriterionId; label: string; pillar: "experiencia" | "tecnico"; weight: number; rules: number; llm: number | null; score: number; why: string; checks: { label: string; status: "pass" | "warn" | "fail" }[] }
export type LlmCriterion = { score: number; why: string }
export type LlmOut = { criteria?: Partial<Record<CriterionId, LlmCriterion>>; findings?: Array<Partial<Finding>>; strengths?: string[]; quick_wins?: string[]; first_impression?: string }
export type Report = {
  url: string; host: string; generatedAt: string; overall: number; verdict: string
  pillars: { experiencia: number; tecnico: number }; criteria: CriterionResult[]; findings: Finding[]; strengths: string[]
  quickWins: string[]; structural: string[]; psi: Psi | null; firstImpression: string | null; aiUsed: boolean; limits: string[]
  metrics: { ttfbMs: number; htmlKb: number; words: number; images: number; internalChecked: number }
}

export const CRITERIA: { id: CriterionId; label: string; pillar: "experiencia" | "tecnico"; weight: number; question: string }[] = [
  { id: "clareza", label: "Clareza da proposta", pillar: "experiencia", weight: 12, question: "Em 5 segundos o visitante entende o que a empresa faz, para quem e o que fazer a seguir?" },
  { id: "navegacao", label: "Navegação e estrutura", pillar: "experiencia", weight: 8, question: "O visitante encontra o que procura sem se perder? As páginas funcionam?" },
  { id: "confianca", label: "Confiança e credibilidade", pillar: "experiencia", weight: 12, question: "O site passa segurança para o visitante entregar contato ou dinheiro?" },
  { id: "conversao", label: "Conversão e contato", pillar: "experiencia", weight: 14, question: "É fácil e visível entrar em contato, pedir orçamento ou comprar?" },
  { id: "conteudo", label: "Conteúdo", pillar: "experiencia", weight: 8, question: "Os textos e imagens respondem às dúvidas e sustentam a decisão?" },
  { id: "desempenho", label: "Desempenho", pillar: "tecnico", weight: 12, question: "O site carrega rápido o bastante para não perder visitantes?" },
  { id: "mobile", label: "Experiência no celular", pillar: "tecnico", weight: 8, question: "O site é confortável e estável no celular?" },
  { id: "seo", label: "SEO e indexação", pillar: "tecnico", weight: 12, question: "O Google consegue encontrar, entender e exibir bem o site?" },
  { id: "seguranca", label: "Segurança e acessibilidade", pillar: "tecnico", weight: 8, question: "O site é seguro e utilizável por todos?" },
  { id: "presenca", label: "Compartilhamento e presença", pillar: "tecnico", weight: 6, question: "O site aparece bem ao ser compartilhado e em buscas locais?" },
]

type St = "pass" | "warn" | "fail"
type Check = { label: string; status: St; w: number; sev?: Severity; title?: string; evidence?: string; impact?: string; fix?: string; strength?: string }

const pct = (a: number, b: number) => (b ? a / b : 0)
const ms = (n: number) => (n >= 1000 ? (n / 1000).toFixed(1).replace(".", ",") + " s" : Math.round(n) + " ms")

export function ruleChecks(f: Facts, psi: Psi | null): Record<CriterionId, Check[]> {
  const alt = f.images.total ? pct(f.images.total - f.images.noAlt, f.images.total) : 1
  const hasCta = f.ctas.length >= 2
  const contact = f.links.whatsapp + f.links.tel > 0
  const titleLen = f.title.length
  const descLen = f.description.length
  const noindex = /noindex/i.test(f.robotsMeta)
  const uniqueTitles = f.pages.filter(p => p.titleDuplicate).length
  const lcpOk = psi?.lcpMs != null ? psi.lcpMs <= 2500 : null
  const out: Record<CriterionId, Check[]> = {
    clareza: [
      { label: "Um título principal (H1)", status: f.h1.length === 1 ? "pass" : f.h1.length === 0 ? "fail" : "warn", w: 3, sev: "critico", title: f.h1.length === 0 ? "A página inicial não tem título principal (H1)" : "Mais de um título principal (H1) na página", evidence: f.h1.length ? `Encontrados ${f.h1.length} H1: "${f.h1.slice(0, 2).join('", "')}"` : "Nenhum H1 encontrado no HTML", impact: "Sem um título claro, o visitante e o Google demoram para entender do que se trata a página.", fix: "Use um único H1 dizendo, em uma frase, o que a empresa faz e para quem.", strength: "Título principal (H1) bem definido" },
      { label: "Título da aba com tamanho adequado", status: titleLen >= 25 && titleLen <= 65 ? "pass" : titleLen ? "warn" : "fail", w: 2, sev: "atencao", title: titleLen ? "Título da página fora do tamanho ideal" : "A página não tem título (title)", evidence: titleLen ? `O título tem ${titleLen} caracteres: "${f.title.slice(0, 80)}"` : "Tag <title> ausente", impact: "Aparece cortado ou fraco nos resultados do Google e na aba do navegador.", fix: "Escreva um título de 30 a 60 caracteres com o serviço e a cidade." },
      { label: "Texto de apoio na primeira dobra", status: f.text.aboveFold.length > 60 ? "pass" : "warn", w: 2, sev: "atencao", title: "Pouca explicação logo no topo da página", evidence: `Texto da primeira dobra: "${f.text.aboveFold.slice(0, 100)}"`, impact: "Quem chega pelo celular decide em poucos segundos se fica ou sai.", fix: "Logo abaixo do título, explique em uma frase o benefício e coloque um botão de ação." },
      { label: "Chamada para ação visível", status: hasCta ? "pass" : f.ctas.length ? "warn" : "fail", w: 3, sev: "critico", title: "Falta uma chamada para ação clara", evidence: f.ctas.length ? `Botões/links de ação encontrados: ${f.ctas.slice(0, 4).join(", ")}` : "Nenhum botão de ação (contato, orçamento, WhatsApp) encontrado", impact: "O visitante entende o site, mas não sabe qual é o próximo passo.", fix: "Coloque um botão principal (ex.: Falar no WhatsApp) na primeira tela e repita ao longo da página.", strength: "Chamadas para ação presentes no site" },
    ],
    navegacao: [
      { label: "Menu com links principais", status: f.nav.length >= 3 ? "pass" : "warn", w: 2, sev: "atencao", title: "Menu de navegação enxuto ou ausente", evidence: `Itens de menu detectados: ${f.nav.slice(0, 8).join(" · ") || "nenhum"}`, impact: "Visitantes que querem ver serviços ou contato não encontram o caminho.", fix: "Inclua no menu: serviços, sobre, contato." },
      { label: "Links internos funcionando", status: f.links.broken.length === 0 ? "pass" : "fail", w: 3, sev: "critico", title: "Links internos quebrados", evidence: f.links.broken.length ? `${f.links.broken.length} de ${f.links.checked} páginas testadas falharam: ${f.links.broken.slice(0, 3).map(b => `${b.url} (${b.status || "sem resposta"})`).join("; ")}` : `${f.links.checked} páginas internas testadas, sem erro`, impact: "Link quebrado passa a imagem de abandono e derruba a confiança.", fix: "Corrija ou remova os links que levam a páginas inexistentes.", strength: "Páginas internas testadas responderam sem erro" },
      { label: "Títulos diferentes em cada página", status: uniqueTitles === 0 ? "pass" : "warn", w: 2, sev: "atencao", title: "Páginas com o mesmo título da página inicial", evidence: `${uniqueTitles} página(s) amostrada(s) repetem o título da home`, impact: "O Google não diferencia as páginas e o visitante se confunde entre abas.", fix: "Dê um título próprio a cada página." },
      { label: "Rodapé presente", status: f.signals.footer ? "pass" : "warn", w: 1, sev: "info", title: "Site sem rodapé", evidence: "Nenhuma tag <footer> encontrada", impact: "Rodapé é onde o visitante espera achar contato e informações legais.", fix: "Adicione rodapé com contato, redes e política de privacidade." },
      { label: "Mapa do site (sitemap)", status: f.sitemap.status === 200 && f.sitemap.urls > 0 ? "pass" : "warn", w: 1, sev: "atencao", title: "Sem sitemap.xml", evidence: f.sitemap.status ? `/sitemap.xml respondeu ${f.sitemap.status}` : "/sitemap.xml não respondeu", impact: "Atrasa a descoberta das páginas pelo Google.", fix: "Publique /sitemap.xml e envie ao Google Search Console." },
    ],
    confianca: [
      { label: "Conexão segura (HTTPS)", status: f.https ? "pass" : "fail", w: 3, sev: "critico", title: "O site não usa conexão segura (HTTPS)", evidence: `Endereço final: ${f.url}`, impact: "O navegador mostra aviso de “site não seguro” e o visitante desiste.", fix: "Ative certificado HTTPS e redirecione todo o tráfego.", strength: "Site em HTTPS" },
      { label: "Telefone ou e-mail visível", status: f.signals.phone || f.signals.email || f.links.whatsapp || f.links.tel || f.links.mailto ? "pass" : "fail", w: 2, sev: "critico", title: "Nenhum telefone ou e-mail visível", evidence: "Não encontrei telefone nem e-mail no texto da página inicial", impact: "Sem canal de contato claro, o visitante não confia.", fix: "Mostre telefone/WhatsApp e e-mail no topo e no rodapé." },
      { label: "Endereço ou região de atuação", status: f.signals.address || f.signals.mapEmbed ? "pass" : "warn", w: 1, sev: "atencao", title: "Sem endereço ou região de atuação", evidence: "Nenhum endereço ou mapa identificado", impact: "Negócio local sem localização perde confiança e busca local.", fix: "Informe cidade/endereço e, se houver loja, incorpore o mapa." },
      { label: "Política de privacidade", status: f.signals.privacy ? "pass" : "warn", w: 2, sev: "atencao", title: "Sem política de privacidade acessível", evidence: "Nenhum link de privacidade/termos encontrado", impact: "Risco com a LGPD e sinal de site pouco profissional.", fix: "Publique a política e linke no rodapé." },
      { label: "Página sobre / quem somos", status: f.signals.about ? "pass" : "warn", w: 1, sev: "atencao", title: "Sem página “Quem somos”", evidence: "Nenhum link de Sobre/Quem somos", impact: "Pessoas contratam pessoas: sem história, a confiança é menor.", fix: "Conte quem está por trás da empresa, de forma honesta." },
      { label: "Provas sociais", status: f.signals.testimonials ? "pass" : "warn", w: 1, sev: "atencao", title: "Sem depoimentos ou avaliações visíveis", evidence: "Nenhuma seção de depoimentos/avaliações encontrada", impact: "Sem prova de que outros clientes foram bem atendidos, a decisão fica mais difícil.", fix: "Exiba avaliações reais (Google, clientes). Nunca invente depoimentos." },
      { label: "Redes sociais ligadas ao site", status: f.signals.social.length ? "pass" : "warn", w: 1, sev: "info", title: "Redes sociais não aparecem no site", evidence: "Nenhum link para Instagram, Facebook ou LinkedIn", impact: "Perde a chance de mostrar que a empresa está ativa.", fix: "Linke as redes que você realmente atualiza." },
      { label: "Dados da empresa (CNPJ)", status: f.signals.cnpj ? "pass" : "warn", w: 1, sev: "info", title: "CNPJ não aparece", evidence: "Nenhum CNPJ identificado na página inicial", impact: "Em e-commerce e serviços, o CNPJ reforça a legitimidade.", fix: "Mostre CNPJ e razão social no rodapé, se houver." },
    ],
    conversao: [
      { label: "Botões e chamadas de contato", status: hasCta ? "pass" : f.ctas.length ? "warn" : "fail", w: 3, sev: "critico", title: "Poucas chamadas para contato", evidence: `Chamadas encontradas: ${f.ctas.length ? f.ctas.slice(0, 5).join(", ") : "nenhuma"}`, impact: "Quem quer comprar precisa achar o botão sem procurar.", fix: "Coloque botão de contato fixo no topo e repita após cada seção.", strength: "Botões de ação claros" },
      { label: "WhatsApp ou telefone clicável", status: contact ? "pass" : "fail", w: 3, sev: "critico", title: "Sem WhatsApp ou telefone clicável", evidence: `Links de WhatsApp: ${f.links.whatsapp}, telefone: ${f.links.tel}`, impact: "No celular, cada passo extra para ligar ou chamar derruba os contatos.", fix: "Use links wa.me e tel: nos botões de contato.", strength: "WhatsApp/telefone clicável" },
      { label: "Formulário de contato", status: f.forms > 0 ? "pass" : "warn", w: 1, sev: "info", title: "Sem formulário de contato", evidence: `Formulários encontrados: ${f.forms}`, impact: "Quem não quer ligar não tem alternativa para pedir retorno.", fix: "Adicione um formulário curto (nome, WhatsApp, o que precisa)." },
      { label: "E-mail clicável", status: f.links.mailto > 0 ? "pass" : "warn", w: 1, sev: "info", title: "E-mail não é clicável", evidence: `Links mailto: ${f.links.mailto}`, impact: "Pequeno atrito para quem prefere e-mail.", fix: "Transforme o e-mail em link mailto." },
      { label: "Ação na primeira dobra", status: /whatsapp|contato|or[çc]amento|fale|solicit|agende|diagn/i.test(f.text.aboveFold) ? "pass" : "warn", w: 2, sev: "atencao", title: "A ação principal não aparece logo no topo", evidence: `Primeira dobra: "${f.text.aboveFold.slice(0, 90)}"`, impact: "Visitante de celular raramente rola a página para achar o contato.", fix: "Leve o botão principal para a primeira tela." },
    ],
    conteudo: [
      { label: "Volume de texto da página inicial", status: f.text.words >= 300 ? "pass" : f.text.words >= 150 ? "warn" : "fail", w: 3, sev: "atencao", title: "Pouco conteúdo na página inicial", evidence: `A página tem cerca de ${f.text.words} palavras`, impact: "Pouco texto dificulta o Google entender o negócio e deixa dúvidas sem resposta.", fix: "Explique serviços, diferenciais e perguntas frequentes em linguagem simples.", strength: "Conteúdo textual consistente" },
      { label: "Seções com subtítulos (H2)", status: f.h2.length >= 3 ? "pass" : "warn", w: 2, sev: "atencao", title: "Página sem divisão clara em seções", evidence: `${f.h2.length} subtítulos (H2) encontrados`, impact: "Texto corrido sem estrutura cansa e é mal interpretado pelo Google.", fix: "Divida o conteúdo em seções com subtítulos objetivos." },
      { label: "Imagens ilustrando o conteúdo", status: f.images.total >= 3 ? "pass" : "warn", w: 1, sev: "info", title: "Poucas imagens", evidence: `${f.images.total} imagens na página inicial`, impact: "Site sem imagens parece vazio e menos profissional.", fix: "Use fotos reais do negócio, não só banco de imagens." },
      { label: "Imagens com texto alternativo", status: alt >= 0.9 ? "pass" : alt >= 0.5 ? "warn" : "fail", w: 2, sev: "atencao", title: "Imagens sem texto alternativo", evidence: `${f.images.noAlt} de ${f.images.total} imagens sem atributo alt`, impact: "Prejudica acessibilidade e a busca por imagens.", fix: "Descreva cada imagem relevante no atributo alt." },
      { label: "Páginas internas com conteúdo", status: f.pages.length === 0 ? "warn" : f.pages.filter(p => p.words >= 100).length >= Math.ceil(f.pages.length / 2) ? "pass" : "warn", w: 2, sev: "atencao", title: "Páginas internas com pouco texto", evidence: f.pages.length ? `Amostra: ${f.pages.map(p => `${new URL(p.url).pathname} (${p.words} palavras)`).slice(0, 4).join("; ")}` : "Não encontrei páginas internas para amostrar", impact: "Páginas vazias não ajudam a vender nem a aparecer no Google.", fix: "Dê a cada serviço sua própria página com conteúdo útil." },
    ],
    desempenho: [
      ...(psi?.performance != null ? [{ label: "Nota de desempenho do Google (celular)", status: (psi.performance >= 90 ? "pass" : psi.performance >= 50 ? "warn" : "fail") as St, w: 6, sev: "critico" as Severity, title: `Desempenho no celular: nota ${psi.performance}/100 no Google`, evidence: `PageSpeed Insights (celular): desempenho ${psi.performance}, LCP ${psi.lcpMs != null ? ms(psi.lcpMs) : "n/d"}, bloqueio ${psi.tbtMs != null ? ms(psi.tbtMs) : "n/d"}, CLS ${psi.cls != null ? psi.cls.toFixed(2) : "n/d"}`, impact: "Cada segundo a mais de carregamento no celular aumenta a desistência.", fix: psi.opportunities[0] ? `Prioridade apontada pelo Google: ${psi.opportunities[0].title}.` : "Otimize imagens, reduza scripts e use cache.", strength: `Desempenho no celular com nota ${psi.performance}/100 no Google` }] : []),
      { label: "Tempo de resposta do servidor", status: f.ttfbMs <= 600 ? "pass" : f.ttfbMs <= 1500 ? "warn" : "fail", w: 2, sev: "atencao", title: "Servidor lento para responder", evidence: `Primeira resposta em ${ms(f.ttfbMs)}`, impact: "Atrasa tudo que vem depois e pesa no ranking do Google.", fix: "Use hospedagem com cache/CDN e reduza processamento no servidor.", strength: `Servidor responde rápido (${ms(f.ttfbMs)})` },
      { label: "Compressão de texto ativa", status: f.headers.encoding ? "pass" : "fail", w: 2, sev: "atencao", title: "Compressão (gzip/brotli) desativada", evidence: "Cabeçalho content-encoding ausente", impact: "A página é enviada maior do que precisa.", fix: "Ative compressão brotli/gzip no servidor." },
      { label: "Tamanho do HTML", status: f.htmlBytes <= 200_000 ? "pass" : f.htmlBytes <= 500_000 ? "warn" : "fail", w: 1, sev: "info", title: "HTML pesado", evidence: `HTML com ${(f.htmlBytes / 1024).toFixed(0)} KB`, impact: "Mais bytes, mais espera em conexões móveis.", fix: "Remova código e dados desnecessários da página." },
      { label: "Imagens modernas ou com carregamento tardio", status: f.images.total === 0 || f.images.modernFormat + f.images.lazy >= f.images.total * 0.5 ? "pass" : "warn", w: 2, sev: "atencao", title: "Imagens sem otimização", evidence: `${f.images.modernFormat} em formato moderno e ${f.images.lazy} com lazy-load de ${f.images.total}`, impact: "Imagens pesadas são a principal causa de site lento no celular.", fix: "Converta para WebP/AVIF e use carregamento tardio abaixo da primeira tela." },
      { label: "Poucos scripts de terceiros", status: f.scripts.thirdParty <= 5 ? "pass" : "warn", w: 1, sev: "info", title: "Muitos scripts de terceiros", evidence: `${f.scripts.thirdParty} scripts externos de outros domínios`, impact: "Cada script externo pode atrasar e travar a página.", fix: "Mantenha só os scripts realmente úteis." },
    ],
    mobile: [
      { label: "Meta viewport para celular", status: f.viewport ? "pass" : "fail", w: 4, sev: "critico", title: "Site não declara versão para celular (viewport)", evidence: "Meta viewport ausente", impact: "No celular a página aparece minúscula e difícil de usar.", fix: "Adicione <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.", strength: "Preparado para celular (viewport)" },
      { label: "Imagens com dimensões definidas", status: f.images.total === 0 || pct(f.images.noDims, f.images.total) <= 0.3 ? "pass" : "warn", w: 2, sev: "atencao", title: "Imagens sem largura/altura definidas", evidence: `${f.images.noDims} de ${f.images.total} imagens sem dimensões`, impact: "O conteúdo “pula” enquanto carrega, atrapalhando o toque.", fix: "Defina width e height (ou aspect-ratio) nas imagens." },
      ...(psi?.cls != null ? [{ label: "Estabilidade visual (CLS)", status: (psi.cls <= 0.1 ? "pass" : psi.cls <= 0.25 ? "warn" : "fail") as St, w: 2, sev: "atencao" as Severity, title: "Página instável ao carregar no celular", evidence: `CLS ${psi.cls.toFixed(2)} (ideal até 0,10)`, impact: "Botões que se mexem causam toques errados.", fix: "Reserve espaço para imagens, banners e fontes." }] : []),
      ...(lcpOk != null ? [{ label: "Carregamento do conteúdo principal (LCP)", status: (lcpOk ? "pass" : psi!.lcpMs! <= 4000 ? "warn" : "fail") as St, w: 2, sev: "atencao" as Severity, title: "Conteúdo principal demora a aparecer no celular", evidence: `LCP ${ms(psi!.lcpMs!)} (ideal até 2,5 s)`, impact: "O visitante vê tela vazia por tempo demais.", fix: "Otimize a imagem/título principal da primeira tela." }] : []),
    ],
    seo: [
      { label: "Título da página", status: titleLen >= 25 && titleLen <= 65 ? "pass" : titleLen ? "warn" : "fail", w: 2, sev: "atencao", title: "Título de SEO inadequado", evidence: `${titleLen} caracteres: "${f.title.slice(0, 70)}"`, impact: "Título é o principal fator de clique no Google.", fix: "Use 30–60 caracteres com serviço + cidade." },
      { label: "Meta description", status: descLen >= 80 && descLen <= 175 ? "pass" : descLen ? "warn" : "fail", w: 2, sev: "atencao", title: descLen ? "Descrição do Google fora do tamanho ideal" : "Sem descrição para o Google (meta description)", evidence: descLen ? `${descLen} caracteres` : "Meta description ausente", impact: "O Google escolhe um trecho aleatório e o clique cai.", fix: "Escreva 100–160 caracteres convidando para o clique." },
      { label: "H1 único", status: f.h1.length === 1 ? "pass" : "fail", w: 2, sev: "atencao", title: "Estrutura de títulos (H1) incorreta", evidence: `${f.h1.length} H1 na página`, impact: "Confunde o Google sobre o tema da página.", fix: "Um H1 por página, com o tema principal." },
      { label: "URL canônica", status: f.canonical ? "pass" : "warn", w: 1, sev: "atencao", title: "Sem URL canônica", evidence: "Tag canonical ausente", impact: "Risco de conteúdo duplicado entre www e sem www.", fix: "Defina <link rel=\"canonical\"> em cada página." },
      { label: "Idioma declarado", status: f.lang ? "pass" : "warn", w: 1, sev: "info", title: "Idioma da página não declarado", evidence: "Atributo lang ausente no <html>", impact: "Atrapalha buscadores e leitores de tela.", fix: "Use <html lang=\"pt-BR\">." },
      { label: "Página liberada para indexação", status: noindex ? "fail" : "pass", w: 3, sev: "critico", title: "A página inicial está bloqueada para o Google (noindex)", evidence: `Meta robots: ${f.robotsMeta}`, impact: "O site não aparece nas buscas.", fix: "Remova o noindex da página inicial.", strength: "Página liberada para indexação" },
      { label: "robots.txt", status: f.robotsTxt.status === 200 && !f.robotsTxt.blocksAll ? "pass" : f.robotsTxt.blocksAll ? "fail" : "warn", w: 1, sev: f.robotsTxt.blocksAll ? "critico" : "info", title: f.robotsTxt.blocksAll ? "robots.txt bloqueia todo o site" : "Sem robots.txt", evidence: `robots.txt respondeu ${f.robotsTxt.status || "sem resposta"}`, impact: "Pode impedir ou atrapalhar o rastreamento.", fix: "Publique robots.txt apontando para o sitemap." },
      { label: "Sitemap publicado", status: f.sitemap.status === 200 && f.sitemap.urls > 0 ? "pass" : "warn", w: 2, sev: "atencao", title: "Sitemap ausente ou vazio", evidence: `/sitemap.xml: ${f.sitemap.status || "sem resposta"}, ${f.sitemap.urls} URLs`, impact: "O Google demora mais para descobrir páginas novas.", fix: "Gere o sitemap e envie no Search Console." },
      { label: "Dados estruturados (JSON-LD)", status: f.jsonLdTypes.length ? "pass" : "warn", w: 2, sev: "atencao", title: "Sem dados estruturados", evidence: f.jsonLdTypes.length ? `Tipos: ${f.jsonLdTypes.join(", ")}` : "Nenhum JSON-LD encontrado", impact: "Perde resultados enriquecidos (endereço, horário, avaliações).", fix: "Adicione JSON-LD de Organization/LocalBusiness.", strength: "Dados estruturados (JSON-LD) presentes" },
      ...(psi?.seo != null ? [{ label: "Nota de SEO do Google", status: (psi.seo >= 90 ? "pass" : psi.seo >= 70 ? "warn" : "fail") as St, w: 2, sev: "atencao" as Severity, title: `Nota de SEO ${psi.seo}/100 no Google`, evidence: `Lighthouse SEO: ${psi.seo}`, impact: "Indica falhas técnicas de SEO.", fix: "Corrija os itens de SEO do relatório do Lighthouse." }] : []),
    ],
    seguranca: [
      { label: "HTTPS", status: f.https ? "pass" : "fail", w: 3, sev: "critico", title: "Sem HTTPS", evidence: f.url, impact: "Dados do visitante trafegam sem proteção.", fix: "Ative certificado e force HTTPS." },
      { label: "HTTP redireciona para HTTPS", status: f.httpRedirectsToHttps === false ? "fail" : "pass", w: 2, sev: "atencao", title: "Versão http não redireciona para https", evidence: "A versão sem https responde sem redirecionar", impact: "Duplica o site e expõe o visitante.", fix: "Redirecione 100% do tráfego http para https." },
      { label: "HSTS", status: f.headers.hsts ? "pass" : "warn", w: 1, sev: "info", title: "HSTS não configurado", evidence: "Cabeçalho Strict-Transport-Security ausente", impact: "Navegadores não são forçados a usar https.", fix: "Ative o cabeçalho HSTS." },
      { label: "Proteções de cabeçalho (CSP, nosniff, frames)", status: (f.headers.csp ? 1 : 0) + (f.headers.xcto ? 1 : 0) + (f.headers.frame ? 1 : 0) >= 2 ? "pass" : "warn", w: 2, sev: "info", title: "Cabeçalhos de segurança incompletos", evidence: `CSP: ${f.headers.csp ? "sim" : "não"}, nosniff: ${f.headers.xcto ? "sim" : "não"}, anti-frame: ${f.headers.frame ? "sim" : "não"}`, impact: "Menos defesa contra injeção de scripts e clickjacking.", fix: "Configure CSP, X-Content-Type-Options e proteção contra frames." },
      { label: "Idioma declarado", status: f.lang ? "pass" : "warn", w: 1, sev: "info", title: "Idioma não declarado", evidence: "lang ausente", impact: "Leitores de tela pronunciam errado.", fix: "Declare lang=\"pt-BR\"." },
      { label: "Imagens com alt", status: alt >= 0.9 ? "pass" : alt >= 0.5 ? "warn" : "fail", w: 2, sev: "atencao", title: "Acessibilidade: imagens sem alt", evidence: `${f.images.noAlt} imagens sem alt`, impact: "Pessoas com deficiência visual perdem informação.", fix: "Adicione alt descritivo." },
      { label: "Campos de formulário identificados", status: f.forms === 0 || f.formsWithLabels === f.forms ? "pass" : "warn", w: 1, sev: "atencao", title: "Formulário com campos sem rótulo", evidence: `${f.formsWithLabels} de ${f.forms} formulários com rótulos`, impact: "Dificulta preenchimento e leitores de tela.", fix: "Associe um label a cada campo." },
      ...(psi?.accessibility != null ? [{ label: "Nota de acessibilidade do Google", status: (psi.accessibility >= 90 ? "pass" : psi.accessibility >= 70 ? "warn" : "fail") as St, w: 3, sev: "atencao" as Severity, title: `Acessibilidade: nota ${psi.accessibility}/100 no Google`, evidence: `Lighthouse Acessibilidade: ${psi.accessibility}`, impact: "Barreiras reais para parte dos visitantes.", fix: "Corrija contraste, rótulos e navegação por teclado.", strength: `Acessibilidade nota ${psi.accessibility}/100 no Google` }] : []),
    ],
    presenca: [
      { label: "Prévia ao compartilhar (Open Graph)", status: f.og.title && f.og.description && f.og.image ? "pass" : f.og.title || f.og.image ? "warn" : "fail", w: 3, sev: "atencao", title: "Link compartilhado sem prévia completa", evidence: `og:title ${f.og.title ? "sim" : "não"}, og:description ${f.og.description ? "sim" : "não"}, og:image ${f.og.image ? "sim" : "não"}`, impact: "No WhatsApp e redes o link aparece sem foto e sem título atraente.", fix: "Defina título, descrição e imagem 1200×630.", strength: "Prévia de compartilhamento completa" },
      { label: "Imagem de compartilhamento acessível", status: f.og.imageOk === false ? "fail" : "pass", w: 1, sev: "atencao", title: "Imagem de compartilhamento quebrada", evidence: "og:image não carrega", impact: "A prévia sai sem imagem.", fix: "Corrija o endereço da imagem." },
      { label: "Favicon", status: f.favicon ? "pass" : "warn", w: 1, sev: "info", title: "Sem favicon", evidence: "Ícone da aba ausente", impact: "Aba sem identidade e menos reconhecimento.", fix: "Adicione favicon." },
      { label: "Dados de empresa local (JSON-LD)", status: f.jsonLdTypes.some(t => /LocalBusiness|Organization|Store|Professional|Service/i.test(t)) ? "pass" : "warn", w: 3, sev: "atencao", title: "Sem marcação de empresa local", evidence: `Tipos encontrados: ${f.jsonLdTypes.join(", ") || "nenhum"}`, impact: "Menos chance de aparecer bem em buscas locais.", fix: "Marque nome, endereço, telefone e horário com JSON-LD." },
      { label: "Redes sociais ligadas", status: f.signals.social.length ? "pass" : "warn", w: 1, sev: "info", title: "Sem redes sociais ligadas", evidence: "Nenhum perfil linkado", impact: "Menos pontos de contato com o cliente.", fix: "Linke seus perfis ativos." },
      { label: "Mapa/localização", status: f.signals.mapEmbed || f.signals.address ? "pass" : "warn", w: 1, sev: "info", title: "Sem mapa ou localização", evidence: "Nenhum mapa/endereço", impact: "Cliente local não sabe onde ir.", fix: "Mostre o mapa e o Google Meu Negócio." },
      { label: "Página 404 correta", status: f.soft404 === true ? "warn" : "pass", w: 1, sev: "info", title: "Páginas inexistentes retornam “200”", evidence: "Endereço inexistente respondeu 200", impact: "O Google pode indexar páginas vazias.", fix: "Retorne status 404 para páginas que não existem." },
    ],
  }
  return out
}

const num = (s: Check["status"]) => (s === "pass" ? 1 : s === "warn" ? 0.5 : 0)
const r1 = (n: number) => Math.round(n * 10) / 10

export function verdictFor(n: number) {
  return n >= 8.5 ? "Site forte" : n >= 7 ? "Bom, com pontos de melhora" : n >= 5.5 ? "Mediano: deixando oportunidades na mesa" : n >= 4 ? "Fraco: perdendo contatos todos os dias" : "Crítico: precisa de correção urgente"
}

export function buildReport(f: Facts, psi: Psi | null, a: LlmOut | null, b: LlmOut | null): Report {
  const checks = ruleChecks(f, psi)
  const llmAll: Partial<Record<CriterionId, LlmCriterion>> = { ...(a?.criteria ?? {}), ...(b?.criteria ?? {}) }
  const findings: Finding[] = []
  const strengths: string[] = []
  const criteria: CriterionResult[] = CRITERIA.map(c => {
    const list = checks[c.id]
    const totalW = list.reduce((s, x) => s + x.w, 0) || 1
    const rules = r1(10 * list.reduce((s, x) => s + x.w * num(x.status), 0) / totalW)
    const rawLlm = llmAll[c.id]
    let llm: number | null = null
    if (rawLlm && typeof rawLlm.score === "number" && isFinite(rawLlm.score)) llm = r1(Math.max(rules - 2.5, Math.min(rules + 2.5, Math.max(0, Math.min(10, rawLlm.score)))))
    const wLlm = llm == null ? 0 : c.pillar === "experiencia" ? 0.5 : 0.3
    const score = r1(rules * (1 - wLlm) + (llm ?? 0) * wLlm)
    list.forEach((x, i) => {
      if (x.status === "pass") { if (x.strength) strengths.push(x.strength); return }
      const sev: Severity = x.status === "fail" ? (x.sev ?? "atencao") : x.sev === "critico" ? "atencao" : (x.sev ?? "atencao")
      findings.push({ id: `${c.id}-${i}`, severity: sev, criterion: c.id, title: x.title || x.label, evidence: x.evidence || "", impact: x.impact || "", fix: x.fix || "", source: "regra" })
    })
    return { id: c.id, label: c.label, pillar: c.pillar, weight: c.weight, rules, llm, score, why: rawLlm?.why ? String(rawLlm.why).slice(0, 320) : "", checks: list.map(x => ({ label: x.label, status: x.status })) }
  })
  const sevArr: Severity[] = ["critico", "atencao", "info"]
  for (const o of [a, b]) for (const [i, x] of (o?.findings ?? []).slice(0, 6).entries()) {
    if (!x?.title || !x.fix) continue
    const crit = CRITERIA.find(c => c.id === x.criterion)?.id ?? "clareza"
    findings.push({ id: `ia-${crit}-${i}-${findings.length}`, severity: sevArr.includes(x.severity as Severity) ? (x.severity as Severity) : "atencao", criterion: crit, title: String(x.title).slice(0, 140), evidence: String(x.evidence ?? "").slice(0, 300), impact: String(x.impact ?? "").slice(0, 300), fix: String(x.fix).slice(0, 300), source: "ia" })
  }
  for (const o of [a, b]) for (const s of o?.strengths ?? []) if (typeof s === "string" && s.length < 160) strengths.push(s)
  const rank = { critico: 0, atencao: 1, info: 2 }
  findings.sort((x, y) => rank[x.severity] - rank[y.severity])
  const tw = criteria.reduce((s, c) => s + c.weight, 0)
  const overall = r1(criteria.reduce((s, c) => s + c.weight * c.score, 0) / tw)
  const pillar = (p: "experiencia" | "tecnico") => { const l = criteria.filter(c => c.pillar === p); return r1(l.reduce((s, c) => s + c.weight * c.score, 0) / l.reduce((s, c) => s + c.weight, 0)) }
  const real = findings.filter(x => x.severity !== "info")
  const quickWins = [...new Set([...(b?.quick_wins ?? []).filter(x => typeof x === "string" && x.length < 200), ...real.slice(0, 6).map(x => x.fix)])].slice(0, 6)
  const structural = [...new Set(real.slice(6, 14).map(x => x.fix))].slice(0, 6)
  const limits = [
    "Auditoria automática feita em " + new Date().toLocaleDateString("pt-BR") + " a partir do que é visível ao público; não avalia áreas restritas, painel ou sistemas internos.",
    psi ? "Desempenho e acessibilidade medidos pelo Google PageSpeed Insights (celular), que pode variar entre medições." : "Não foi possível obter a medição do Google PageSpeed neste momento; desempenho avaliado só pelas medidas diretas do servidor.",
    a || b ? "A interpretação qualitativa (clareza, confiança, conteúdo) foi feita por IA com base apenas nos fatos coletados; recomendamos validação humana antes de decisões grandes." : "A análise qualitativa por IA não esteve disponível; as notas se baseiam em verificações objetivas.",
    ...f.warnings,
  ]
  return { url: f.url, host: f.host, generatedAt: new Date().toISOString(), overall, verdict: verdictFor(overall), pillars: { experiencia: pillar("experiencia"), tecnico: pillar("tecnico") }, criteria, findings, strengths: [...new Set(strengths)].slice(0, 10), quickWins, structural, psi, firstImpression: a?.first_impression ? String(a.first_impression).slice(0, 420) : null, aiUsed: !!(a || b), limits, metrics: { ttfbMs: f.ttfbMs, htmlKb: Math.round(f.htmlBytes / 1024), words: f.text.words, images: f.images.total, internalChecked: f.links.checked } }
}

export function chatSummary(r: Report) {
  const top = r.findings.filter(x => x.severity !== "info").slice(0, 3).map(x => "• " + x.title)
  const good = r.strengths.slice(0, 2).map(x => "• " + x)
  return [`Pronto! Auditei ${r.host}: nota geral ${String(r.overall).replace(".", ",")}/10 (${r.verdict}).`, good.length ? "O que já funciona:\n" + good.join("\n") : "", top.length ? "O que mais pesa contra:\n" + top.join("\n") : "", "O relatório completo, com notas por critério e plano de correção, está logo abaixo para baixar."].filter(Boolean).join("\n\n")
}
