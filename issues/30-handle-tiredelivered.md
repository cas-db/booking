# Set a booking to ReadyForSwap on inbound TireDelivered

## Goal

When the garage reports a delivered tire, the booking is ready for the customer: an inbound
`TireDelivered` event with `{ bookingId, garageId }` moves that booking from `Created` to
`ReadyForSwap`.

## Context

`specs/booking.md`, section "Events", row `in`. Builds on #10.

Subscribe with `messaging.on('TireDelivered', async (msg) => ...)` inside `init()`, before the
server starts listening, and narrow `msg.data` to a named shape instead of `any`. Update with
`UPDATE.entity(Bookings, bookingId).with({ status: 'ReadyForSwap' })`. An unknown `bookingId` must
only log a warning, the handler must not throw and must not take the server down. Event handlers
have no HTTP request, so there is no `req.reject` here.

## Acceptance criteria

- [ ] an inbound `TireDelivered` for a known booking sets its `status` to `ReadyForSwap`, verified
      by reading the booking back over HTTP
- [ ] an inbound `TireDelivered` for an unknown `bookingId` does not throw and the server keeps
      answering a following `GET /booking/Bookings`
- [ ] bookings not addressed by the event keep their status

## Files likely touched

- `srv/booking-service.ts`
- `test/booking.test.ts`

## Done when

- [ ] tests cover every acceptance criterion, the inbound event is triggered from the test with
      `messaging.emit('TireDelivered', { bookingId, garageId })`
- [ ] `npm run check` green, hook passed
- [ ] PR opened with a `curl` example, reviewed by the other pair, merged
