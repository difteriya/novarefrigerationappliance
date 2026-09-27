# Nova Refrigeration & Appliance Repair — Website

A fast, SEO-friendly website with a Node.js admin panel. Public pages are generated as
HTML by [build.js](build.js). Home page FAQs and offers live in
[content/home.json](content/home.json). Blog posts, project examples, and brand profiles live in
[content/collections.json](content/collections.json); the admin panel edits both files and
rebuilds the public pages automatically.

---

## How it works (read this once)

- **Existing site data lives in [build.js](build.js)** — in the `CONFIG` block and the data
  arrays (`SERVICES`, `AREAS`, `BRANDS`, `REVIEWS`). The admin's Site Pages editor
  can edit text, images, SEO fields, and HTML for each generated page.
- **Home page FAQs and offers live in [content/home.json](content/home.json)** and have
  dedicated fields under Home page in the admin. Published offers appear on the site;
  draft offers stay hidden.
- **Blog, Our Work, and brand pages live in [content/collections.json](content/collections.json)**.
  They have dedicated admin forms for entries, images, FAQs, and SEO fields.
- You **edit data → run one command → every page regenerates** (nav, footer, links,
  cross-links between pages all update automatically).
- The generated `.html` files are the public website. The admin requires the Node.js
  app in [server.js](server.js) with a persistent writable project directory.

### Local admin preview

Set an admin password, then start the app:

```powershell
$env:ADMIN_PASSWORD = 'choose-a-long-unique-password'
npm start
```

Open `http://localhost:3000/admin`. Public pages are at `http://localhost:3000/`.
For Hostinger shared hosting deployment, see [HOSTINGER.md](HOSTINGER.md).

### The one command you need

Open a terminal in this folder and run:

```bash
node build.js
```

You'll see it list every page it wrote. Then open `index.html` in a browser (or refresh)
to see your changes. **Always re-run this after editing `build.js`** — editing the data
alone does nothing until you rebuild.

