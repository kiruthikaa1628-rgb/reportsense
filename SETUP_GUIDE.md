# ReportSense – Step-by-step setup guide (all free)

You will set up four things: **Supabase** (login + database), **Google Gemini** (AI), **GitHub** (code storage) and **Vercel** (hosting). Total time: about 30 minutes. No credit card is needed for the free plans, but check each service's current free limits before launch.

---

## Step 1 – Create the Supabase project (login + database)

1. Go to https://supabase.com and sign up (GitHub or email).
2. Click **New project**. Choose a name (for example `reportsense`), set a **database password** and save it somewhere safe, pick the region closest to your users (for India, Mumbai or Singapore), and click **Create**. Wait 1–2 minutes.
3. Open **Project Settings → API**. Copy two values:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public key** → this is `VITE_SUPABASE_ANON_KEY`
4. Click the **Connect** button at the top of the dashboard, open the **Transaction pooler** tab and copy the connection string. It looks like:
   `postgresql://postgres.abcdxyz:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`
   Replace `[YOUR-PASSWORD]` with your database password (from step 2). This is `SUPABASE_DB_URL`.
   *Use the pooler string, not the "Direct connection" one: Vercel cannot reach the direct one on the free plan.*
5. You do **not** need to create any tables. The backend creates them automatically (see Step 6).

## Step 2 – Allow sign-in links to open your site

1. In Supabase, open **Authentication → URL Configuration**.
2. For now set **Site URL** to `http://localhost:3000`.
3. After you deploy (Step 5) come back, change **Site URL** to your Vercel address (for example `https://reportsense.vercel.app`) and add the same address under **Redirect URLs**.

Email sign-in is on by default. Supabase's built-in email sender has a small hourly limit, which is fine for testing. For real users, add your own SMTP provider later under **Authentication → Emails**.

### (Optional) Enable Mobile Number (SMS) sign-in
1. In Supabase, open **Authentication → Providers → Phone**.
2. Toggle **Enable Phone Provider** ON.
3. Choose your SMS provider (Twilio, MessageBird, Vonage, etc.) and enter your credentials.
4. **For free testing without SMS credits:** Scroll to **Phone Numbers for Testing**, add test numbers (for example: `+919999999999` with OTP `123456`). You can use these immediately to test mobile login with zero SMS fees.

## Step 3 – Get a free Gemini API key

1. Go to https://aistudio.google.com/app/apikey and sign in with a Google account.
2. Click **Create API key**, copy it. This is `GEMINI_API_KEY`. Keep it secret.
3. The free tier has daily and per-minute request limits that Google changes from time to time. Check the current numbers in AI Studio.
4. Privacy note: on the free tier, Google may use submitted content to improve its products. The app shows users a consent message before their first upload. Do not market this as private medical storage.

## Step 4 – Put the code on GitHub

1. Unzip the project.
2. Create a free account at https://github.com and click **New repository** (name: `reportsense`, private is fine).
3. Upload the project files (drag and drop works in the GitHub web page: **Add file → Upload files**). Do **not** upload a `.env` file or `node_modules`.

## Step 5 – Deploy on Vercel

1. Go to https://vercel.com and sign up with GitHub.
2. Click **Add New → Project**, pick your `reportsense` repository, and click **Import**.
3. Framework preset should show **Vite**. Leave build settings as they are.
4. Open **Environment Variables** and add these four (exact names):

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Project URL from Step 1.3 |
| `VITE_SUPABASE_ANON_KEY` | anon public key from Step 1.3 |
| `SUPABASE_DB_URL` | Transaction pooler string from Step 1.4 (with your real password) |
| `GEMINI_API_KEY` | Key from Step 3 |

5. Click **Deploy**. When it finishes you get a web address like `https://reportsense.vercel.app`.
6. Go back to Supabase **Authentication → URL Configuration** and set the Site URL and Redirect URL to this address (Step 2.3).

## Step 6 – Create the tables automatically

Open `https://YOUR-SITE.vercel.app/api/setup` in your browser once. You should see:

```json
{"ok":true,"message":"Database is ready. Tables exist."}
```

That call created the `reports` table, its index and its security rules. Even if you skip this step, the tables are created automatically the first time anyone opens History or analyses a report. You can check in Supabase under **Table Editor → reports**.

If you see an error, read the message: it is almost always a wrong password or the wrong connection string (see Troubleshooting).

## Step 7 – Try it

1. Open your site on your phone.
2. Enter your email, tap the link in the email.
3. Choose a language, take a photo of a (sample) blood report, tap **Explain my report**.
4. Open the **History** tab to see it saved.

---

## Running on your own computer (optional)

You need Node.js 18 or newer from https://nodejs.org.

```bash
cd reportsense
npm install
cp .env.example .env      # then fill in the values
npx vercel dev            # runs the website AND the /api backend on http://localhost:3000
```

The first time, `vercel dev` asks you to log in and link the project. Plain `npm run dev` only runs the frontend, so analysing a report will not work with it.

To create the tables from your computer instead: `npm run db:setup`.

---

## Troubleshooting

| Problem | What to do |
|---|---|
| "The app is not connected to Supabase yet" | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` missing. Add them in Vercel, then **Redeploy** (Vite reads them at build time). |
| `/api/setup` says "password authentication failed" | The password in `SUPABASE_DB_URL` is wrong. Reset it in Supabase **Project Settings → Database**, update the variable, redeploy. |
| `/api/setup` says "ENOTFOUND" or "timeout" | You used the Direct connection string. Use the **Transaction pooler** one. |
| Sign-in email never arrives | Check Spam. Wait an hour if you requested several (free email limit). Make sure Redirect URL matches your site. |
| Link opens but you are not signed in | Site URL / Redirect URL in Supabase does not match your Vercel address exactly. |
| "The free AI limit has been reached" | You hit Gemini's free quota. Wait, or check limits in AI Studio. |
| "The AI service could not read this report" | Check `GEMINI_API_KEY`. If Google renamed the model, set `GEMINI_MODEL` in Vercel (list of models is in AI Studio docs). |
| Site stops working after a quiet week | Supabase free projects pause after about a week of inactivity. Open the Supabase dashboard and click **Restore**. |

---

## Before real users

- Have a qualified doctor review the AI prompt in `api/analyze.js` and the disclaimer wording.
- Test with many real report formats (different labs, handwritten, blurry).
- Add your own email SMTP in Supabase so sign-in emails are reliable.
- Add a privacy policy page that matches how you really handle data.
