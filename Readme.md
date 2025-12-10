# Eventra - Events & Activities Platform (Backend)

#### Live API: [eventra-backend.vercel.app](https://eventra-backend.vercel.app)

#### Frontend: [eventra-frontend-neon.vercel.app](https://eventra-frontend-neon.vercel.app)

#### Frontend-Repository: []()

#### Demo Video:

Eventra is a full-featured backend for creating, discovering, joining, and managing events with a sophisticated event ecosystem. It supports three distinct roles (Admin, Host, Client) with fine-grained access controls, secure SSLCommerz payment processing, peer-to-peer reviews with host rating aggregation, comprehensive analytics dashboards, and multi-template email notifications. Features interest-based event personalization, real-time capacity management, transactional integrity for payments and bookings, and admin-driven approval workflows for hosts and events. Built with TypeScript, Prisma/PostgreSQL, and modern Node.js best practices.

---

## Project Overview

- Users discover and join events based on interests.
- Hosts create/manage events, track participants, and receive payments.
- Admins oversee users, hosts, events, and system health.
- Payments processed via SSLCommerz; reviews update host ratings; dashboards expose key stats.

---

## Technologies

### Core & Runtime

- **Node.js :** JavaScript runtime
- **Express.js :** HTTP server & REST API routing
- **TypeScript :** Static type checking & compilation

### Database & ORM

- **Prisma :** TypeScript ORM for PostgreSQL
- **PostgreSQL :** Relational database (Neon for production)
- **@prisma/client :** Prisma client library

### Authentication & Security

- **jsonwebtoken :** JWT token creation/verification (access/refresh)
- **bcryptjs :** Password hashing and verification
- **cookie-parser :** HTTP cookie parsing (optional token storage)

### Validation & Serialization

- **Zod :**Schema validation for requests/payloads
- **uuid :** Unique ID generation

### File Handling & Cloud Storage

- **Multer :**Multipart form data file upload middleware
- **multer-storage-cloudinary :** Cloudinary storage adapter for Multer
- **Cloudinary :**Cloud image storage and optimization

### Email & Templating

- **nodemailer :** Email delivery (SMTP)
- **EJS :**Email template rendering

### HTTP & Network

- **Axios :** HTTP client (SSLCommerz API calls)
- **CORS :.** Cross-Origin Resource Sharing middleware
- **http-status :**HTTP status code utilities
- **http-status-codes :** Alternative HTTP status constants

### Middleware & Rate Limiting

- **express-rate-limit :** API rate limiting middleware

### Environment & Configuration

- **dotenv :** Environment variable management

### Development Tools

- **ts-node-dev :** Watch mode TypeScript development server
- **ts-node :** TypeScript execution without compilation
- **tsx :** Fast TypeScript transpiler

### Type Definitions (Dev Dependencies)

- **@types/express**, **@types/node**, **@types/jsonwebtoken**, **@types/multer**, **@types/nodemailer**, **@types/ejs**, **@types/cors**, **@types/cookie-parser** – TypeScript type definitions for all major packages

---

## Features (Detailed)

### Authentication & Roles

- JWT authentication with access/refresh tokens; HTTP-only cookies supported.
- Roles: **ADMIN**, **HOST**, **CLIENT** with route guards.
- Password hashing (bcrypt);
- Refresh token endpoint to renew sessions.

### User Profiles

- Create/update profile: name, bio, interests, location, contact number, profile photo (Cloudinary).
- View own profile; admins can list/filter users with pagination & search.

### Event Lifecycle

- Hosts: create, update, delete, complete events;
- Status flow: PENDING → OPEN → FULL / COMPLETED / REJECTED / CANCELLED.
- Capacity management: auto FULL when seats exhausted; reopen seats on leave.
- Validation: block past-date events from listings; recent events (limit 6) for landing page.
- Search & filters: searchTerm, category, date; interest-based ordering for signed-in users.

### Participation

- Clients join events (creates participant + pending payment); leave events before event date.
- ParticipantStatus respected; seat counts adjusted transactionally.
- Host/Admin can view participants (in event details page) with review status flags.

### Payments (SSLCommerz)

- Join event initiates payment; stores transactionId; links participant, event, host, client.
- Success/fail/cancel IPN handlers update PaymentStatus and event capacity/status accordingly.
- Role-based visibility: Admin sees all payments; Host sees payments for own events.
- Search/pagination/sort on payments (transactionId, client name, status).

