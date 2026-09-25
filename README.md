# Odontools API

Express/MongoDB service for the [Odontools storefront](https://github.com/Lenin-Miranda/Odontools), with authentication, products, cart and sales routes. Integrations include Cloudinary uploads and SendGrid order email services.

## Setup

Requires Node.js, npm and MongoDB.

```bash
git clone https://github.com/Lenin-Miranda/Odontools-backend.git
cd Odontools-backend
npm install
```

Create your own `.env`:

```dotenv
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/odontools
JWT_SECRET=replace-with-a-generated-secret
```

Configure the following server variables for the corresponding integrations:

| Variables | Used by |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Product/media uploads |
| `SENDGRID_API_KEY`, `ADMIN_EMAIL` | Order email services |
| `ADMIN_DASHBOARD_URL`, `ADMIN_PHONE` | Email template links/contact details |

Supply your own credentials; do not reuse connection strings from repository examples.

```bash
npm run dev
```

The server listens at `http://localhost:3001`. Use `npm start` without file watching. In production the process environment supplies configuration; the server only loads `.env` outside production.

## Route groups

| Prefix | Purpose |
| --- | --- |
| `/api/auth` | Authentication |
| `/api/products` | Products |
| `/api/cart` | Cart |
| `/api/sales` | Sales |
| `/uploads` | Static uploaded files |

See [routes/](routes/) for methods and [controllers/](controllers/) for behavior.

## Browser integration

[server.js](server.js) uses an explicit CORS allowlist with credentials. Its local allowed frontend is `http://localhost:3000`; Vite's usual `5173` origin is not listed. Cookie settings also differ between development and production.

## Checks

`npm test` runs Jest. Use an isolated test database and inspect the existing test setup before running it. Verify integrations using your own development services; order actions may send real email. There is no compilation/build script.
