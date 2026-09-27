# Hostinger Web App deployment

The production site is a Node.js Web App connected to GitHub. Use Node.js 20 or newer,
`npm run build` as the build command, and `npm start` as the start command. The app
installs its `mysql2` dependency from `package-lock.json` during deployment.

## Persistent admin content

Hostinger deployment folders are replaced on redeploy. Create a MySQL database under
Websites → novarefrigerationappliance.com → Databases → Management. Record the **full**
database name and username, including Hostinger's `u..._` prefix. Set these environment
variables under the Web App's Environment variables page:

| Key | Value |
| --- | --- |
| `DB_HOST` | `localhost` (or the host shown by Hostinger) |
| `DB_PORT` | `3306` |
| `DB_NAME` | Full Hostinger database name |
| `DB_USER` | Full Hostinger database username |
| `DB_PASSWORD` | Database password, entered only in Hostinger |

Keep the existing `ADMIN_PASSWORD`. Do not commit credentials or a `.env` file. Add
all database variables before deploying this version of the app. On its first start,
the app creates its own tables and seeds them from the bundled `content/*.json` files.
On later starts it restores admin content, page overrides, and uploaded images from
MySQL, then regenerates public pages and the sitemap. A database connection failure
stops the app rather than serving stale content. The admin sidebar displays
**Database connected** once the production connection is active. Open the admin panel
at `/coffeeplanet`. The old `/admin` page returns 404.

Back up the MySQL database regularly in Hostinger. The database now contains all
admin changes, including images; a backup of only the website files is insufficient.

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
- **Save and publish:** Stores changes in MySQL, rebuilds generated pages, and updates
  the sitemap. Site Page edits and uploads are restored from MySQL after a redeploy.

Admin authentication uses a password supplied by the hosting environment and a
12-hour, HttpOnly, SameSite session cookie. Do not use a static-only deployment for
the admin panel; `server.js` must remain running for `/admin` and its save API.
