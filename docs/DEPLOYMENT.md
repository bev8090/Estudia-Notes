# Deploying Estudia Notes

This guide puts the app online using free tiers:

| Piece | Host | Notes |
|---|---|---|
| Frontend (`client/`) | **Vercel** | Made by the creators of Next.js; deploys automatically on every push |
| API (`server/`) | **Render** | Runs the Express server as a long-lived process, which the background AI jobs need |
| Database, login | **Supabase** | Already set up; nothing to deploy, only settings to update |
| AI | **Claude API** | Same API key, set on Render |

Why the API isn't on Vercel too: Vercel runs code as short-lived serverless functions, but this API starts AI jobs that keep running after the response is sent (10–60 seconds). A normal server process on Render handles that.

**Order matters**, because each piece needs the address of the other:

1. Deploy the API on Render → get its URL
2. Deploy the frontend on Vercel, pointing it at the API URL → get the site URL
3. Tell the API the site URL (for CORS)
4. Tell Supabase and Google the site URL (for login redirects)

---

## Step 0. Push the latest code

Render and Vercel both deploy from GitHub, so push first:

```
git push
```

---

## Step 1. Deploy the API on Render

1. Sign up at **render.com** using your GitHub account.
2. Click **New → Web Service**, then pick the `estudia-notes` repository.
3. Fill in the settings:

   | Setting | Value |
   |---|---|
   | Name | `estudia-notes-api` (this becomes part of the URL) |
   | Region | **Oregon (US West)**: closest to your Supabase database (AWS us-west-2) |
   | Branch | `main` |
   | Root Directory | `server` |
   | Runtime | Node |
   | Build Command | `npm ci --include=dev && npx prisma migrate deploy` |
   | Start Command | `npm start` |
   | Instance Type | Free |

   The build command installs packages (which also generates the Prisma client), then applies any new database migrations. `--include=dev` is needed because the Prisma CLI is a dev dependency.

4. Under **Environment Variables**, add these. Copy the values from your local `server/.env`:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | the pooled Supabase URL (port 6543) |
   | `DIRECT_URL` | the direct/session Supabase URL (port 5432) |
   | `SUPABASE_URL` | `https://<your-project>.supabase.co` |
   | `SUPABASE_PUBLISHABLE_KEY` | your publishable key |
   | `ANTHROPIC_API_KEY` | your Claude API key |
   | `CLIENT_URL` | `http://localhost:3000` for now; you'll update it in Step 3 |

   Don't set `PORT`; Render sets it automatically.

5. Open **Advanced** and set **Health Check Path** to `/health`.
6. Click **Create Web Service** and wait for the status to say **Live** (the first build takes a few minutes).
7. Copy your API URL from the top of the page, e.g. `https://estudia-notes-api.onrender.com`.
8. Check it: open `https://estudia-notes-api.onrender.com/health` in your browser. You should see `{"ok":true,"db":"up"}`.

> **Free-tier behavior:** a free Render service goes to sleep after 15 minutes without traffic. The next request wakes it, which takes about a minute, so the first page load after a quiet period is slow. Upgrading the instance to **Starter** keeps it always on.

---

## Step 2. Deploy the frontend on Vercel

1. Sign up at **vercel.com** using your GitHub account.
2. Click **Add New → Project** and import the `estudia-notes` repository.
3. Set **Root Directory** to `client` (click *Edit* next to it). Vercel detects Next.js automatically.
4. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | same as in `client/.env.local` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same as in `client/.env.local` |
   | `NEXT_PUBLIC_API_URL` | your Render URL from Step 1, **no trailing slash** |

5. Click **Deploy**. When it finishes, copy your site URL, e.g. `https://estudia-notes.vercel.app`.

> `NEXT_PUBLIC_` variables are baked into the site when it's built. If you ever change one, redeploy (Deployments → ⋯ → Redeploy) for it to take effect.

---

## Step 3. Let the site call the API (CORS)

Browsers block a site from calling an API on another domain unless the API allows it.

1. In Render, open your service → **Environment**.
2. Change `CLIENT_URL` to your Vercel URL, plus localhost so local development keeps working:

   ```
   https://estudia-notes.vercel.app,http://localhost:3000
   ```

   Use your exact Vercel URL: `https://`, no trailing slash.
