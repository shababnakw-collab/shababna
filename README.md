# Shababna

Shababna (شبابنا) connects Kuwaiti young people aged 14 to 22 with camps, volunteering and internships.

## What is in this repository

| Path | What it is |
|---|---|
| `index.html`, `app.js`, `config.js`, `style.css` | the website. Plain JavaScript, no build step. Hosted on GitHub Pages. |
| `supabase/functions/create-checkout` | starts a MyFatoorah payment |
| `supabase/functions/payment-callback` | confirms a payment and switches the subscription on |
| `supabase/functions/verify-civil-id` | reads Civil ID photos and approves, rejects or sends them for review (`logic.ts` holds the rules) |

The database, security rules and storage live in Supabase (project `fopeaeazeqnudhwpyzji`). The copies of the functions here are for safekeeping. The running versions are in Supabase.

## Website settings

`config.js` holds the Supabase address and the publishable key. These are meant to be public. It also holds `CONTACT_EMAIL` (shown on the Privacy Policy and Terms) and `LEGAL_DRAFT` (set to `false` once a lawyer has reviewed those pages).

## Secrets (set in Supabase under Edge Functions, then Secrets, never in this repository)

`MYFATOORAH_API_KEY`, `MYFATOORAH_BASE_URL`, `SITE_URL`, `ANTHROPIC_API_KEY`, `ID_HASH_SALT`

## After changing the website address

Update the **Site URL** in Supabase (Authentication, URL Configuration) and the `SITE_URL` secret.

## Do not commit

Secret keys, the service role key, passwords, or photos of identity documents.
