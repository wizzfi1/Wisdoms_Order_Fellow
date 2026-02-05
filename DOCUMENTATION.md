# My Order Fellow — API Documentation

This document provides practical, end-to-end documentation for the **My Order Fellow** backend MVP. It is intended for reviewers, testers, and developers who want to understand how the system works and how to interact with it.

The API is designed around a simple but realistic SaaS workflow: company onboarding, admin approval, secured webhooks for order tracking, and customer-facing order lookup.

---

## 1. System Overview

My Order Fellow is a backend service that enables companies to track customer orders in real time using webhook integrations.

High-level flow:

1. A company registers and verifies its email using an OTP
2. The company submits KYC information
3. An admin reviews and approves the company
4. Approved companies send orders via a secured webhook
5. Order status updates are pushed via webhooks
6. Customers can query order details and full tracking history
7. Email notifications are sent on key events

---

## 2. Authentication & Onboarding Flow

### 2.1 Register Company

Registers a new company account.

**Endpoint**

```
POST /auth/register
```

**Request Body**

```json
{
  "company_name": "wizzo Shop",
  "business_email": "Wizzymoney@example.com",
  "password": "secret123"
}
```

**Behavior**

* Password is hashed using bcrypt
* An OTP is generated and emailed to the company
* Company is created with `email_verified = false`

---

### 2.2 Verify Email (OTP)

Verifies the company’s email address.

**Endpoint**

```
POST /auth/verify-otp
```

**Request Body**

```json
{
  "business_email": "wizzymoney@example.com",
  "otp_code": "123456"
}
```

**Behavior**

* OTP is validated and expiry is checked
* Email is marked as verified

---

## 3. KYC Flow

### 3.1 Submit KYC

Submits KYC information for a verified company.

**Endpoint**

```
POST /kyc/submit
```

**Request Body**

```json
{
  "business_email": "wizzymoney@example.com",
  "business_registration_number": "CAC-839201",
  "business_address": "12 Allen Avenue, Lagos",
  "contact_person_name": "Wisdom Shaib",
  "contact_person_phone": "+2348012345678"
}
```

**Behavior**

* KYC details are stored
* KYC status is set to `pending`

---

## 4. Admin Actions

Admin endpoints are protected using a static secret header for MVP simplicity.

### 4.1 Approve KYC

Approves a company’s KYC.

**Endpoint**

```
POST /admin/kyc/:company_id/approve
```

**Headers**

```
x-admin-secret: <ADMIN_SECRET>
```

**Behavior**

* Company KYC status is set to `approved`
* Approved companies are allowed to send webhooks

---

### 4.2 Reject KYC

Rejects a company’s KYC.

**Endpoint**

```
POST /admin/kyc/:company_id/reject
```

**Headers**

```
x-admin-secret: <ADMIN_SECRET>
```

---

## 5. Webhook Integration

All webhook endpoints are protected using a shared secret header.

```
x-webhook-secret: <WEBHOOK_SECRET>
```

---

### 5.1 Order Intake Webhook

Creates a new order and initializes tracking.

**Endpoint**

```
POST /webhooks/orders
```

**Request Body**

```json
{
  "external_order_id": "ORD-1001",
  "customer_name": "Wisdom Shaib",
  "customer_email": "wizzymoney@example.com",
  "delivery_address": "15 Alimosho Way, Ipaja",
  "item_summary": "2x Shoes, 1x Bag",
  "initial_status": "PENDING",
  "business_email": "wizzymoney@example.com"
}
```

**Rules**

* Company must exist
* Company KYC must be approved
* Duplicate order IDs are rejected
* Initial status event is created

---

### 5.2 Status Update Webhook

Pushes tracking status updates for an order.

**Endpoint**

```
POST /webhooks/status-updates
```

**Request Body**

```json
{
  "external_order_id": "ORD-1001",
  "new_status": "IN_TRANSIT",
  "note": "Package left Lagos hub"
}
```

**Supported Statuses**

```
PENDING → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
```

**Rules**

* Status transitions must follow the defined order
* Skipping or reversing states is not allowed
* Each update is recorded as a status event

---

## 6. Order Lookup API

### 6.1 Get Order Details

Fetches full order details and tracking history.

**Endpoint**

```
GET /orders/:external_order_id
```

**Response Example**

```json
{
  "order_id": "ORD-1001",
  "customer": {
    "name": "Wisdom Shaib",
    "email": "wizzymoney@example.com"
  },
  "delivery_address": "15 Alimosho way, Ipaja",
  "item_summary": "2x Shoes, 1x Bag",
  "current_status": "DELIVERED",
  "created_at": "2026-01-20T15:29:23.155Z",
  "status_history": [
    {
      "status": "PENDING",
      "note": "Tracking activated",
      "timestamp": "2026-01-20T15:29:23.168Z"
    },
    {
      "status": "IN_TRANSIT",
      "note": "Package left Lagos hub",
      "timestamp": "2026-01-20T15:42:49.798Z"
    }
  ]
}
```

---

## 7. Notifications

Email notifications are delivered using **Resend**, an HTTPS-based email API.

Notifications are sent **asynchronously** so that email delivery does not delay or interrupt core API flows.

Notifications are triggered on:

* OTP generation
* Tracking activation
* Order status updates

The notification logic is isolated in a service layer, allowing the email provider to be swapped or mocked without changing route logic.

> **Note on email delivery:** Email providers require sender domain verification to deliver messages to arbitrary recipients. In this MVP, verified addresses are used for testing. Full delivery can be enabled via configuration without code changes.


## 8. Rate Limiting

Rate limiting is applied to webhook endpoints to prevent abuse and accidental flooding.

---

## 9. Error Handling

The API uses standard HTTP status codes:

* `400` — Invalid request or business rule violation
* `401` — Unauthorized (invalid secrets)
* `403` — Forbidden (KYC not approved)
* `404` — Resource not found
* `409` — Conflict (duplicate resources)
* `500` — Internal server error

Error responses are returned in JSON format:

```json
{ "error": "Descriptive error message" }
```

---

## 10. Design Principles

* Single-service MVP for clarity and defensibility
* Explicit business rules enforced at the API level
* Plain SQL for transparency
* No background workers or queues
* Minimal but realistic security model

---

## 11. Using the Postman Collection

A Postman collection is provided to demonstrate and test the full API workflow.

Recommended usage:

1. Import the collection
2. Set environment variables (`base_url`, secrets)
3. Run requests in logical order
4. Observe automated variable handling and email notifications

---

## 12. Conclusion

This documentation describes a complete, defensible backend MVP focused on correctness, clarity, and real-world workflows. The system is intentionally simple while remaining extensible for future growth.
