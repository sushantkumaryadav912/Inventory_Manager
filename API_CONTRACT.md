# API Contract (Canonical)

This document is the single source of truth for the mobile app  backend HTTP contract.

## Base URL
- **No global prefix** (no `/api`, no `/v1`).
- Base URL is the Render service URL (or local `http://localhost:3000`).

## Required Headers
- `Authorization: Bearer <accessToken>`
- `x-shop-id: <shopId>`

## Error Shape (all non-2xx)
Backend returns:
```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Validation failed",
  "fieldErrors": {
    "items.0.productId": "Invalid UUID"
  },
  "path": "/purchases",
  "method": "POST",
  "timestamp": "2026-01-11T00:00:00.000Z",
  "requestId": "..."
}
```
- `fieldErrors` is present only for validation failures.

## Inventory
### `POST /inventory` (OWNER/MANAGER)
Request:
```json
{
  "name": "Tomatoes",
  "sku": "TOM-001",
  "category": "Vegetables",
  "description": "Optional",
  "quantity": 10,
  "unit": "piece",
  "costPrice": 12.5,
  "sellingPrice": 18.0,
  "reorderLevel": 5
}
```
Response: **201**
```json
{ "item": { "id": "<productId>", "name": "...", "sku": "...", "quantity": 10 } }
```

### `PATCH /inventory/:itemId` (OWNER/MANAGER)
Same fields as create, all optional.

### `DELETE /inventory/:itemId` (OWNER/MANAGER)
Response:
```json
{ "success": true }
```

## Purchases
### `POST /purchases` (OWNER/MANAGER)
Request:
```json
{
  "supplierId": "<uuid>",
  "items": [
    { "productId": "<uuid>", "quantity": 2, "costPrice": 12.5 }
  ]
}
```
Response:
```json
{ "purchaseId": "<uuid>", "totalCost": 25, "itemCount": 1 }
```

## Sales
### `POST /sales` (OWNER/MANAGER/STAFF)
Request:
```json
{
  "customerId": "<uuid>",
  "paymentMethod": "CASH",
  "items": [
    { "productId": "<uuid>", "quantity": 1, "sellingPrice": 18 }
  ]
}
```
Response:
```json
{ "saleId": "<uuid>", "totalAmount": 18, "itemCount": 1 }
```

## Auth
### `POST /auth/logout`
- Accepts **no body**.
- Response: **204 No Content**.
