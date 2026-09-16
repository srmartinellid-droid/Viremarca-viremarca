# VireMarca — Site Oficial

Site institucional da **VireMarca**: criação de sites profissionais por segmento.

Stack: **Next.js 15 · TypeScript · Tailwind CSS 4 · Framer Motion · Supabase** (Auth + DB + Storage).

Logo oficial em `public/logo-wordmark.png` e `public/logo-vm.png`.

---

## Instalação rápida

```bash
cd viremarca-oficial
cp .env.example .env.local
npm install
npm run dev
```

Abra http://localhost:3000

### Admin (demo local)

http://localhost:3000/admin  

- E-mail: `admin@viremarca.com.br`  
- Senha: `viremarca2026`

> Em produção, substitua a autenticação demo por **Supabase Auth**.

### VireLab

http://localhost:3000/virelab  

Laboratório visual interativo para definir direção estética (atmosfera, motion, cards, tipografia, interações) e gerar briefing estruturado.

---

## Configurar Supabase (produção)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No SQL Editor, execute o conteúdo de `supabase/schema.sql`.
3. Em Storage, crie o bucket público `portfolio`.
4. Em Authentication → Users, crie o primeiro administrador.
5. Copie URL e anon key para `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

6. Redeploy na Vercel com as mesmas variáveis.

---

## Estrutura

```
src/
  app/              # páginas (home, portfolio/[slug], admin, privacidade, virelab)
  components/
    motion/         # MagneticButton, Reveal, Spotlight
    Header, Hero, PortfolioShowcase, Process, About, Delivers, ContactCTA, Footer
  hooks/            # useMagnetic, useReducedMotion
  lib/              # utils, demo-data, virelab-config, supabase clients
  types/
public/
  logo-wordmark.png
  logo-vm.png
  portfolio/        # thumbnails
supabase/
  schema.sql
```

---

## Identidade visual

- Fundo: off-white `#FAFAF9`
- Superfície: branco
- Texto: grafite `#1A1A1A`
- Acento: coral do logo `#E07A5F`
- Tipografia: Inter (roles: display, body, eyebrow, mono)

**Não redesenhar o logo.** Usar apenas os arquivos oficiais em `public/`.

### Design & Motion System

- Tokens de cor, tipografia, radius e motion em `globals.css`
- Easing padronizado (`--ease-standard`, `--ease-emphasized`)
- Durações: fast / base / slow / reveal
- `prefers-reduced-motion` respeitado em todos os efeitos
- Componentes de interação: MagneticButton, Spotlight, Reveal

---

## Deploy (Vercel)

1. Conecte o repositório.
2. Framework: Next.js.
3. Adicione as env vars do Supabase.
4. Deploy.

---

## Próximos passos recomendados

- [ ] Ligar o painel admin ao Supabase (substituir estado local).
- [ ] Upload de thumbnails via Supabase Storage.
- [ ] Autenticação real (remover credenciais demo).
- [ ] Seed dos projetos reais no banco.
- [ ] Persistência de preferências VireLab (Supabase).
- [ ] Domínio próprio + analytics.

---

© VireMarca