3. Save. Render redeploys automatically.

---

## Step 4. Update Supabase login settings

In the Supabase dashboard → **Authentication → URL Configuration**:

1. **Site URL**: change to your Vercel URL (`https://estudia-notes.vercel.app`).
2. **Redirect URLs**: add `https://estudia-notes.vercel.app/auth/callback`. Keep `http://localhost:3000/auth/callback` for local development.

Without this, Google sign-in and email confirmation links would send people back to `localhost`.

---

## Step 5. Update Google sign-in

In Google Cloud Console → **APIs & Services → Credentials** → your OAuth client:

1. Under **Authorized JavaScript origins**, add your Vercel URL.
2. Leave **Authorized redirect URIs** as is (it's the Supabase callback, which doesn't change).

Then fill in the consent screen's **Branding** (in Google Auth Platform → Branding, or the older APIs & Services → OAuth consent screen). Google asks for these before it lets you publish:

| Field | Value |
|---|---|
| App name | `Estudia Notes` |
| User support email | your contact email |
| App logo | **leave empty for now**: uploading a logo triggers a Google brand-verification review that can take days |
| Application home page | `https://estudia-notes.vercel.app` |
| Application privacy policy link | `https://estudia-notes.vercel.app/privacy` |
| Application terms of service link | `https://estudia-notes.vercel.app/terms` |
| Authorized domains | `estudia-notes.vercel.app` (your exact Vercel subdomain) |
| Developer contact email | your contact email |

Use your real Vercel URL everywhere. The privacy and terms pages must be live (Step 2) before you save, because Google checks the links. If Google asks you to prove you own the domain, do it in Google Search Console with the same Google account.

Finally, under **Audience** (or the consent screen's publishing status): if it says **Testing**, only the test users you listed can sign in with Google. Click **Publish app** so anyone can. For the basic scopes this app uses (email and profile), and without a logo, Google doesn't require a verification review.

---

## Step 6. Test the live site

Go through the whole flow on your Vercel URL:

- [ ] The landing page loads
- [ ] Create an account with email, and click the confirmation email link
- [ ] Sign out, then sign in with Google
- [ ] Add pasted notes → the study guide appears
- [ ] Upload a PDF or a PowerPoint
- [ ] Generate an exam, answer it including a short answer, and see your results
- [ ] The Progress page shows your score

In Render → **Logs**, you can watch each AI call with its token counts and cost (lines starting with `[ai]`).

---

## Before sharing it widely

- **Email sending limits.** Supabase's built-in email sender has a very low hourly limit and is meant for testing. For real users, connect your own email provider (for example Resend or SendGrid) under **Authentication → Emails → SMTP Settings**.
- **AI budget.** Set a monthly spend limit in the Claude Console (Settings → Billing). Each user is also limited to 30 notes and exams per day (`DAILY_AI_LIMIT` on Render).
- **Free-tier limits.** Supabase pauses free projects after about a week with no activity (you can resume them from the dashboard). Vercel's free Hobby plan is for personal, non-commercial projects.
- **Custom domain (optional).** Add one in Vercel → Settings → Domains, then repeat Steps 3–5 with the new address.

---

## Updating the app later

Push to `main` and both sites redeploy on their own. If the push includes a new Prisma migration, Render applies it during the build (`prisma migrate deploy`).

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| Browser console shows a **CORS error** | `CLIENT_URL` on Render doesn't exactly match the site's address (check `https`, spelling, no trailing slash) |
| Pages load, but every action fails | `NEXT_PUBLIC_API_URL` on Vercel is wrong or has a trailing slash, then redeploy; or the Render service is still waking up |
| After login you land on `localhost` | Supabase Site URL / Redirect URLs not updated (Step 4) |
| Google sign-in says access is blocked | Vercel URL missing from Authorized JavaScript origins, or the consent screen is still in Testing (Step 5) |
| Render build fails at `prisma migrate deploy` | `DIRECT_URL` missing or wrong on Render |
| Render logs show `Invalid environment variables` | A required variable is missing or malformed; the log line names it |
| The first request after a while takes ~1 minute | The free Render instance was asleep (see Step 1) |
