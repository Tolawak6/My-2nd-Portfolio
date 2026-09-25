# Tolawak Merga — Full-Stack Developer Portfolio

A personal portfolio site built as a genuine full-stack application: a **React + Vite** frontend,
an **Express** REST API, and **PostgreSQL** as the source of truth for project content.

Projects are not hardcoded anywhere in the React source. They live in PostgreSQL, are managed
through a `/admin` dashboard, and reach the page through the API.

---

## Table of contents

1. [Project overview](#1-project-overview)
2. [Technologies used](#2-technologies-used)
3. [Folder structure](#3-folder-structure)
4. [Frontend installation](#4-frontend-installation)
5. [Backend installation](#5-backend-installation)
6. [PostgreSQL setup](#6-postgresql-setup)
7. [Environment variables](#7-environment-variables)
8. [Database initialisation](#8-database-initialisation)
9. [Running the backend](#9-running-the-backend)
10. [Running the frontend](#10-running-the-frontend)
11. [Adding projects](#11-adding-projects)
12. [Editing projects](#12-editing-projects)
13. [Deleting projects](#13-deleting-projects)
14. [Building for production](#14-building-for-production)
15. [Deployment considerations](#15-deployment-considerations)
16. [Editing your personal content](#16-editing-your-personal-content)
17. [Adding your photo](#17-adding-your-photo)
18. [Image uploads](#18-image-uploads)
19. [API reference](#19-api-reference)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Project overview

Two independently deployable applications live in this repository:

| Part | Path | Stack | Default port |
| --- | --- | --- | --- |
| Frontend | `client/` | React 19, Vite 8, React Router 7, plain modern CSS | `5173` |
| Backend | `server/` | Node.js, Express 4, `pg`, PostgreSQL 17 | `4000` |

The browser only ever talks to the origin it loaded the page from. In development Vite proxies
`/api/*` to the backend, so there are no CORS preflights and no hardcoded `localhost` URLs in the
source. In production the frontend points at the API through `VITE_API_URL`.

**The Projects section is fully dynamic.** The admin dashboard performs real `INSERT`, `UPDATE`
and `DELETE` operations against PostgreSQL.

---

## 2. Technologies used

**Frontend** — React, Vite, React Router, modern CSS (custom properties, Grid, container-free
responsive breakpoints), native `fetch`, IntersectionObserver for scroll reveals.

No UI kit, no CSS framework, no icon package, no animation library. Icons are inline SVG and
animation is a few keyframes plus a class toggle.

**Backend** — Node.js, Express, `pg` (node-postgres), `cors`, `helmet`, `express-rate-limit`,
`dotenv`. Sessions are signed with `node:crypto` HMAC-SHA256, so no JWT dependency is required.

**Database** — PostgreSQL with an identity primary key, `CHECK` constraints and a trigger that
maintains `updated_at`.

**Prerequisites** — Node.js 18.18+, npm 9+, PostgreSQL 14+.

### Colour palette

Four colours, defined once in `client/src/styles/tokens.css` and referenced
everywhere else by name. Change them in that one file.

| Token | Hex | Role |
| --- | --- | --- |
| `--c-navy` | `#27374D` | Header, hero, page background |
| `--c-slate` | `#526D82` | Borders, accents, icon tiles, accent fills |
| `--c-steel` | `#9DB2BF` | Muted/secondary text, dividers |
| `--c-mist` | `#DDE6ED` | Headings, primary text, light UI |

One accessibility constraint shaped how these are used, and it is worth knowing
before you edit them: **`#526D82` and `#DDE6ED` are only 4.30:1 apart.** That
passes WCAG AA for large text (3:1) but *fails* it for body copy (4.5:1). Slate
is therefore used structurally — borders, dividers, accent fills — and never as
a surface carrying normal-sized body text.

To give cards and sections readable surfaces, three shades were derived from the
same hue family:

| Token | Hex | Mist text on it | Use |
| --- | --- | --- | --- |
| `--c-navy-deep` | `#1F2C3D` | 11.18:1 | Alternating section backgrounds |
| `--c-navy-soft` | `#2F4257` | 8.15:1 | Card surfaces |
| `--c-slate-deep` | `#46617A` | 5.11:1 | Accent buttons and badge fills |

The body text tint was also lifted to `rgba(221, 230, 237, 0.68)` (5.16:1) rather
than the more obvious 0.58, which measured 4.35:1 and failed. A muted warm
`#E09480` marks errors so a failure state can never be mistaken for normal UI.

Every text/background pair on the site was verified against WCAG AA
programmatically — see [Verified behaviour](#verified-behaviour).

---

## 3. Folder structure

```text
.
├── client/                         # React + Vite frontend
│   ├── public/
│   │   ├── favicon.svg
│   │   └── images/
│   │       ├── og-image.svg            # social sharing card
│   │       ├── portrait-placeholder.svg
│   │       └── projects/               # sample project images
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/              # AdminLogin, ProjectForm, ImagePicker, ProjectTable, MessagesPanel
│   │   │   ├── contact/            # ContactForm
│   │   │   ├── layout/             # Header, Footer, ScrollManager
│   │   │   ├── projects/           # ProjectCard (+ skeleton)
│   │   │   └── ui/                 # Button, Icon, Tag, Alert, Spinner, SectionHeading
│   │   ├── content/
│   │   │   └── portfolio.js        # ← ALL editable personal content
│   │   ├── hooks/                  # useProjects, useRevealOnScroll, useScrollSpy, useLockBodyScroll
│   │   ├── pages/                  # PortfolioPage, AdminPage, NotFoundPage
│   │   ├── sections/               # Hero, About, Skills, Projects, Experience, Education, Contact
│   │   ├── services/               # api.js, projects.js, adminApi.js, contact.js, uploads.js
│   │   ├── styles/                 # tokens.css, base.css, forms.css
│   │   ├── utils/                  # format.js, optimizeImage.js (browser-side resize)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html                  # SEO tags live here
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
│
├── server/                         # Express REST API
│   ├── scripts/
│   │   ├── api-smoke-test.sh       # end-to-end API test
│   │   └── generate-admin-key.js
│   ├── src/
│   │   ├── config/index.js         # env parsing, fails fast on bad config
│   │   ├── controllers/            # project.controller.js, upload.controller.js
│   │   ├── db/                     # pool.js, schema.sql, migrate.js, seed.js
│   │   ├── middleware/             # requireAdmin, upload (multer), errorHandler, notFound, requestLogger, requireNumericId
│   │   ├── routes/                 # projects, admin, contact, health + index.js
│   │   ├── services/               # project.service.js, contact.service.js, storage.service.js (Cloudinary)
│   │   ├── utils/                  # http.js, session.js
│   │   ├── validators/             # project.validator.js
│   │   ├── app.js                  # builds the Express app
│   │   └── index.js                # starts the server
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## 4. Frontend installation

```bash
cd client
npm install
cp .env.example .env      # optional; sensible defaults are built in
```

## 5. Backend installation

```bash
cd server
npm install
cp .env.example .env      # then edit DATABASE_URL
```

## 6. PostgreSQL setup

Create a database and a dedicated user:

```bash
sudo -u postgres psql
```

```sql
CREATE ROLE portfolio_user LOGIN PASSWORD 'choose_a_strong_password';
CREATE DATABASE portfolio_db OWNER portfolio_user;
\q
```

Your `DATABASE_URL` then looks like:

```env
DATABASE_URL=postgresql://portfolio_user:choose_a_strong_password@localhost:5432/portfolio_db
```

Managed providers (Neon, Supabase, Render, Railway) give you a connection string directly. Use
their **pooled** connection string if one is offered, and set `DB_SSL=true` when the host requires
SSL.

## 7. Environment variables

### `server/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | yes | Port the API listens on. Default `4000`. |
| `DATABASE_URL` | yes | PostgreSQL connection string. |
| `DB_SSL` | no | `true` for hosted Postgres that requires SSL. Default `false`. |
| `CLIENT_URL` | yes | Allowed CORS origin(s), comma-separated. |
| `NODE_ENV` | no | `production` enables real rate limits and disables the request logger. |
| `ADMIN_API_KEY` | for admin | Server-side admin key. Generate with `npm run admin:key`. |
| `ADMIN_SESSION_SECRET` | for admin | Signs session tokens. Generate with `npm run admin:key`. |
| `ADMIN_SESSION_TTL_MINUTES` | no | Session lifetime. Default `120`. |
| `CLOUDINARY_CLOUD_NAME` | for uploads | From the Cloudinary console. |
| `CLOUDINARY_API_KEY` | for uploads | From the Cloudinary console. |
| `CLOUDINARY_API_SECRET` | for uploads | **Secret.** Signs each upload. Never reaches the browser. |
| `CLOUDINARY_FOLDER` | no | Where uploads are filed. Default `portfolio/projects`. |
| `MAX_UPLOAD_MB` | no | Server-side size backstop. Default `5`. |

> **If `ADMIN_API_KEY` and `ADMIN_SESSION_SECRET` are missing, the admin write endpoints return
> `503` and stay closed.** They never fall open.
>
> **If the three `CLOUDINARY_*` values are missing, the upload endpoint returns `503` and the
> admin form falls back to a plain image-URL field.** A fresh clone always runs.

### `client/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | production | Base URL of the API. **Leave unset in development** so requests use relative paths and go through the Vite proxy. |

Only `VITE_`-prefixed values reach the browser bundle. Never put a secret in this file — anything
there is public.

## 8. Database initialisation

```bash
cd server
npm run db:migrate        # create/update tables (idempotent)
npm run db:seed           # insert sample rows, only if the table is empty
npm run db:seed:force     # wipe and re-insert sample rows
npm run db:migrate:reset  # DROP tables, then recreate (destructive)
npm run db:reset          # reset + seed in one step
```

`db:migrate` applies `src/db/schema.sql`, which creates:

- **`projects`** — `id` (identity PK), `name`, `image`, `link`, `description`,
  `image_public_id`, `created_at`, `updated_at`. `updated_at` is kept accurate by a `BEFORE UPDATE`
  trigger. `image_public_id` records the storage asset behind an uploaded image so it can be cleaned
  up later; it is empty for images referenced by URL, which are never deleted.

Every statement is idempotent, so `db:migrate` is safe to run against a database that already holds
data — new columns are added with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` rather than requiring a
reset.
- **`contact_messages`** — contact form submissions.

## 9. Running the backend

```bash
cd server
npm run dev      # node --watch, restarts on change
npm start        # plain start
```

You should see:

```
[db] connected
  Portfolio API listening on http://localhost:4000
  Environment      : development
  Admin auth       : enabled
```

Check it with `curl http://localhost:4000/api/health`.

## 10. Running the frontend

```bash
cd client
npm run dev      # http://localhost:5173
```

Then open **http://localhost:5173**. The portfolio is at `/`, the dashboard at `/admin`.

### Run both at once

Use two terminals, or from the repository root:

```bash
# from the repository root, first time only
npm install
npm run setup        # installs dependencies in server/ and client/

# then, any time
npm run dev          # starts the API and the client together
```

Other root shortcuts: `npm run dev:api`, `npm run dev:web`, `npm run build`,
`npm run db:migrate`, `npm run db:seed`, `npm run db:reset`, `npm run admin:key`,
`npm run test:api`.

---

## 11. Adding projects

### Through the admin dashboard (recommended)

1. Generate credentials once:
   ```bash
   cd server && npm run admin:key
   ```
   Paste the two generated lines into `server/.env` and restart the API.

2. Open **http://localhost:5173/admin**.
3. Enter your `ADMIN_API_KEY` and sign in.
4. Fill in **Project name** and **Project URL**.
5. Under **Project image**, press **Choose Image** and pick a file — from your computer or your
   phone. It uploads straight away and shows a preview. (Prefer to link an image you already host?
   Switch to **Use a URL** and paste the address instead.)
6. Add a **Description** and press **Add project**.

The project is written to PostgreSQL and appears in the portfolio's Projects section immediately —
no rebuild, no code change.

### Through the API

```bash
# 1. Exchange the admin key for a short-lived session token
TOKEN=$(curl -s -X POST http://localhost:4000/api/admin/session \
  -H 'Content-Type: application/json' \
  -d '{"apiKey":"YOUR_ADMIN_API_KEY"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.token')

# 2. Create the project
curl -X POST http://localhost:4000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
        "name": "Inventory API",
        "image": "https://example.com/screenshot.png",
        "link": "https://github.com/you/inventory-api",
        "description": "REST API for stock tracking built with Express and PostgreSQL."
      }'
```

`image` and `link` accept an absolute `http(s)://` URL or a site-relative path such as
`/images/projects/my-project.png`. Send `""` for either if you do not have one yet — the card
degrades gracefully rather than showing a broken image or a dead link.

## 12. Editing projects

In `/admin`, press **Edit** on any row. The form loads the project, and **Save changes** issues a
`PUT /api/projects/:id`. The portfolio reflects the change on the next load.

```bash
curl -X PUT http://localhost:4000/api/projects/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Updated name","image":"","link":"https://example.com","description":"Updated description."}'
```

## 13. Deleting projects

In `/admin`, press **Delete**, then confirm. The row is removed from PostgreSQL and disappears from
the portfolio.

```bash
curl -X DELETE http://localhost:4000/api/projects/1 -H "Authorization: Bearer $TOKEN"
```

Every write endpoint needs a valid session token and returns `401` without one.

---

## 14. Building for production

```bash
# Frontend → client/dist
cd client
npm run build
npm run preview      # serve the build locally to check it

# Backend — nothing to compile; run it with a process manager
cd ../server
NODE_ENV=production npm start
```

Before deploying, set `VITE_API_URL` to your deployed API URL and rebuild the frontend:

```bash
cd client
VITE_API_URL=https://your-api.onrender.com npm run build
```

## 15. Deployment considerations

The frontend and backend deploy independently.

**Frontend → Vercel / Netlify / Cloudflare Pages**
- Root directory: `client`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://your-api-host`
- Because routing is client-side, add a SPA rewrite so `/admin` resolves to `index.html`:
  - Vercel: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`
  - Netlify: `/* /index.html 200` in `_redirects`

**Backend → Render / Railway / Fly.io**
- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Environment: `NODE_ENV=production`, `PORT`, `DATABASE_URL`, `DB_SSL=true`, `CLIENT_URL`, the two
  admin secrets, and the three `CLOUDINARY_*` values.
- Uploads never touch the server's filesystem — images are buffered in memory and forwarded
  straight to Cloudinary — so the API stays stateless and can run on a host with an ephemeral disk.

**Database → Neon / Supabase / Render PostgreSQL / RDS**
- Create the instance, run `npm run db:migrate` against it once, and optionally `npm run db:seed`.

**CORS** — in production only the origins listed in `CLIENT_URL` are accepted. Set it to your real
frontend URL (comma-separated for several), including the scheme and no trailing slash:

```env
CLIENT_URL=https://portfolio.example.com,https://www.portfolio.example.com
```

**Security checklist**

- [ ] `NODE_ENV=production` so the real rate limits apply.
- [ ] Fresh `ADMIN_API_KEY` and `ADMIN_SESSION_SECRET` generated for production.
- [ ] `DATABASE_URL` and both admin secrets set as host environment variables, never committed.
- [ ] `CLIENT_URL` lists only your real frontend origins.
- [ ] `CLOUDINARY_API_SECRET` is set on the server only — it must never appear in `client/`.
- [ ] `.env` files are git-ignored (they already are — see `.gitignore`).

---

## 16. Editing your personal content

**Almost everything you will want to change lives in one file: `client/src/content/portfolio.js`.**

That file holds your name, title, intro, about paragraphs, skills, experience, education, contact
links, section headings and navigation. You should not need to open a component to update content.

Items marked `PLACEHOLDER` in that file are stand-ins:

| What | Where | Action |
| --- | --- | --- |
| Name, title, intro | `profile` | Already set to Tolawak Merga. |
| Location, availability | `profile.location`, `profile.availability` | Replace or delete. |
| Experience entries | `experience` | Replace the example entry, or delete the whole array. |
| Education entries | `education` | Replace the example entry, or delete the whole array. |
| GitHub / LinkedIn / Telegram | `contact.links` | Replace `value` and `href`. Entries with `href: '#'` render as "not added yet" rather than a broken link. |

Sections left empty render a clear message instead of an empty gap. Example experience and
education entries carry a visible **"Example entry"** badge so they can never be mistaken for a real
claim — remove the badge by deleting `isPlaceholder: true` on your own entries.

**Skill proficiency** is deliberately unset. If you want to show it, add a level to an individual
skill:

```js
{ name: 'React', level: 'confident' }   // 'confident' | 'working' | 'learning'
```

Skills without a level make no claim about your ability.

**SEO** — title, meta description, Open Graph and Twitter tags are in `client/index.html`.

## 17. Your photo

A prepared headshot is already in place at
**`client/public/images/portrait.jpg`** (846 x 1058, 4:5) and the hero points at
it. To use a different photo:

1. Put your new image at `client/public/images/portrait.jpg`, replacing the file.
   Recommended: 4:5 portrait, at least 900 px on the short edge, under ~400 KB.
2. If its dimensions differ, update the `width` / `height` so the browser can
   reserve the right space and avoid layout shift:

   ```js
   photo: {
     src: '/images/portrait.jpg',
     alt: 'Portrait of Tolawak Merga',
     width: 1200,
     height: 1500,
   },
   ```

The hero crops to a 4:5 frame with `object-fit: cover` positioned at `center 22%`, so a
head-and-shoulders shot keeps sensible headroom. Adjust `object-position` in
`client/src/sections/Hero.css` if a new photo needs a different crop.

`client/public/images/portrait-placeholder.svg` is still present as a fallback you can point
`photo.src` at — a designed placeholder, never a different person.

### How the headshot was prepared

`client/scripts/prepare-portrait.py` does the work, and it is deliberately
minimal — **Pillow and NumPy only**. No machine-learning model, no generative
step, nothing that touches the subject. Skin tone and features come through
exactly as photographed.

```bash
cd client
pip install pillow numpy
python scripts/prepare-portrait.py
```

1. Crops to the hero's 4:5 frame, trimming from the bottom so the head keeps its
   headroom (832 x 1040 in, 832 x 1040 out — no upscaling, no re-encoding loss).
2. Gentle contrast around midtones, a small shadow lift so dark clothing keeps
   its detail, a light output sharpen, and hue-preserving chroma.
3. Saves an optimised progressive JPEG, ~141 KB.

**It does not remove the background, and that is deliberate.** A studio photo
already has a usable background, and cutting a subject out risks the halos and
fringing that background removal introduces. It happens that the current
portrait's backdrop is already a gradient from `#506b7e` to `#9db3c0` — within a
hair of the site's `#526D82` and `#9DB2BF` — so it sits in the palette naturally.

If you do need the background removed for a different photo, note that the
segmentation approach downloads a **~176 MB** model file into `~/.rembg/`, which
is not git-ignored. That is the reason it is not the default here.

Nothing about the grading shifts colour balance. Warming or cooling the whole
frame moves the skin tone, and the skin tone must stay as photographed.

---

## 18. Image uploads

Project images are uploaded from the browser rather than pasted as URLs. In the admin dashboard,
under **Project image**, press **Choose Image** and pick a file — the same button works on a phone,
and on desktop you can also drag a file onto the drop zone. A preview appears immediately, and the
image uploads in the background while you finish typing the rest of the project.

### Setting it up

Uploads use **Cloudinary**, which stores the files and serves them over a CDN.

1. Create a free account at [cloudinary.com](https://cloudinary.com) (the free tier is generous).
2. Open **Dashboard → Settings → API Keys**. You need three values:
   - **Cloud name**
   - **API Key**
   - **API Secret**
3. Put them in `server/.env`:
   ```bash
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=000000000000000
   CLOUDINARY_API_SECRET=your-api-secret
   ```
4. Restart the API.

Leave them blank and everything still works — the form simply offers a URL field instead, and the
upload endpoint returns `503`.

### How the upload is kept safe

The browser never holds a storage credential, and there is no unsigned upload preset (which would
amount to a public write key into your account). Instead:

1. The browser sends the file to `POST /api/admin/uploads` with its admin session token.
2. The API checks that token, then signs the upload with the API secret and forwards it.
3. Cloudinary returns a URL, which is saved on the project row in PostgreSQL.

The API secret is used only on the server. The signature is valid for one hour and is locked to the
`CLOUDINARY_FOLDER` folder, so a leaked signature cannot be reused elsewhere.

### Images are shrunk before they are uploaded

A photo off a phone is 4–8 MB and 4000px wide, but a project card never renders wider than about
600px. `client/src/utils/optimizeImage.js` therefore resizes to a 1600px longest edge and re-encodes
to WebP **in the browser**, before anything is sent. A 6 MB photo typically leaves as 200–400 KB, so
the upload is quick on mobile data and the portfolio stays fast for every visitor afterwards.

The original file on your device is never modified — only the bytes that travel are affected.
Animated GIFs pass through untouched (a canvas would flatten them), and images that are small and
already optimised are sent as-is, because re-encoding them would make them bigger. Two limits apply
on top: `MAX_UPLOAD_MB` on the server, and a 1600px cap in the browser.

### Deleting images

Deleting a project also deletes its uploaded image, and replacing an image deletes the one it
replaced. Two safety rules keep this from doing damage:

- **Images you did not upload are never touched.** A pasted URL has no stored asset id, so the
  server has nothing to delete and will not go looking.
- **A shared image survives until the last project releases it.** If two projects use the same
  upload, deleting one leaves the file alone.

Storage cleanup is best-effort: if Cloudinary is unreachable, the database change still succeeds
and the orphaned file is logged. A tidy-up problem must never turn into a failed edit.

## 19. API reference

Base URL: `http://localhost:4000/api`

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | — | Service and database status. |
| `GET` | `/projects` | — | All projects, newest first. |
| `GET` | `/projects/:id` | — | One project, or `404`. |
| `POST` | `/projects` | admin | Create a project. |
| `PUT` / `PATCH` | `/projects/:id` | admin | Update a project. |
| `DELETE` | `/projects/:id` | admin | Delete a project. |
| `GET` | `/admin/status` | — | Whether admin auth is configured. |
| `POST` | `/admin/session` | — | Exchange the admin key for a session token. |
| `POST` | `/admin/uploads` | admin | Multipart image upload. Field name `file`. |
| `GET` | `/admin/messages` | admin | Contact form submissions. |
| `POST` | `/contact` | — | Submit the contact form. |

**Responses** are wrapped as `{ "data": ... }`, with an optional `"meta"` alongside. Errors are
`{ "error": { "message": "...", "status": 422, "details": [...] } }`.

**Status codes** — `200` read, `201` created, `204` deleted, `400` malformed id or body,
`401` missing/expired token, `404` not found, `413` body too large, `415` unsupported file type,
`422` validation failure, `429` rate limited, `502` storage rejected the upload,
`503` database, admin auth, or storage unavailable.

**Security notes**

- All queries are parameterised — no value is ever interpolated into SQL text.
- The admin API key lives only in `server/.env`. The browser receives a short-lived signed token
  instead, stored in `sessionStorage` and cleared when the tab closes. There is no password in the
  frontend bundle to bypass.
- Contact and sign-in endpoints are rate limited (5/hour and 10/15 min in production).
- Visitors never see database errors; details are logged server-side.

**Run the end-to-end API test** against a running server:

```bash
cd server
./scripts/api-smoke-test.sh http://localhost:4000 "$(grep '^ADMIN_API_KEY=' .env | cut -d= -f2-)"
```

It checks health, auth enforcement, validation, the full CRUD cycle, and verifies each change
actually landed in PostgreSQL.

## 20. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `Missing required environment variable "DATABASE_URL"` | No `server/.env`. Run `cp .env.example .env` and fill it in. |
| `[db] connection failed` | Postgres is not running, or `DATABASE_URL` is wrong. Check with `psql "$DATABASE_URL"`. |
| `The database schema has not been initialised yet` | Run `npm run db:migrate` in `server/`. |
| Admin page says auth is not configured | Set `ADMIN_API_KEY` and `ADMIN_SESSION_SECRET` in `server/.env` (use `npm run admin:key`), then restart the API. |
| Projects section shows an error | The API is not reachable. Confirm it is running and `VITE_API_URL` is correct for your environment. |
| `CORS` error in the browser console | Add your frontend origin to `CLIENT_URL` in `server/.env` and restart the API. |
| 429 on the contact form while testing | Production limits are strict. Set `NODE_ENV=development` for relaxed local limits. |
| Blank page after deploying the frontend | The SPA rewrite is missing, so `/` is fine but `/admin` 404s. Add the rewrite shown in section 15. |

---

## Verified behaviour

The complete flow has been tested end to end in a real browser against a real PostgreSQL instance:

1. Admin signs in — wrong key rejected, correct key accepted.
2. Admin adds a project from `/admin` → the row is written to PostgreSQL.
3. The Express API returns it from `GET /api/projects`.
4. React fetches it and the card appears in the portfolio Projects section.
5. Admin edits it → the change persists to PostgreSQL and the portfolio shows the new values, with
   `updated_at` advanced by the database trigger.
6. Admin deletes it → the row is gone from PostgreSQL and the card disappears, with the empty state
   returning.

Also verified: no horizontal scrolling at 320 px, 390 px, 834 px, 1280 px and 1440 px; the mobile
hamburger menu opens, traps nothing, and closes on Escape; the dashboard stacks into cards on
mobile; there are no console errors or failed requests; and async-rendered content is actually
visible (computed opacity `1`, not merely present in the DOM).

## Licence

Personal portfolio source. The sample project entries and placeholder images are intended to be
replaced with your own work.
