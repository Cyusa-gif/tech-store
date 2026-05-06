# Kigali Tech Store

A full-stack Vue 3 e-commerce app for a fictional gadget shop in Kigali, Rwanda.

**Frontend:** Vue 3 + Vite, Vue Router 4, Pinia, Tailwind CSS v4  
**Backend:** Node.js + Express, Stripe Payments API  
**Products:** Public [Fake Store API](https://fakestoreapi.com) (no key needed)

---

## Quick start

### 1. Install Node.js 20 or newer

Download from https://nodejs.org and install. Check you have it:

```bash
node --version   # should print v20 or higher
```

### 2. Extract and open the folder

Unzip the downloaded file, then open a terminal **inside** the `kigali-tech-store/` folder:

```bash
cd kigali-tech-store
```

### 3. Install dependencies

```bash
npm install
```

### 4. Add your Stripe test keys (optional — skip for demo mode)

Copy the example env file:

```bash
cp .env.example .env
```

Open `.env` in any text editor and paste your keys from
**https://dashboard.stripe.com/test/apikeys** (make sure you are in **Test mode**):

```
STRIPE_SECRET_KEY=sk_test_...       ← Secret key (backend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  ← Publishable key (frontend)
```

> Without keys the app still works — checkout falls back to a friendly demo card UI and no real charge happens.

### 5. Start the app

```bash
npm start
```

This starts **both** the frontend and the backend together:

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:5173      |
| Backend  | http://localhost:3001      |

Open **http://localhost:5173** in your browser.

---

## Run frontend and backend separately

If you prefer two terminal windows:

**Terminal 1 — frontend:**
```bash
npm run dev
```

**Terminal 2 — backend:**
```bash
npm run server
```

---

## Demo account

| Field    | Value              |
|----------|--------------------|
| Email    | demo@kigali.rw     |
| Password | demo1234           |

Click "Fill demo credentials" on the sign-in page.  
This account also unlocks the **Admin panel** (`/admin`).

## Test card (Stripe test mode)

| Field   | Value                    |
|---------|--------------------------|
| Number  | 4242 4242 4242 4242      |
| Expiry  | Any future date (e.g. 12/29) |
| CVC     | Any 3 digits             |

---

## Project structure

```
kigali-tech-store/
├── server.js            ← Express backend (Stripe routes)
├── vite.config.ts       ← Vite config with /api proxy to backend
├── package.json
├── .env                 ← Your secrets (never commit this!)
├── .env.example         ← Template
├── public/
│   ├── favicon.svg
│   └── opengraph.jpg
└── src/
    ├── main.ts
    ├── App.vue
    ├── index.css        ← Tailwind v4 + Rwanda flag theme
    ├── router/index.ts  ← All routes + auth & admin guards
    ├── types/index.ts
    ├── lib/format.ts    ← RWF currency helpers
    ├── stores/          ← Pinia stores
    │   ├── auth.ts      ←   login/register (localStorage)
    │   ├── cart.ts      ←   cart + VAT + shipping
    │   ├── wishlist.ts
    │   ├── products.ts  ←   Fake Store API
    │   └── orders.ts    ←   order history + admin status updates
    ├── composables/
    │   └── useToast.ts
    ├── components/
    │   ├── SiteHeader.vue
    │   ├── SiteFooter.vue
    │   ├── ProductCard.vue
    │   ├── StarRating.vue
    │   ├── Spinner.vue
    │   └── ToastShelf.vue
    └── views/
        ├── HomeView.vue
        ├── ProductsList.vue / ProductsLayout.vue / ProductDetail.vue
        ├── CartView.vue / WishlistView.vue
        ├── CheckoutView.vue      ← Stripe Elements + real PaymentIntent
        ├── OrderSuccess.vue
        ├── ProfileLayout.vue / ProfileInfo.vue
        ├── ProfileOrders.vue     ← Order dashboard + live Stripe status
        ├── AdminPanel.vue        ← Admin-only order management
        ├── LoginView.vue / RegisterView.vue
        └── NotFound.vue
```

## Routes

| Path                           | Auth?  | Description                    |
|--------------------------------|--------|--------------------------------|
| `/`                            | No     | Home                           |
| `/products`                    | No     | Catalog                        |
| `/products/category/:category` | No     | Filtered catalog               |
| `/products/:id`                | No     | Product detail                 |
| `/cart`                        | No     | Shopping cart                  |
| `/wishlist`                    | No     | Saved items                    |
| `/checkout`                    | Yes    | 3-step checkout with Stripe    |
| `/order-success/:orderId`      | Yes    | Order confirmation             |
| `/profile`                     | Yes    | Profile info                   |
| `/profile/orders`              | Yes    | Order dashboard + Stripe status|
| `/admin`                       | Admin  | Order management panel         |
| `/login`, `/register`          | No     | Auth pages                     |

## Production build

```bash
npm run build        # outputs frontend to dist/
```

For production you would deploy the `dist/` folder to a static host (Netlify, Vercel, etc.)
and run `node server.js` on a server with real environment variables (not from .env).

## License

MIT — free to use and modify.
