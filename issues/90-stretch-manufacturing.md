# Stretch issues: manufacturing

Pick one when your spec is done and merged. Each is one loop (issue, branch, PR).

## 1. Ignore duplicates

If `BookingCreated` arrives twice for the same `bookingId` (it happens with file-based messaging), do not create a second order. Test it.

## 2. Emit `ProductionStarted`

Add a bound action `start()` (`Open` to `InProduction`) and let `finish` require `InProduction`. Emit `ProductionStarted { bookingId, orderId }`. Update the status enum and the tests.

## 3. Order statistics function

Unbound function `stats()` returning `{ open, finished }` counts. Test it through HTTP (`GET /manufacturing/stats()`).
