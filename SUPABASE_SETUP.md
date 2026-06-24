# RootLink — Supabase Setup (Step by Step)

Follow every step in order. This takes about **15–20 minutes**.

---

## Step 1: Create a Supabase account & project

1. Go to **[https://supabase.com](https://supabase.com)** and sign up (free tier is fine).
2. Click **New project**.
3. Fill in:
   - **Name:** `RootLink` (or anything you like)
   - **Database password:** choose a strong password — **save it somewhere safe**
   - **Region:** pick the closest to you
4. Click **Create new project** and wait ~2 minutes until the dashboard loads.

---

## Step 2: Copy your API keys

1. In the left sidebar, click **Project Settings** (gear icon at bottom).
2. Click **API** in the settings menu.
3. Copy these three values — you'll need them soon:

| What to copy | Where it is | Used in |
|---|---|---|
| **Project URL** | Project URL field | `client/.env` and `server/.env` |
| **anon public** key | Project API keys → `anon` `public` | `client/.env` only |
| **service_role** key | Project API keys → `service_role` `secret` | `server/.env` only — **never put this in the frontend** |

---

## Step 3: Create the database tables

1. In the left sidebar, click **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase/full-setup.sql` from this project in a text editor.
4. **Copy the entire file** and paste it into the Supabase SQL Editor.
5. Click **Run** (or press Ctrl+Enter).
6. You should see **Success. No rows returned** — that means it worked.

> If you get errors about objects already existing, that's OK — it means you ran it before.

---

## Step 4: Create storage buckets

Still in Supabase dashboard:

1. Click **Storage** in the left sidebar.
2. Click **New bucket** and create each of these:

| Bucket name | Public bucket? |
|---|---|
| `profile-images` | ✅ Yes (toggle ON) |
| `gallery` | ✅ Yes |
| `memories` | ✅ Yes |
| `events` | ✅ Yes |
| `documents` | ❌ No (keep private) |

3. After creating all 5 buckets, go back to **SQL Editor**.
4. Open `supabase/storage-policies.sql`, copy all of it, paste into a new query, and **Run**.

---

## Step 5: Configure Authentication

1. Click **Authentication** → **Providers** in the sidebar.
2. Make sure **Email** is enabled (it is by default).

### For development (easier login — recommended to start):

1. Go to **Authentication** → **Providers** → **Email**.
2. **Turn OFF** "Confirm email" (disable email confirmation).
3. Click **Save**.

This lets you sign up and log in immediately without checking email.

### Configure redirect URLs:

1. Go to **Authentication** → **URL Configuration**.
2. Set **Site URL** to:
   ```
   http://localhost:5173
   ```
3. Under **Redirect URLs**, add these (click Add URL for each):
   ```
   http://localhost:5173/auth/callback
   http://localhost:5173/auth/reset-password
   ```
4. Click **Save**.

---

## Step 6: Create your `.env` files

### Client env file

Create a file at `client/.env` (inside the `client` folder):

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
```

Replace with your actual values from Step 2.

### Server env file (optional for now)

Create `server/.env`:

```env
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key-here
PORT=3001
CLIENT_URL=http://localhost:5173
```

---

## Step 7: Install & run the app

Open a terminal in the RootLink folder:

```powershell
cd C:\Users\nayya\Projects\RootLink
npm install
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:5173** (proxied) / **http://localhost:3001**

> **Important:** After creating or changing `client/.env`, you **must restart** the dev server (Ctrl+C, then `npm run dev` again). Vite only reads env vars on startup.

---

## Step 8: Sign up and test

1. Open **http://localhost:5173**
2. Click **Sign up**
3. Enter your name, email, and password (min 8 characters)
4. If email confirmation is **OFF** → you're logged in immediately
5. If email confirmation is **ON** → check your email, click the link, then sign in
6. Go to **Families** → **New Family Head** → create Ahmed Khan
7. Add spouse, sons, daughters
8. Click **Open Family Card** on a son to open the next generation

---

## Troubleshooting login

### "Supabase is not configured"
→ You haven't created `client/.env` or didn't restart the dev server after creating it.

### "Wrong email or password"
→ Double-check credentials. If you just signed up with email confirmation ON, verify your email first.

### "Please verify your email first"
→ Check inbox/spam for Supabase email. Or disable "Confirm email" in Supabase (Step 5) and sign up again with a new email.

### "Cannot reach Supabase" / network error
→ Check `VITE_SUPABASE_URL` — it should look like `https://abcdefgh.supabase.co` with no trailing slash.

### "Invalid Supabase anon key"
→ Copy the **anon public** key again from Supabase → Settings → API. Not the service_role key.

### Sign up works but login does nothing
→ Restart dev server. Make sure redirect URLs are set (Step 5).

### "relation family_members does not exist"
→ Run `supabase/full-setup.sql` in SQL Editor (Step 3).

---

## Production deployment

When deploying to Vercel/Netlify:

1. Set the same `VITE_SUPABASE_*` env vars in your hosting dashboard.
2. In Supabase URL Configuration, add your production URL:
   ```
   https://yourdomain.com
   https://yourdomain.com/auth/callback
   https://yourdomain.com/auth/reset-password
   ```

---

## Quick checklist

- [ ] Supabase project created
- [ ] `full-setup.sql` run successfully
- [ ] 5 storage buckets created
- [ ] `storage-policies.sql` run successfully
- [ ] Email confirmation disabled (for dev) OR email verified
- [ ] Redirect URLs configured
- [ ] `client/.env` created with real URL + anon key
- [ ] Dev server restarted after creating `.env`
- [ ] Signed up and logged in successfully
