# DropShip Market

A full-stack dropshipping marketplace built with Next.js 14, Prisma, Stripe, and NextAuth v5.

## Features

- **Multi-supplier webhook ingestion** — drop-shippers push product catalogs via HMAC-signed webhooks
- **Admin curation** — publish products, set markups per-category or per-item, feature products
- **Storefront** — search, filter by category, product detail pages, cart (localStorage)
- **Auth** — Google + Facebook OAuth via NextAuth v5, role-based access (CUSTOMER / ADMIN)
- **Checkout** — Stripe Elements payment flow with server-side price locking
- **Payouts** — Stripe Connect automatic transfers to drop-shipper Stripe accounts on payment confirmation
- **Order management** — admin order status updates, payout history, retry failed transfers

## Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | NextAuth.js v5 (Google + Facebook) |
| ORM | Prisma |
| Database | Neon (serverless PostgreSQL) |
| Payments | Stripe Checkout + Stripe Connect |
| Hosting | Vercel |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in all values in `.env`:
- `DATABASE_URL` / `DIRECT_URL` — Neon PostgreSQL connection strings
- `AUTH_SECRET` — run `openssl rand -base64 32`
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — [Google Cloud Console](https://console.cloud.google.com/)
- `AUTH_FACEBOOK_ID` / `AUTH_FACEBOOK_SECRET` — [Facebook Developers](https://developers.facebook.com/)
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — [Stripe Dashboard](https://dashboard.stripe.com/)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key
- `ADMIN_EMAIL` — Email that gets auto-promoted to ADMIN on first sign-in

### 3. Set up database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Set up Stripe webhook (local)

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed webhook secret to `STRIPE_WEBHOOK_SECRET`.

## Drop-Shipper Integration

Each drop-shipper gets a unique webhook endpoint created in Admin > Drop-Shippers:

```
POST /api/webhooks/dropshipper/{dropShipperId}
```

Requests must include `x-webhook-signature: sha256=<HMAC_HEX>` using the secret shown in the admin.

### Supported events

```json
{ "event": "product.created", "product": { "id": "ext-001", "title": "...", "wholesalePrice": 10.00, "imageUrls": [], "inventoryCount": 50 } }
{ "event": "product.updated", "product": { "id": "ext-001", "title": "...", "wholesalePrice": 12.00 } }
{ "event": "product.deleted", "product": { "id": "ext-001" } }
```

### Test curl example

```bash
SECRET="your-webhook-secret"
BODY='{"event":"product.created","product":{"id":"p001","title":"Widget","wholesalePrice":9.99,"imageUrls":[]}}'
SIG="sha256=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$SECRET" | awk '{print $2}')"
curl -X POST http://localhost:3000/api/webhooks/dropshipper/{id} \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $SIG" \
  -d "$BODY"
```

## Markup Resolution

```
effectiveMarkup = product.markupOverride ?? category.defaultMarkup ?? dropShipper.defaultMarkup ?? 0.20
sellingPrice    = wholesalePrice * (1 + effectiveMarkup)
```

## Admin Workflow

1. Sign in with `ADMIN_EMAIL` to get ADMIN role
2. **Admin > Drop-Shippers** — create entries, share webhook URL + secret
3. Drop-shipper pushes products → appear in **Admin > Catalog** (Pending section)
4. Publish a product → select category, optional markup override → goes live on storefront
5. Orders arrive → Stripe webhook confirms → payouts auto-created (Stripe Connect or PENDING for manual)
6. **Admin > Payouts** — monitor and retry failed transfers

## Stripe Test Cards

| Card | Result |
|---|---|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0025 0000 3155 | 3D Secure |

Any future expiry, any CVC, any ZIP.

## Project Structure

```
src/
  auth.ts                    NextAuth v5 config (Google + Facebook, PrismaAdapter)
  middleware.ts              Route protection (/admin, /orders, /account, /checkout)
  lib/
    prisma.ts                DB client singleton
    stripe.ts                Stripe client singleton
    pricing.ts               resolveMarkup() + calculateSellingPrice()
    webhook-verify.ts        HMAC-SHA256 signature verification
    slugify.ts               Unique product slug generation
  app/
    (storefront)/            Public pages with Navbar + Footer
      page.tsx               Homepage: hero, categories, featured products
      products/              Product grid with search + category filter
      products/[slug]/       Product detail + add to cart
      cart/                  Cart page
      checkout/              Stripe Elements + shipping form
      checkout/success/      Post-purchase confirmation
      orders/                Customer order history
      orders/[id]/           Order detail
      account/               User profile
      auth/signin|error/     OAuth sign-in pages
    (admin)/                 Admin pages with Sidebar + role guard
      admin/                 Dashboard with stats
      admin/dropshippers/    Drop-shipper CRUD
      admin/catalog/         Ingest + publish products, markup management
      admin/categories/      Category CRUD with default markup
      admin/orders/          Order list + detail + status update
      admin/payouts/         Payout history + retry failed
    api/
      auth/[...nextauth]/    NextAuth handlers
      checkout/              Create Order + Stripe PaymentIntent
      webhooks/stripe/       Confirm payment → create Payout records
      webhooks/dropshipper/  Receive catalog events (HMAC-verified)
      products/[slug]/       Product detail API
  components/
    storefront/              Navbar, ProductCard, CartDrawer, CartContext, CheckoutForm
    admin/                   AdminSidebar
    ui/                      shadcn/ui components
```

## Deployment (Vercel)

1. Push to GitHub and import in Vercel
2. Add all environment variables in Vercel dashboard
3. Set `AUTH_URL` to your production domain (e.g. `https://yourdomain.com`)
4. Add OAuth redirect URIs for Google/Facebook pointing to production URL
5. Configure Stripe webhook: `https://yourdomain.com/api/webhooks/stripe`
6. Run `npx prisma migrate deploy` against production DB
