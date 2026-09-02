# Stretch issues: garage

Pick one when your spec is done and merged. Each is one loop (issue, branch, PR).

## 1. Consume stock at the swap

Listen to `BookingDone { bookingId, garageId, tireSpec }` (the booking pair's stretch issue emits it) and decrement `Stock` by one. Test it by emitting the event in the test.

## 2. Stock validation

`quantity` can never go below 0 and `garageId` + `tireSpec` must be unique. Reject with `400`. Tests for both.

## 3. Low stock event

When a `Stock` row drops to 0 (or is created with 0), emit `StockLow { garageId, tireSpec }`. Test the emission.
