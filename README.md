# Saayo Tees — 3D T-Shirt Store

Production-ready immersive t-shirt storefront built with **Next.js (App Router)**,
**Three.js** (`@react-three/fiber` + `drei`), **PostgreSQL + Prisma**,
**Stripe**, **Razorpay** and **Apple AR Quick Look** / AR.

## Features

- T-shirt catalog across graphic tees, plain basics, oversized fits, polos, long sleeves and crop tees
- Interactive 3D t-shirt viewer with body/sleeve/collar color customization, environments, AR try-on (USDZ on iOS)
- Guest + logged-in cart with guest→account merge on login, wishlist, saved addresses
- Checkout with Stripe, Razorpay and Cash on Delivery; discount coupons; order tracking
- Auth with bcrypt, JWT session cookie, login lockout, role-based permissions (RBAC)
- Admin dashboard: orders, products, 3D models, inventory, customers, reviews, coupons, banners, pages/blog, Q&A, reports
- Email (Nodemailer/SMTP), PDF invoice generation, CSV import/export, audit log

## Tech Stack

| Area         | Choice                                  |
| ------------ | --------------------------------------- |
| Framework    | Next.js 14.2 (App Router, server actions not required) |
| Language     | JavaScript (JSX)                        |
| Database     | PostgreSQL + Prisma ORM                 |
| 3D           | Three.js 0.170, @react-three/fiber, drei, webxr |
| Payments     | Stripe, Razorpay (webhook-verified)     |
| Auth         | jose (JWT, httpOnly cookie), bcryptjs   |
| Validation   | zod                                     |
| Styling      | Tailwind CSS                            |
| Tests        | Vitest                                  |

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally (`postgres://postgres:postgres@localhost:5432`)

### 2. Install

```bash
npm install
```

### 3. Configure environment

Create `.env` (there is an `.env.example` template):

```bash
# Copy the template and fill in real values
cp .env.example .env
```

Key variables:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saayo?schema=public
NEXTAUTH_SECRET=<random 32+ char secret>
```

### 4. Create and seed the database

```bash
npm run db:push
npm run db:seed
```

(For schema migrations instead of push: `npm run db:migrate`.)

### 5. Generate sample 3D models (optional)

The seed references a few ready-made `.glb` files in `public/models/`. To generate more procedural sample models:

```bash
npm run gen:models
```

### 6. Run

```bash
npm run dev          # http://localhost:3000
# or production:
npm run build && npm start
```

## Demo Accounts (seeded)

| Role     | Email                   | Password   |
| -------- | ----------------------- | ---------- |
| Admin    | `admin@saayo.example.com` | `Admin@123` |
| Customer | `customer@saayo.example.com` | `Test@123` |

## Payments

Set these for online payments (fall back to COD without them):

- **Stripe**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` (plus publishable keys). Webhook path: `POST /api/payments/webhook`.
- **Razorpay**: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.

Currency is configurable via `CURRENCY` (default `INR`).

## Email

Configure `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` in `.env` to enable order confirmation, password reset and account emails. Without SMTP, emails are logged to the console.

## Testing

```bash
npm test              # vitest unit tests (43 tests in tests/)
npm run test:watch
npm run lint          # next lint (app, components, lib)
```

A live end-to-end suite (`func.check.js`) exercises 73 API checks against a running
server on port 3100: storefront reads, cart, wishlist, addresses, orders, reviews,
guest checkout, coupons, and full admin CRUD (products, banners, categories, brands,
coupons, pages, blog, refunds, shipments, settings, staff, inventory, exports) plus
401/403 authz boundaries. Run `npm run start` (or `npx next start -p 3100` after
`npm run build`), then `node func.check.js`. It creates demo records — reseed afterward
with `npx prisma db push --force-reset --accept-data-loss && node prisma/seed.js`.

## 3D Models & AR

- Models are GLB/GLTF stored in `public/models/` or uploaded via the admin (`/admin/models`).
- The storefront 3D viewer supports material node coloring, finish presets (matte/glossy/metal), environments, auto-rotate and camera angles configured per model.
- AR on iOS uses `model-viewer` loaded at runtime from a CDN (not bundled, to avoid the `three` peer conflict). Sample models: `sample-tshirt.glb` (nodes `body`, `sleeves`, `collar`, `pocket`), `sample-tshirt-oversized.glb`.

## Project Structure

```
app/                     Next.js App Router routes + API routes under /api
components/              Storefront + shared components (3D viewer, checkout, cart…)
components/admin/        Admin dashboard UI
lib/                     Business logic: auth, cart, orders, payments, shipping, validations
prisma/                  schema.prisma + seed script
scripts/                 generate-models.js (procedural GLB generator)
public/models/           Sample GLB files
tests/                   Vitest unit tests
```

## API Notes

- Public API lives under `/api/*` (products, categories, cart, coupons, auth…).
- Admin API is under `/api/admin/*` and requires the admin RBAC session.
- Orders/session cookies are `HttpOnly`; cookie `Secure` flag is enabled automatically in production (`NODE_ENV=production`).

## License

Private project. No warranty of any kind.