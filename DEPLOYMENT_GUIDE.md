# DRIS — Step-by-Step Deployment Guide

**For beginners with no prior deployment experience.**
Follow every step in order. Each step says exactly what to click or type.

---

## What you will end up with

- A live website at `https://your-domain.com`
- A real Postgres database on Neon (free tier available)
- Automatic HTTPS certificate (free, managed by Vercel)
- Every change you push to GitHub deploys automatically

**Time needed:** approximately 45–60 minutes.

---

## What you need before starting

- A computer with a web browser
- An email address
- A credit or debit card (for buying the domain — the rest is free)

---

## STEP 1 — Download the project

1. Find the project zip file you received (`dris.zip`).
2. Double-click it to extract. You will get a folder called `dris`.
3. Move the `dris` folder to a place you can find it, for example your Desktop.

---

## STEP 2 — Install Node.js (if you do not have it)

1. Go to **https://nodejs.org**
2. Click the button labelled **LTS** (the left, green button).
3. Download and run the installer. Accept all defaults.
4. When it finishes, open a Terminal (Mac) or Command Prompt (Windows).
5. Type `node --version` and press Enter. You should see something like `v20.x.x`.

---

## STEP 3 — Create a free GitHub account

GitHub stores your code and connects to Vercel for deployment.

1. Go to **https://github.com**
2. Click **Sign up** (top right).
3. Enter your email, create a password, and choose a username.
4. Verify your email address when GitHub sends you a confirmation email.

---

## STEP 4 — Install Git (if you do not have it)

1. Go to **https://git-scm.com/downloads**
2. Download and install Git for your operating system. Accept all defaults.

---

## STEP 5 — Upload the project to GitHub

Open a Terminal (Mac) or Command Prompt (Windows):

```bash
# Navigate to the project folder (adjust the path to match where you saved it)
cd ~/Desktop/dris          # Mac
# or
cd C:\Users\YourName\Desktop\dris   # Windows

# Install dependencies (this takes 1–2 minutes)
npm install

# Set up Git and push to GitHub
git init
git add .
git commit -m "Initial commit"
```

Now create a repository on GitHub:
1. Go to **https://github.com/new**
2. Name it `dris` (or anything you like).
3. Leave it set to **Private**.
4. Click **Create repository**.
5. GitHub shows you a page with commands. Copy the two lines that look like:
   ```
   git remote add origin https://github.com/YOUR-USERNAME/dris.git
   git branch -M main
   ```
6. Paste them into your Terminal and press Enter after each.
7. Then run:
   ```bash
   git push -u origin main
   ```
8. GitHub will ask for your username and password. For the password, you need a **Personal Access Token** — see https://github.com/settings/tokens, click **Generate new token (classic)**, tick the `repo` checkbox, and copy the token. Use that as your password.

Your code is now on GitHub. ✓

---

## STEP 6 — Create a free Neon database

Neon hosts your Postgres database.

1. Go to **https://neon.tech**
2. Click **Sign up** — you can sign up with your GitHub account.
3. Click **New project**.
4. Give it a name, for example `dris-db`.
5. Choose the region closest to your users (for Saudi Arabia, choose `AWS – eu-west-1` or `AWS – me-south-1` if available).
6. Click **Create project**.
7. On the next page, click **Connection details** (top of the page).
8. Make sure **Pooled connection** is selected.
9. Copy the full connection string. It looks like:
   ```
   postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require
   ```
   **Save this — you will need it in the next step.**

---

## STEP 7 — Create a free Vercel account

Vercel runs your frontend and backend API.

1. Go to **https://vercel.com**
2. Click **Sign Up**.
3. Choose **Continue with GitHub**. Authorise Vercel to access your GitHub account.
4. When asked to choose a plan, select **Hobby** (free).

---

## STEP 8 — Deploy to Vercel

1. From the Vercel dashboard, click **Add New → Project**.
2. You will see a list of your GitHub repositories. Find `dris` and click **Import**.
3. Vercel detects the settings automatically. Do **not** change anything yet.
4. Before clicking Deploy, scroll down to **Environment Variables** and add these three:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | The Neon connection string you copied in Step 6 |
   | `JWT_SECRET` | A long random string — generate one at https://1password.com/password-generator/ (set to 48+ characters, no symbols) |
   | `SEED_PASSWORD` | `dris2026` (you can change this later) |

5. Click **Deploy**.
6. Vercel builds and deploys your project. This takes about 2 minutes.
7. When it says **Congratulations**, click **Visit** to see your live site.

Your app is now live at a Vercel URL like `https://dris-abc123.vercel.app`. ✓

---

## STEP 9 — Set up the database tables

The database exists but has no tables yet. You need to run the migration once.

In your Terminal (inside the `dris` folder):