### Reviews & Ratings

- Clients can review hosts only after event is COMPLETED and payment is PAID.
- Prevent duplicate reviews per client per event; updates host rating aggregates.
- Latest 20 reviews endpoint for landing page.

### Analytics & Meta

- Landing stats: total events, completed events, successful payments, clients, hosts, reviews, average rating.
- Role dashboards: admin (system totals, pending apps), host (their events, revenue), client (their participation).

### Email & Notifications

- Contact form sends email to admin via `contact-email.ejs`.
- host application email, host rejection email, event payment invoice email also sent by ejs.

### Security & Middleware

- Rate limiting middleware available; centralized error handler; validation via Zod.
- Role-based auth guard; input validation; Prisma query scoping per role.

### File Handling

- Multer for upload; Cloudinary for storage; cleanup of replaced images on update where applicable.

### Pagination & Sorting

- Consistent pattern using `paginationHelper` across list endpoints; meta includes page/limit/total.

### Personalization ("mind-like" events)

- Interest-weighted event ordering for authenticated users (matches user interests to event categories).
- Recent events curated for landing; excludes past or rejected/cancelled events.
- Role-aware responses (admin vs host vs client) tailor what data and actions are available.

### Admin Controls

- Host applications: approve/reject; escalates user to Host on approval.
- Event applications: approve/reject; enforces status transitions.
- User suspension/unsuspension affecting login and visibility.
- Payment history
- Lists for hosts/clients with search, status filters, pagination.

### Guardrails & Eligibility

- Review eligibility: only after event COMPLETED and payment PAID; one review per client/event.
- Join/leave rules: cannot overbook; leaving frees seats before event date; capacity/state updates are transactional.
- Payment visibility scoped by role; host cannot see others’ event payments.
- Image replacement cleans up previous uploads where applicable.

### Validation & Error Handling

- Zod-powered request validation on inputs and multipart payloads.
- Centralized error handler with structured `ApiError` responses.
- Rate limiter middleware available for abuse protection.

---

## Project Structure

```
src/
  app.ts
  server.ts
  app/
    routes/
    middlewares/
    helpers/
    modules/
      auth/
      User/
      Host/
      Events/
      payment/
      review/
      Meta/
    shared/
    config/
  prisma/
    schema.prisma
```

---

## Environment Variables

```
NODE_ENV=development
PORT=5000
DATABASE_URL=

JWT_SECRET=
EXPIRES_IN=1d
REFRESH_TOKEN_SECRET=
REFRESH_TOKEN_EXPIRES_IN=30d
RESET_PASS_TOKEN=
RESET_PASS_TOKEN_EXPIRES_IN=5m
SALT_ROUND=10

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=Admin@12345
FRONTEND_URL=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SSL_STORE_ID=
SSL_STORE_PASS=
SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v3/api.php
SSL_VALIDATION_API=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
SSL_IPN_URL=
SSL_SUCCESS_BACKEND_URL=
SSL_FAIL_BACKEND_URL=
SSL_CANCEL_BACKEND_URL=
SSL_SUCCESS_FRONTEND_URL=
SSL_FAIL_FRONTEND_URL=
SSL_CANCEL_FRONTEND_URL=
```

---

## Setup & Run Locally

```bash
git clone <repo-url>
cd Backend
npm install
npx prisma generate
# create .env using the vars above
npm run dev
```

### Useful Scripts

- `npm run dev` – start in watch mode
- `npm run build` – compile TypeScript
- `npm run lint` – run ESLint

---

## Admin / Seed Credentials

- Admin email: `admin@gmail.com`
- Admin password: `Admin@12345`

---

## Core API Surface (high level)

- **Auth**: `/api/v1/auth` — login, register, refresh, password reset flows
- **Users**: `/api/v1/user` — me, list/filter, update profile, contact email to admin
- **Hosts**: `/api/v1/host` — create/update/delete events, my hosted events, complete/cancel
- **Events**: `/api/v1/event` — list with filters/search, single, join/leave, recent, participants
- **Payments**: `/api/v1/payment` — SSLCommerz callbacks, list/search/sort/paginate
- **Reviews**: `/api/v1/review` — create review, latest 20
- **Meta**: `/api/v1/meta` — landing stats and dashboards

