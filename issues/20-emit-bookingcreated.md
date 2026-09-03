# Emit BookingCreated after a booking is created

## Goal

Creating a booking publishes the outbound event of the chain: `POST /booking/Bookings` emits
`BookingCreated` with `{ bookingId, tireSpec, garageId }`, which is what manufacturing listens for.

## Context

`specs/booking.md`, section "Events", row `out`. Builds on #10, which already creates bookings.

Low-level messaging only: `const messaging = await cds.connect.to('messaging')` in `init()`, then
`messaging.emit('BookingCreated', { bookingId, tireSpec, garageId })`. Emit from an
`after('CREATE', Bookings, ...)` handler so the row exists and the outbox delivers on commit. In
CAP 10 the first argument of an after-CREATE handler holds only the keys, so read the full row from
`req.data`. The event name and the three payload fields are the contract with the other services,
do not rename or add fields.

## Acceptance criteria

- [ ] a `POST /booking/Bookings` emits exactly one `BookingCreated`
- [ ] the payload is exactly `{ bookingId, tireSpec, garageId }`, with `bookingId` equal to the `ID`
      of the created booking
- [ ] the create and read tests from #10 still pass unchanged

## Files likely touched

- `srv/booking-service.ts`
- `test/booking.test.ts`

## Done when

- [ ] tests cover every acceptance criterion, the outbound event is asserted by subscribing with
      `messaging.on('BookingCreated', ...)` before the POST
- [ ] `npm run check` green, hook passed
- [ ] PR opened with a `curl` example, reviewed by the other pair, merged
