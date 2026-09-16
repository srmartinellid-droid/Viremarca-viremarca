# VireMarca — Site Oficial

Site institucional da **VireMarca**: criação de sites profissionais por segmento.

Stack: **Next.js 15 · TypeScript · Tailwind CSS 4 · Framer Motion · Supabase** (Auth + DB + RLS).

---

## Instalação

```bash
cp .env.example .env.local
# Preencha NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

- Home: http://localhost:3000  
- VireLab: http://localhost:3000/virelab  
- Admin: http://localhost:3000/admin  

---

## Supabase (obrigatório para admin)

Projeto: `https://gwwhnhvcodfedbptteyl.supabase.co`

1. SQL Editor → execute `supabase/schema.sql`
2. Authentication → Users → crie o usuário admin (e-mail + senha)
3. SQL Editor → promova o perfil:

```sql
update public.profiles set role = 'admin' where email = 'SEU_EMAIL@dominio.com';
```

4. Variáveis na Vercel e em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gwwhnhvcodfedbptteyl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do projeto>
```

**Não** coloque `SUPABASE_SERVICE_ROLE_KEY` em variáveis `NEXT_PUBLIC_*` nem no frontend.

---

## Auth e autorização

- Login real via **Supabase Auth** (`/admin/login`)
- Sessão em cookies (SSR + middleware)
- Rotas `/admin/*` protegidas no middleware
- Papel em `profiles.role` (`admin` | `editor` | `user`)
- RLS: leitura pública de projetos ativos; escrita só para admin/editor

---

## CRUD admin

- Listar / criar / editar / publicar / despublicar / excluir projetos
- Server Actions em `src/app/actions/portfolio.ts`
- Fallback de conteúdo demo na home se o banco estiver vazio

---

## Deploy (Vercel)

Projeto: `viremarca-viremarca`

1. Framework: Next.js  
2. Env: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
3. Deploy após push em `main`  
4. Validar: home, `/portfolio/[slug]`, login, CRUD  

---

© VireMarca