---

## Endpoint Details (selected)

### Auth

- `POST /api/v1/auth/login` — email/password → access/refresh; sets cookies if configured.
- `POST /api/v1/auth/refresh-token` — refresh → new access; requires refresh token.
- `GET /api/v1/auth/me` — returns user with role; requires access token.
- `POST /api/v1/auth/reset-password` — Admin-only password reset for a user by id.
- `POST /api/v1/auth/apply-host` — Client requests Host role; creates application.

### User

- `POST /api/v1/user/create-client` — multipart `file` + `data` JSON; creates Client with profile; email unique check; uploads avatar.
- `PATCH /api/v1/user/update-my-profile` — multipart optional `file` + `data`; merges interests, updates profile, replaces image.
- `POST /api/v1/user/send-email` — contact form to admin (name, email, contactNumber, subject, message); sends via Nodemailer/EJS.

### Admin

- `GET /api/v1/admin/host-applications` — list host applications with filters (status, searchTerm, pagination).
- `PATCH /api/v1/admin/host-applications/:id/approve|reject` — approve/reject host application; toggles Host status and user role.
- `GET /api/v1/admin/event-applications` — list pending/filtered events for approval.
- `PATCH /api/v1/admin/event-application/:id/approve|reject` — approve/reject event; sets status accordingly.
- `GET /api/v1/admin/clients` — list clients with status/search filters.
- `GET /api/v1/admin/hosts` — list hosts with status/search filters.
- `PATCH /api/v1/admin/suspend-user/:userId` — suspend user (affects auth/visibility).
- `PATCH /api/v1/admin/unsuspend-user/:userId` — reverse suspension.

### Host

- `POST /api/v1/host/create-event` — multipart `file` + `data`; creates event with banner; status PENDING until approved.
- `PATCH /api/v1/host/event/:eventId` — update event fields; optional new banner; respects ownership and status rules.
- `DELETE /api/v1/host/event/:eventId` — delete own event if allowed by status.
- `GET /api/v1/host/my-hosted-events` — paginated, filterable list of host’s events.
- `PATCH /api/v1/host/event-complete/:eventId` — mark event COMPLETED; triggers review eligibility.

### Event (public/client)

- `GET /api/v1/event/all-events` — searchTerm, category, date filters; excludes past dates; interest-weighted ordering for signed-in users.
- `GET /api/v1/event/:eventId` — single event detail with host info and availability.
- `POST /api/v1/event/join/:eventId` — client joins, creates participant + pending payment, generates SSLCommerz session.
- `POST /api/v1/event/leave/:eventId` — client leaves before event date; frees seat; updates participant/payment state.
- `GET /api/v1/event/my-events` — client’s joined events with participantStatus/date/search filters; paginated with totals.
- `GET /api/v1/event/participants/:eventId` — host/admin view participants; includes review flags and payment status.
- `GET /api/v1/event/recent-events` — latest 6 future OPEN events for landing.

### Payments

- `GET /api/v1/payment` — list payments with search/pagination/sort; role-scoped (admin all, host own events).
- `POST /api/v1/payment/success|fail|cancel` (SSLCommerz IPN callbacks) — updates PaymentStatus and event capacity/status.
- `POST /api/v1/payment/validate` (if exposed) — validation hit from SSLCommerz; finalizes payment.

### Review

- `POST /api/v1/review/:transactionId` — client review for a completed, paid event; prevents duplicates; updates host rating.
- `GET /api/v1/review` — latest 20 reviews for landing display.

### Meta

- `GET /api/v1/meta` — auth dashboards (counts for admin/host/client depending on role).
- `GET /api/v1/meta/landing-page` — public landing stats (events, payments, clients, hosts, reviews, avg rating).

---

## Notable Behaviors

- Event listings exclude past-date events; recent events endpoint returns 6.
- Capacity and status are kept consistent inside Prisma transactions.
- Payments are role-scoped (admin sees all; host sees own events only).
- Reviews allowed only for paid, completed events; duplicates blocked.
- Contact form emails go to admin using `contact-email.ejs`.
- once you join a event you can leave any time until the event ends but if you leave no refund policy is kept

---

## Deployment

- Designed to run on Vercel/Node with a managed Postgres
- Run `npx prisma generate` after deploying or changing the schema.

---