```bash
# Create a .env file with your real database URL
echo 'DATABASE_URL="your-neon-connection-string-here"' > .env
echo 'JWT_SECRET="your-jwt-secret-here"' >> .env

# Create the tables
npm run db:migrate

# Load demo data and staff accounts
npm run db:seed
```

Replace `your-neon-connection-string-here` with the string you copied from Neon, and `your-jwt-secret-here` with the same value you used in Vercel.

You should see:
```
✓ Migration complete. All tables are ready.
✓ Seed complete.
```

---

## STEP 10 — Buy a .com domain

1. Go to **https://www.namecheap.com** (or any registrar — GoDaddy, Google Domains, etc.).
2. Search for the domain name you want, for example `dris.health` or `ngha-radiology.com`.
3. Click **Add to cart** and complete the purchase with your card.
4. The domain is now yours.

---

## STEP 11 — Connect the domain to Vercel

1. In the Vercel dashboard, open your `dris` project.
2. Click **Settings** (top tab) → **Domains** (left menu).
3. Type your domain name (for example `dris.health`) and click **Add**.
4. Vercel will show you DNS records to set. You will need two values:
   - **Type A** record pointing to Vercel's IP, **or**
   - **CNAME** record pointing to `cname.vercel-dns.com`

5. Log in to your domain registrar (Namecheap, GoDaddy, etc.).
6. Find **DNS Settings** or **Manage DNS** for your domain.
7. Add the records exactly as Vercel shows them.
8. Click **Save** or **Confirm** in your registrar.
9. Go back to Vercel and click **Refresh**. It may take 5–30 minutes for DNS to propagate.
10. When Vercel shows a green tick next to your domain, it is live.

Your site is now available at `https://your-domain.com` with automatic HTTPS. ✓

---

## STEP 12 — Verify everything works

Open your domain in a browser and test each of these:

### Login
- [ ] Go to `https://your-domain.com`
- [ ] Sign in as `omar.harbi` with password `dris2026`
- [ ] You should see the Dashboard with equipment cards

### NFC session
- [ ] Click **Portable X-Ray** in the sidebar
- [ ] Find a machine with status **Available** and click **Start**
- [ ] The NFC dialog should appear with a 60-second countdown
- [ ] Click **Activate session** — the machine status should change to **In Use**
- [ ] The session capsule appears in the top bar with a live timer
- [ ] Click **End** to close the session

### Daily inspection
- [ ] Click **Daily Inspection** in the sidebar
- [ ] Click **Start inspection** on any asset
- [ ] Answer all three questions
- [ ] Click **Submit inspection**
- [ ] The asset moves to the **Completed** tab

### Supervisor can see Technologist reports (Part 2 fix)
- [ ] Sign out and sign in as `hadeel.qahtani` (Supervisor, password `dris2026`)
- [ ] Click **Daily Inspection** → **Completed** tab
- [ ] You should see inspections submitted by **Omar Al-Harbi** and **Nadiyah Al-Otaibi**
- [ ] The blue banner at the top confirms "you can see reports from every technologist"

### Maintenance ticket
- [ ] As a Supervisor, click **Maintenance** in the sidebar
- [ ] Click **New ticket**
- [ ] Fill in the form and click **Submit ticket**
- [ ] The ticket appears in the list

### Reports
- [ ] Sign in as `khalid.enezi` (Manager)
- [ ] Click **Reports** — you should see charts and the maintenance history table

---

## Common problems

### "Cannot connect to database"
- Double-check the `DATABASE_URL` in Vercel matches the Neon pooled connection string exactly.
- Make sure the Neon project is not paused (free tier pauses after inactivity — click **Resume** in the Neon dashboard).

### "Invalid token" or "Not authenticated"
- Check that `JWT_SECRET` in Vercel is set and not empty.
- Clear your browser's local storage: open DevTools → Application → Local Storage → clear `dris_token`.

### "Domain not connecting"
- DNS changes can take up to 48 hours worldwide, though usually under 30 minutes.
- Use https://dnschecker.org to see if your DNS has propagated.

### Forgot seed password
- Re-run `npm run db:seed` (this resets demo data and re-hashes passwords).
- Or set `SEED_PASSWORD` in your `.env` first, then re-seed.

---

## How to update the site after making changes

Every time you push code to GitHub, Vercel re-deploys automatically:

```bash
git add .
git commit -m "Describe your change"
git push
```

Vercel will show the new deployment in the dashboard within 2 minutes.

---

## Changing the default password

The seed password `dris2026` is for demonstration only.

1. Set a new `SEED_PASSWORD` environment variable in the Vercel dashboard.
2. Run `npm run db:seed` again locally (pointing at the production `DATABASE_URL`).
3. Immediately tell all staff their new password.
4. For a real deployment, implement a password-reset flow in the application.

---

## Need help?

- Vercel documentation: https://vercel.com/docs
- Neon documentation: https://neon.tech/docs
- GitHub documentation: https://docs.github.com
