# Stretch issues: supplier

Pick one when your spec is done and merged. Each is one loop (issue, branch, PR).

## 1. Carrier on the shipment

Add `carrier : String(30)` to `Shipments`; `ship(carrier)` takes it as an action parameter and requires it (`400` when missing). Include it in the `TireShipped` payload as an extra field (the garage ignores it).

## 2. Ignore duplicates

If `TireManufactured` arrives twice for the same `orderId`, do not create a second shipment. Test it.

## 3. Pending shipments per garage

Unbound function `pendingFor(garageId)` returning the number of `Pending` shipments for that garage. Test through HTTP.
