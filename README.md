# My Order Fellow — Backend MVP

A simplified SaaS backend for real-time order tracking via webhooks.

This project implements the full **My Order Fellow** specification as a **defensible backend MVP**. Companies onboard via email, OTP verification, and KYC; admins approve companies; approved companies send orders and tracking updates through secured webhooks. Customers receive real email notifications and can query full order status history.

---

## Features

### Authentication & Onboarding

* Company registration (email + password)
* Password hashing with bcrypt
* Email verification via OTP (**real email delivery via Resend API**)
* KYC submission
* Admin KYC approval / rejection

### Webhook Order Intake

* Secured webhook endpoint using shared secret
* Order ingestion via webhook
* KYC gating (only approved companies can send orders)
* Tracking initialization on order creation
* Initial status event creation

### Tracking Status Updates

* Webhook-based status updates
* Supported statuses: `PENDING`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`
* Strict status transition enforcement (no skipping or rollback)
* Full audit trail stored in the database

### Notifications

* Real email notifications via **Resend (HTTPS-based email API)**
* Triggered on:

  * OTP generation
  * Tracking activation
  * Status updates

> Notification logic is isolated in a service layer, allowing providers to be swapped or mocked without changing route logic.

> Domain verification is required by email providers to deliver messages to arbitrary recipients. This MVP uses verified addresses for testing without requiring code changes.

### Order Lookup API

* Fetch order details by external order ID
* Returns:

  * Customer name & email
  * Delivery address
  * Item summary
  * Current status
  * Full status history (chronological)

### Security

* Hashed passwords
* Webhook secret authentication
* Admin secret authentication
* Rate limiting on webhook endpoints

---

## Tech Stack

* Node.js
* Express
* PostgreSQL
* bcrypt
* dotenv
* resend
* express-rate-limit


---

## Project Structure

```
src/
  app.js
  db.js

  routes/
    auth.js
    kyc.js
    admin.js
    webhooks.js
    orders.js

  services/
    notifications.js
```

---

## Setup Instructions

### 1) Clone the repo

```bash
git clone <repo-url>
cd my-order-fellow
```

---

### 2) Install dependencies

```bash
npm install
```

---

### 3) Create `.env`

```env
PORT=3000

DATABASE_URL=postgres://user:password@host:5432/wisdoms_order_fellow

WEBHOOK_SECRET=<WEBHOOK_SECRET>
ADMIN_SECRET=<ADMIN_SECRET>

RESEND_API_KEY=re_xxxxxxxxx
EMAIL_FROM=My Order Fellow <onboarding@resend.dev>
```

---

### 4) Create Tables

```sql
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  business_email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  otp_code TEXT,
  otp_expires_at TIMESTAMP,
  kyc_status TEXT DEFAULT 'pending',
  business_registration_number TEXT,
  business_address TEXT,
  contact_person_name TEXT,
  contact_person_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  external_order_id TEXT UNIQUE NOT NULL,
  company_id INTEGER REFERENCES companies(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  delivery_address TEXT,
  item_summary TEXT,
  current_status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE status_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  status TEXT NOT NULL,
  note TEXT,
  timestamp TIMESTAMP NOT NULL
);
```

---

### 5) Run the server

```bash
node src/app.js
```

Expected output:

```
Server listening on port 3000
Connected to Postgres
```

---

## API Endpoints

### Authentication

#### Register company

```
POST /auth/register
```

```json
{
  "company_name": "wizzo Shop",
  "business_email": "wizzymoney@example.com",
  "password": "secret123"
}
```

---

#### Verify OTP

```
POST /auth/verify-otp
```

```json
{
  "business_email": "wizzymoney@example.com",
  "otp_code": "123456"
}
```

---

### KYC

#### Submit KYC

```
POST /kyc/submit
```

```json
{
  "business_email": "wizzymoney@example.com",
  "business_registration_number": "RC-839201",
  "business_address": "12 Allen Avenue, Lagos",
  "contact_person_name": "Wisdom Shaib",
  "contact_person_phone": "+2348012345678"
}
```

---

### Admin

#### Approve KYC

```
POST /admin/kyc/:company_id/approve
```

Header:

```
x-admin-secret: <ADMIN_SECRET>
```

---

#### Reject KYC

```
POST /admin/kyc/:company_id/reject
```

Header:

```
x-admin-secret: <ADMIN_SECRET>
```

---

### Webhooks

#### Order intake

```
POST /webhooks/orders
```

Headers:

```
x-webhook-secret: <WEBHOOK_SECRET>
```

```json
{
  "external_order_id": "ORD-1001",
  "customer_name": "Wisdom Shaib",
  "customer_email": "wizz@example.com",
  "delivery_address": "15 Alimosho Way, Ipaja",
  "item_summary": "2x Shoes, 1x Bag",
  "initial_status": "PENDING",
  "business_email": "wizzymoney@example.com"
}
```

---

#### Status updates

```
POST /webhooks/status-updates
```

Headers:

```
x-webhook-secret: <WEBHOOK_SECRET>
```

```json
{
  "external_order_id": "ORD-1001",
  "new_status": "IN_TRANSIT",
  "note": "Package left Lagos hub"
}
```

---

### Orders

#### Get order details

```
GET /orders/:external_order_id
```

---

## Design Decisions

* **Single-service MVP** — avoids premature architectural complexity
* **Plain SQL** — keeps business logic explicit and reviewable
* **Service-layer notifications** — enables provider swapping without route changes
* **Strict status lifecycle enforcement** — prevents invalid state transitions
* **Static admin authentication** 

---

## Future Improvements

* Replace static admin secret with role-based auth
* Add JWT-based company authentication
* Introduce async job queue for notifications
* Add admin dashboard UI
* Support multi-tenant isolation
* Expand order lifecycle (CANCELLED, FAILED)

---

## Summary

This project demonstrates:

* SaaS onboarding workflows
* Secure webhook design
* Stateful order tracking systems
* Event-driven backend logic
* Real email integration via API-based providers
* Defensive API design

It was intentionally scoped as a **defensible MVP** to emphasize backend fundamentals, correctness, and clarity over infrastructure complexity.

---
