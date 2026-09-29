export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "VireMarca",
    url: "https://www.viremarca.com.br",
    image: "https://www.viremarca.com.br/og-image.png",
    description:
      "A VireMarca constrói sites profissionais, pensados para cada negócio, unindo design estratégico, tecnologia e estrutura sob medida.",
    address: { "@type": "PostalAddress", addressLocality: "Florianópolis", addressRegion: "SC", addressCountry: "BR" },
    areaServed: { "@type": "City", name: "Florianópolis" },
    email: "viremarca@gmail.com",
    telephone: "+5548991410717",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
