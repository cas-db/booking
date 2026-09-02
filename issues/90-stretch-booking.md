# Stretch issues: booking

Pick one when your spec is done and merged. Each is one loop (issue, branch, PR).

## 1. Validate the booking input

`tireSpec` must match `<width>/<ratio> R<rim> <season>` (e.g. `205/55 R16 winter`) and `garageId` must look like `GAR-<two digits>`. Reject with `400` and a readable message. Tests for one good and two bad inputs.

## 2. Emit `BookingDone`

When `confirmSwap` succeeds, emit `BookingDone { bookingId, garageId, tireSpec }`. Nobody consumes it yet; the point is the outbound event path and its test.

## 3. `GET /booking/Bookings?$filter=status eq 'ReadyForSwap'` plus a `cancel` action

Add a bound action `cancel()` allowed in `Created` only, status `Cancelled`. Think about what the rest of the chain should do with a cancelled booking and write it down in the PR (no need to build it).
