# Hostinger shared hosting deployment

The supplied Hostinger web app details show support for Node.js 20, 22, and 24. This
project uses only built-in Node.js modules and starts with `npm start`.

1. Back up the current live site in Hostinger. The existing domain is attached to a
   PHP/HTML website, while the Web Apps area currently has no deployed Node app.
2. Package the project, including `admin/`, `assets/`, `content/`, generated HTML,
   `server.js`, `build.js`, `package.json`, `css/`, and `js/`. Keep this project directory
   writable and persistent.
3. In Hostinger's Web Apps setup, choose a temporary domain first and deploy the
   project from a ZIP or repository. Select Node.js 20 or newer and use `npm start`.
   Verify the app and admin panel on the temporary domain before moving the existing
   domain from its PHP/HTML website to the Web App.
4. Set `ADMIN_PASSWORD` as a long, unique environment variable in the hosting panel.
   The app refuses admin sign-in if it is missing. Do not put the password in source
   files or upload a `.env` file to a public directory.
5. Ensure the application can write to `content/`, the generated page directories,
   `sitemap.xml`, and `assets/uploads/`. These paths must persist across app restarts
   and deployments or admin edits and uploads will be lost.
6. Start the app and open `/admin`. Sign in, save a small change, then verify the
   corresponding public page and `sitemap.xml`. Confirm HTTPS is active before
   switching the production domain.

Public pages use extensionless addresses, such as `/brands` and
`/services/washer-repair`. The Node app serves those addresses and redirects old
`.html` addresses permanently; `/index.html` redirects to the domain root. Keep
`server.js` running on Hostinger so these routes work after deployment.

The three initial Our Work cases are clearly marked as illustrative samples. Replace
their text and images with verified jobs before presenting them as real customer work.
Their detail pages are `noindex` and omitted from the sitemap while `sample` is true.

## Content and publishing

- **Repair guides / Our work / Brands:** Add, edit, publish, or draft entries in the
  corresponding admin section. Titles, search descriptions, FAQs, images, and alt text
  are editable there.
- **Site pages:** Select any generated page. Edit visible text in the preview, click an
  image to upload a replacement, or edit the HTML source for advanced changes such as
  JSON-LD. Page SEO title and description have separate fields.
- **Save and publish:** Rebuilds generated pages and updates the sitemap. Site Page
  edits are stored in `content/page-overrides/` and survive rebuilds. Back up both
  `content/` and `assets/uploads/` before replacing the app directory.

Admin authentication uses a password supplied by the hosting environment and a
12-hour, HttpOnly, SameSite session cookie. Do not use a static-only deployment for
the admin panel; `server.js` must remain running for `/admin` and its save API.
