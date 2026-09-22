# VireMarca — Especificação de Analytics

## Objetivo

Este documento registra o contrato atual do analytics próprio da VireMarca, incluindo eventos, rótulos exibidos no painel, origens, status histórico e regras de coleta.

A interface administrativa usa um único painel **Desempenho**. A consulta do painel é somente leitura e não filtra por `status`: eventos históricos de produção e laboratório aparecem juntos.

## Regras de dados

- Os eventos são gravados em `site_events`.
- Cada novo evento passa por `src/lib/track-event.ts`.
- O evento só é gravado quando o visitante autorizou analytics pelo consentimento `viremarca-consent-v1`.
- `device_type` é acrescentado automaticamente aos novos eventos: `mobile` ou `desktop`.
- O campo `status` continua existindo como metadado histórico com os valores `production` ou `lab`. Não há atualização, reclassificação ou exclusão das linhas existentes nesta consolidação.
- O painel administrativo lê até 1.000 eventos dentro do período selecionado: hoje, 7 dias ou 30 dias.
- O painel não exibe nomes técnicos crus dos eventos. Ele usa os rótulos definidos neste documento.
- O fallback para um evento sem rótulo é "Evento registrado", sem expor o identificador técnico.

## Eventos atualmente registrados no banco

Inventário da auditoria realizada antes desta consolidação: **21 linhas**, distribuídas entre **9 nomes de evento**.

| Evento técnico (referência interna) | Rótulo no painel | Status observado | Origem / implementação | Contexto principal |
|---|---|---|---|---|
| `contact_started` | Início de contato | production | `MagneticButton.tsx` | CTA de contato |
| `hero_project_click` | Visualização de projeto (via hero) | lab | **Legado, não é mais gerado** | Registros históricos da Hero |
| `portfolio_external_click` | Acesso ao site do projeto | production | `PortfolioShowcase.tsx` | `portfolio_card` |
| `portfolio_view` | Visualização de projeto | production | `Hero.tsx`, `PortfolioShowcase.tsx`, CTA de portfólio | `hero`, `portfolio_card` ou `cta` |
| `process_step_interaction` | Interação com etapa do processo | lab | `Process.tsx` | `process`, etapa e projeto |
| `session_region` | Região da sessão | lab | `track-event.ts`, acionado por `AnalyticsGate` | país, estado/região e cidade |
| `traffic_source_landing` | Origem da visita | lab | `track-event.ts`, acionado por `AnalyticsGate` | UTM e referência |
| `virelab_click` | Clique no VireLab | production | `MagneticButton.tsx` | CTA |
| `whatsapp_click` | Clique no WhatsApp | production | `MagneticButton.tsx` / `Footer.tsx` | CTA ou rodapé |

## Eventos implementados no código, mas sem linha no inventário inicial

Estes eventos existem no código atual e permanecem documentados porque fazem parte do contrato de instrumentação, embora não tivessem registros no banco no momento do inventário:

| Evento técnico (referência interna) | Rótulo no painel | Status usado | Implementação |
|---|---|---|---|
| `contact_cta_context` | Origem do CTA de contato | lab | `TrackedAnchor.tsx` e `MagneticButton.tsx` |
| `email_click` | Clique no e-mail | production | `MagneticButton.tsx` |
| `instagram_click` | Clique no Instagram | production | `MagneticButton.tsx` |
| `deliver_details_open` | Abertura de abordagem | lab | `Delivers.tsx` |

## Regra da Hero e do portfólio

A métrica de visualização de projeto é unificada:

- Clique em projeto pela **Hero**:
  - evento: `portfolio_view`
  - status: `production`
  - `location: "hero"`
  - inclui `project` com o título do projeto.
- Clique no projeto pelo **card do Portfólio**:
  - evento: `portfolio_view`
  - status: `production`
  - `location: "portfolio_card"`
- Acesso ao site externo a partir do card:
  - evento: `portfolio_external_click`
  - status: `production`
  - `location: "portfolio_card"`

`hero_project_click` permanece apenas como histórico. Nenhuma linha antiga é reescrita.

## Contextos exibidos

O painel traduz origens técnicas para linguagem de operação, incluindo:

- `hero` → hero
- `portfolio_card` → card de projeto
- `portfolio_detail` → página do projeto
- `cta` → botão de chamada
- `footer` → rodapé
- `contact_section` → seção de contato
- `process` → processo
- `deliver` → entregas
- `landing` → página de entrada

Quando disponível, o painel também mostra dispositivo, projeto, etapa, UTM, referência externa e região.

## Região aproximada

A região é obtida em `src/app/api/analytics/region/route.ts` a partir dos headers de geolocalização fornecidos pela Vercel:

- país;
- estado/região;
- cidade.

A implementação não lê nem grava o endereço IP. O evento `session_region` registra somente os campos de região que estiverem disponíveis e apenas uma vez por sessão.

## Histórico e compatibilidade

- A consolidação do painel é **read-only** em relação ao histórico.
- Não há migração de dados, UPDATE, DELETE ou reclassificação das linhas antigas.
- `status` permanece no schema e nos registros existentes.
- Eventos antigos podem não possuir `device_type`, porque essa informação passou a ser acrescentada centralmente somente aos novos eventos.
- `hero_project_click` continua traduzido para que registros históricos permaneçam legíveis.

## Arquivos centrais

- `src/app/admin/page.tsx`: painel Desempenho unificado e consulta de todos os status.
- `src/lib/event-labels.ts`: rótulos e tradução de contexto.
- `src/lib/track-event.ts`: gravação central, consentimento e dispositivo.
- `src/components/Hero.tsx`: visualização de projeto via Hero.
- `src/components/PortfolioShowcase.tsx`: visualização e acesso externo via portfólio.
- `src/components/Process.tsx`: interação com etapas.
- `src/components/Delivers.tsx`: abertura de abordagem.
- `src/components/TrackedAnchor.tsx`: contexto de CTAs.
- `src/components/motion/MagneticButton.tsx`: CTAs e canais.
- `src/components/AnalyticsGate.tsx`: inicialização de origem e região após consentimento.
- `src/app/api/analytics/region/route.ts`: leitura da geolocalização aproximada da Vercel.

## Critérios de validação desta consolidação

1. TypeScript sem erros.
2. Lint sem erros.
3. Build de produção concluído.
4. Hero gera `portfolio_view` com `location: "hero"`.
5. Card do portfólio gera `portfolio_view` com `location: "portfolio_card"`.
6. Admin possui apenas o painel **Desempenho** para analytics.
7. Todos os eventos históricos possuem rótulo legível.
8. Nenhum nome técnico cru é exibido ao usuário no painel.
9. Nenhum dado histórico é alterado.
10. Produção é validada depois do deploy, incluindo os eventos efetivamente registrados no banco.


## Eventos das seções comerciais

| Evento técnico | Status | Metadados | Origem |
|---|---|---|---|
| `diagnostic_cta_click` | production | `location: hero \| contact_cta \| nav` | CTA de diagnóstico |
| `diagnostic_request` | production | `location: diagnostic_section` | CTA da seção Diagnóstico |
| `solutions_interest` | production | `location: solutions_section` | CTA da seção Soluções |

Todos seguem a mesma regra de consentimento de analytics já existente em `src/lib/track-event.ts`.
