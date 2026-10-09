# Release Gate — VireMarca

## Escopo
Este contrato vale exclusivamente para srmartinellid-droid/Viremarca-viremarca.
Não alterar outro repositório, projeto Vercel ou projeto Supabase.

## Fonte de verdade
- Código: branch main
- Build: npm run build
- Backend: Supabase do site VireMarca
- Publicação: projeto Vercel viremarca-viremarca
- Identidade do artefato: public/build-info.json

## Gate técnico
1. Mudança parte de branch de trabalho e passa por validação antes de chegar em main.
2. `tsc --noEmit`, lint e `next build` devem passar com as variáveis públicas corretas.
3. Em produção, o build falha se o Supabase estiver indisponível, sem variáveis obrigatórias ou sem projetos públicos ativos.
4. `build-info.json` no artefato bate com o commit esperado.
5. Deployment Vercel usa o commit esperado no ambiente Production.
6. URL pública responde o commit esperado em `/build-info.json`.
7. Funcionalidades-chave e SEO são validados em produção.
8. Nenhuma alteração toca outro projeto/cliente.

### Sequência obrigatória
`revisão do PR → verificações pré-merge → merge em main → deploy Production READY → seo:gate em produção → rollback se falhar`.

**Regra:** build verde não significa release verde. O release só é aprovado após o `seo:gate` passar em produção com o SHA correto.

## Gate SEO

Executar contra a produção:

    npm run seo:gate -- --base https://www.viremarca.com.br --sha <commit>

O gate só é considerado PASS quando todos os critérios verificáveis abaixo passam:

1. GET /build-info.json retorna 200 e commit é exatamente o SHA esperado.
2. GET /robots.txt retorna 200 e contém:
   - Sitemap: https://www.viremarca.com.br/sitemap.xml
   - Disallow: /admin
   - Disallow: /api/
3. GET /sitemap.xml retorna 200, é parseável, não possui duplicatas e todas as URLs pertencem a https://www.viremarca.com.br.
4. Para cada URL do sitemap, sem seguir redirects:
   - status 200;
   - nenhum noindex em meta ou X-Robots-Tag;
   - exatamente um canonical;
   - canonical absoluto e igual à própria URL;
   - exatamente um h1.
5. Consistência com Supabase: projetos portfolio_projects ativos/públicos devem corresponder exatamente às URLs /portfolio/* do sitemap. A consulta usa chave somente-leitura por variável de ambiente. Se as variáveis não estiverem disponíveis, o resultado é explicitamente NÃO VERIFICADO e exige revisão humana antes do release.
6. https://viremarca.com.br/ deve começar com 308 para o domínio canônico e terminar em https://www.viremarca.com.br/ com 200. O mesmo teste é feito para http://viremarca.com.br/.
7. /virelab deve responder 404 (rota removida); /admin e /privacidade devem responder 200 com noindex; nenhum dos três pode aparecer no sitemap.
8. O release só é concluído quando seo:gate passa em produção com o SHA correto.

### Proposta de job pós-deploy (GitHub Actions)
Como o repositório já possui GitHub Actions, o gate final deve ser acionado por `deployment_status` de sucesso em Production. Exemplo de desenho, sem valores de secrets no código:

    on:
      deployment_status:
    jobs:
      seo-production-gate:
        if: github.event.deployment_status.state == 'success' && github.event.deployment_status.environment == 'Production'
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
            with:
              ref: ${{ github.event.deployment.sha }}
          - uses: actions/setup-node@v4
            with:
              node-version: 22
              cache: npm
          - run: npm ci
          - run: npm run seo:gate -- --base https://www.viremarca.com.br --sha "${{ github.event.deployment.sha }}" --strict
            env:
              SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
              SUPABASE_READONLY_KEY: ${{ secrets.SUPABASE_READONLY_KEY }}

Os secrets devem existir somente no repositório/ambiente GitHub e nunca ser impressos nos logs.

## Slugs
Alterações de slug, migração de dados, redirects e normalização de caixa/acento não fazem parte deste gate. Qualquer mudança dessa natureza exige autorização explícita antes de execução.

## CI pós-deploy
Se GitHub Actions for adotado, o job SEO deve rodar pós-deploy, recebendo a URL de produção e o SHA do commit por contexto do workflow. Chaves Supabase devem existir somente como secrets/variables do ambiente do GitHub, nunca no código ou logs.

## Política VireLab
A rota /virelab foi removida e deve responder 404. Ela não deve aparecer no sitemap. Recriá-la exige decisão explícita do Daniel, conteúdo público aprovado e atualização deste gate.

## Rollback
Se o gate falhar em produção, o release não é concluído. Corrigir na branch, repetir validações e promover novamente. Não fazer correção manual diretamente na produção.
