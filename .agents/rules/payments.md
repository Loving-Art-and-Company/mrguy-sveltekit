---
paths:
  - "src/routes/api/payments/**"
  - "src/routes/book/**"
  - "src/routes/checkout/**"
---

# Stripe Payments

- Stripe Checkout (redirect, not embedded)
- Webhook at `/api/payments/webhook`
- Verify webhook signatures
- Use idempotency keys for payment operations
- Never store card data

## Environment Variables
```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PUBLIC_STRIPE_KEY=
```
