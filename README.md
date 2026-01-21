# My Order Fellow — Backend MVP

A simplified SaaS backend for real-time order tracking via webhooks.

This project implements the full My Order Fellow spec as a **defensible MVP**: companies onboard via email + OTP + KYC, get approved by an admin, then send order and tracking updates through secured webhooks. Customers receive notifications and can query order status history.

---

## 🚀 Features

### Authentication & Onboarding

* Company registration (email + password)
* Password hashing with bcrypt
* Email verification via OTP (mocked)
* KYC submission
* Admin KYC approval / rejection

### Webhook Order Intake

* Secured webhook endpoint using shared secret
* Order ingestion via webhook
* KYC gating (only approved companies can send orders)
* Tracking initialization
* Status history creation

### Tracking Status Updates

* Webhook-based status updates
* Supported statuses: `PENDING`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`
* Status transition validation
* Audit trail stored in database

### Notifications

* Mock email notifications (console logs)
* Triggered on:

  * OTP generation
  * Tracking activation
  * Status updates

### Order Lookup API

* Fetch order details by order ID
* Returns:

  * Customer name & email
  * Delivery address
  * Item summary
  * Current status
  * Full status history

### Security

* Hashed passwords
* Webhook secret authentication
* Admin secret authentication
* Rate limiting on webhook endpoints

---

## 🧱 Tech Stack

* Node.js
* Express
* PostgreSQL
* bcrypt
* dotenv
* express-rate-limit

No ORMs. No microservices. No background workers.

---

## 🗂️ Project Structure

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

## ⚙️ Setup Instructions

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

```
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=wisdoms_order_fellow

WEBHOOK_SECRET=supersecretkey
ADMIN_SECRET=admin123
```

---

### 4) Create Database

```sql
CREATE DATABASE wisdoms_order_fellow;
```

---

### 5) Create Tables

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

### 6) Run the server

```bash
node src/app.js
```

You should see:

```
Server listening on port 3000
Connected to Postgres
```

---

## 📌 API Endpoints

### Authentication

#### Register company

```
POST /auth/register
```

```json
{
  "company_name": "Acme Shop",
  "business_email": "acme@example.com",
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
  "business_email": "acme@example.com",
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
  "business_email": "acme@example.com",
  "business_registration_number": "RC-839201",
  "business_address": "12 Allen Avenue, Lagos",
  "contact_person_name": "John Manager",
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
x-admin-secret: admin123
```

---

#### Reject KYC

```
POST /admin/kyc/:company_id/reject
```

Header:

```
x-admin-secret: admin123
```

---

### Webhooks

#### Order intake

```
POST /webhooks/orders
```

Headers:

```
x-webhook-secret: supersecretkey
```

```json
{
  "external_order_id": "ORD-1001",
  "customer_name": "Jane Doe",
  "customer_email": "jane@example.com",
  "delivery_address": "15 Admiralty Way, Lekki",
  "item_summary": "2x Shoes, 1x Bag",
  "initial_status": "PENDING",
  "business_email": "acme@example.com"
}
```

---

#### Status updates

```
POST /webhooks/status-updates
```

Headers:

```
x-webhook-secret: supersecretkey
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

## 🧠 Design Decisions

* **Single-service MVP**: No microservices or background workers
* **Plain SQL**: Avoided ORMs to keep logic explicit
* **Mock notifications**: Email sending is console-logged
* **Simple admin auth**: Static secret header
* **Rate limiting**: Applied only to webhook endpoints
* **Minimal data model**: No premature normalization

---

## 🔮 Future Improvements

* Replace mock notifications with SMTP or SendGrid
* Add login and JWT authentication
* Add admin dashboard UI
* Introduce job queue for async email sending
* Add multi-tenant isolation
* Improve status transition rules

---

## 🏁 Summary

This project demonstrates:

* SaaS onboarding workflows
* Secure webhook design
* Event-driven backend logic
* Status tracking systems
* API design
* Security best practices

It was intentionally scoped as a **defensible MVP** to focus on backend fundamentals rather than infrastructure complexity.

---

Built with purpose, clarity, and craftsmanship.
