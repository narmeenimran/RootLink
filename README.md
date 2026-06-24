# RootLink

A card-based family hierarchy platform. Build multi-generational family structures through expandable **Family Cards** — not traditional trees. Navigate generations by opening cards like folders: Ahmed Khan → Ali Khan → Hamza Khan → …

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Shadcn-style UI |
| State | Zustand, TanStack React Query |
| Routing | React Router v7 |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase PostgreSQL |
| Auth | Supabase Authentication |
| Storage | Supabase Storage |

## Project Structure

```
RootLink/
├── client/                 # React frontend
│   └── src/
│       ├── components/       # UI, layout, family cards
│       ├── pages/            # Route pages
│       ├── hooks/            # useAuth, etc.
│       ├── services/         # Supabase CRUD
│       ├── store/            # Zustand (theme, nav, search)
│       ├── lib/              # Supabase client
│       ├── types/            # TypeScript interfaces
│       ├── utils/            # Helpers
│       └── routes/           # Protected route guards
├── server/                 # Express API
│   └── src/
│       ├── routes/           # health, stats
│       └── index.ts
└── supabase/
    ├── schema.sql            # Full database schema + RLS
    └── storage-setup.md      # Bucket policies
```

## Quick Start

### 1. Clone & install

```bash
cd RootLink
npm install
```

This installs root, client, and server workspaces.

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy **Project URL** and **anon key** from Settings → API
3. Copy **service_role key** (server only — never expose in frontend)

### 3. Run database schema

In Supabase Dashboard → **SQL Editor**, paste and run:

```
supabase/schema.sql
```

### 4. Configure storage

Follow `supabase/storage-setup.md` to create buckets and policies.

### 5. Configure auth redirects

In Supabase → Authentication → URL Configuration:

| Setting | Value |
|---------|-------|
| Site URL | `http://localhost:5173` |
| Redirect URLs | `http://localhost:5173/auth/callback`, `http://localhost:5173/auth/reset-password` |

Enable **Email confirmations** under Auth → Providers → Email.

### 6. Environment variables

```bash
# client/.env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# server/.env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 7. Run development servers

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

## Features

### Family Cards (core)
- Create **Family Head** cards (root ancestor)
- Add spouse, sons, daughters
- Male children → **Open Family Card** opens a new branch
- Female children → full profiles + optional link to married family
- Breadcrumb navigation: Home > Ahmed Khan > Ali Khan

### Dashboard
- Total members, family heads, generations
- Living / deceased counts, male / female breakdown
- Average age, largest branch
- Recently added members, upcoming birthdays

### Profiles
- Full name, preferred name, gender, DOB/DOD
- Education, occupation, biography, notes
- Contact details, photo gallery

### Search
- Global search (⌘K) by name, occupation, generation
- Opens correct family card or profile

### Events
- Births, marriages, deaths, graduations, reunions, anniversaries, custom

### Documents & Memories
- Upload certificates, PDFs, images, videos via Supabase Storage
- Record family stories and personal memories

### Auth
- Sign up, login, logout
- Email verification, password reset
- Protected routes, row-level security on all data

## Deployment

### Frontend (Vercel / Netlify)

```bash
cd client
npm run build
```

Set env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### Backend (Railway / Render / Fly.io)

```bash
cd server
npm run build
npm start
```

Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CLIENT_URL`.

### Supabase production

Update auth redirect URLs to your production domain.

## Design

Minimalist cozy palette:
- **Light**: warm off-white `#FAF9F7`, sage green `#8B9A7D`, soft brown text
- **Dark**: warm charcoal `#1C1917`, muted sage accents

Toggle via the moon/sun icon in the header.

## License

MIT