> Requires [Node.js](https://nodejs.org) installed (any recent version).

---

## ✅ First thing to do: replace placeholder contact info

Open [build.js](build.js), find the `CONFIG` block near the top, and replace the
placeholder values with the real business details:

```js
const CONFIG = {
  phoneDisplay: "(512) 740-0408",                    // ← real phone (for display)
  phoneTel:     "+15127400408",                      // ← real phone (digits only, +1 format)
  email:        "service@novarefrigerationappliance.com", // ← real email
  hours:        "Mon–Sat: 7:00 AM – 7:00 PM",        // ← real hours
  // ...
};
```

`phoneDisplay` is what visitors see; `phoneTel` is what the Call/Text buttons dial — set **both**.

Then run `node build.js`.

---

## Recipe 1 — Edit text on the site

Most text comes from the data arrays. Find the relevant entry, change the wording, rebuild.

- **Business name, phone, email, hours, city** → `CONFIG` block.
- **A service's description** → find it in the `SERVICES` array, edit `intro` / `blurb`.
- **A review** → edit the `REVIEWS` array.
- **A home page FAQ or offer** → use Home page in the admin or edit `content/home.json`.

Run `node build.js` when done.

---

## Recipe 2 — Add a new service page

Add one object to the **`SERVICES`** array in [build.js](build.js):

```js
{
  slug: "garbage-disposal-repair",          // becomes services/garbage-disposal-repair.html
  name: "Garbage Disposal Repair",          // page title + nav/footer label
  icon: "🔧",                                // any emoji
  blurb: "Disposal jammed, humming, or leaking? We fix it fast.", // short card text
  intro: "A longer intro paragraph shown at the top of the service page.",
  issues: [                                  // bullet list of problems you fix
    "Jammed",
    "Humming / not spinning",
    "Leaks",
    "Reset / electrical issues",
  ],
},
```

Run `node build.js`. This automatically:
- creates `services/garbage-disposal-repair.html`,
- adds it to the **Services** page grid,
- lists it on **every city page**,
- adds it to the footer (first 7 services show in the footer).

To **remove** a service, delete its object and rebuild (then delete the old `.html` file).

---

## Recipe 3 — Add a new service area (city) page

Add one object to the **`AREAS`** array:

```js
{ slug: "manor", name: "Manor" },   // becomes areas/manor.html
```

Run `node build.js`. This creates the city page (with map + all services), and adds it
to the **Service Areas** page, the homepage area grid, and the footer (first 8 show in footer).

---

## Recipe 4 — Add / change a review

Edit the **`REVIEWS`** array:

```js
{ stars: 5, text: "Great same-day service!", who: "Sam P.", where: "Round Rock" },
```

`stars` is 1–5. Run `node build.js`. (All reviews now appear in the **Reviews** section on the home page — `index.html#reviews`.)

> Note: these are written testimonials. To show **live Google Reviews**, connect a Google
> Business Profile widget in the reviews section of the home page — ask a developer to embed it.

---

## Recipe 5 — Add an FAQ

Use **Home page → Questions → Add question** in the admin, or add an item to
`content/home.json`:

```js
{ "question": "Do you offer a warranty on repairs?", "answer": "Yes — ask us about the warranty for your specific repair." }
```

Run `node build.js`. FAQs now appear in the **FAQ** section on the home page (`index.html#faq`), and FAQ structured data for Google updates automatically.

---

## Recipe 6 — Add a brand to the "brands serviced" list

Edit the **`BRANDS`** array (just a list of names):

```js
const BRANDS = ["Samsung","LG","Whirlpool", /* ... */ "Amana"];
```

Run `node build.js`.

---

## Recipe 7 — Add a brand-new page type (not one of the above)

The page types above (services, areas, etc.) are generated by builder functions at the
bottom of [build.js](build.js) (e.g. `buildAbout()`, `buildContact()`). To add a
one-off page (say, a "Specials" page):

1. Copy an existing simple builder like `buildAbout()` and rename it (e.g. `buildSpecials()`).
2. Change its `title`, `canonical` (e.g. `"specials.html"`), and the HTML body.
3. Add a nav link in the `header()` function if you want it in the menu.
4. Call your new function in the **RUN** section at the bottom: `buildSpecials();`
5. Run `node build.js`.

(For routine content, Recipes 2–6 are all you need — this one is only for new sections.)

---

## File structure

```
.
├── build.js            ← EDIT THIS to change content / add pages, then run `node build.js`
├── nova.txt            ← original source brief
├── README.md           ← this file
├── css/styles.css      ← styling (colors, layout)
├── js/main.js          ← mobile menu + contact form behavior
│
│   (generated by build.js — don't hand-edit; they get overwritten on rebuild):
├── index.html, about.html, services.html, service-areas.html,
├── our-work.html, contact.html
├── assets/    (logo.svg, service icons, promo images)
├── services/  (one page per service)
└── areas/     (one page per city)
```

⚠️ **Don't hand-edit the generated `.html` files** — your changes are erased the next time
you run `node build.js`. Always edit `build.js` instead.

---

## Going live (any static host)

The site is plain static files, so it runs on any host — Cloudflare Pages, Vercel,
GitHub Pages, or traditional web hosting.

1. Run `node build.js` one final time.
2. Upload everything **except** `build.js`, `nova.txt`, and `README.md`
   (the `.html` files + `css/` + `js/`). `index.html` is the home page.
3. If your host deploys from this Git repo, set the **build command** to `node build.js`
   and the **publish/output directory** to the repo root (`.`).

The contact form (Web3Forms) works on any host — see below.

---

## Contact form (Web3Forms)

The "Request Service" form on `contact.html` uses **Web3Forms** — submissions are emailed
to you. No backend code and no account login required.

**One-time setup:**

1. Go to [web3forms.com](https://web3forms.com), enter the email address where you want to
   receive submissions, and copy the **Access Key** it gives you.
2. Open [build.js](build.js), find `web3formsKey` in the `CONFIG` block, and paste your key:
   ```js
   web3formsKey: "your-access-key-here",
   ```
3. Run `node build.js` and re-deploy.

That's it. Submissions arrive by email; a hidden honeypot field blocks most spam. The form
submits via AJAX and shows an inline "thank you" message — no page reload. It will **not**
send until a real access key is set (until then it shows the "please call us" fallback).

---

## Still to do (not code — your input needed)

- [ ] Replace placeholder phone / email / hours in `CONFIG`.
- [ ] **Add your Web3Forms access key** to `web3formsKey` in `CONFIG` (see Contact form section).
- [ ] Swap sample reviews for real **Google Reviews**.
- [ ] Add real photos and a logo/favicon.
- [ ] (SEO extras) sitemap.xml, robots.txt, breadcrumb schema — ask and these can be added.
