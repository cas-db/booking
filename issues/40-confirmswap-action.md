# Add the confirmSwap action to Bookings

## Goal

The chain has an end: `POST /booking/Bookings(<ID>)/BookingService.confirmSwap` on a booking in
`ReadyForSwap` sets it to `Done` and returns it. In any other state it answers `409`, for an unknown
ID `404`.

## Context

`specs/booking.md`, last row of "Endpoints". Builds on #30, which is what gets a booking into
`ReadyForSwap` in the first place.

Model it as a bound action on the projection: `entity Bookings as projection on db.Bookings actions
{ action confirmSwap() returns Bookings; }`. Handle it with `this.on('confirmSwap', Bookings,
async (req) => ...)`: read the row through `SELECT.one.from(req.subject)`, `req.reject(404, ...)`
when it is missing, `req.reject(409, ...)` when the status is not `ReadyForSwap`, otherwise update
to `Done` and return the updated row. Do not name a method on the service class `confirmSwap`, CAP
10 would register it as the action handler with different arguments.

## Acceptance criteria

- [ ] `confirmSwap` on a booking in `ReadyForSwap` returns the booking with `status: 'Done'`
- [ ] `confirmSwap` on a booking in `Created` answers `409` and leaves the status at `Created`
- [ ] `confirmSwap` on a booking already in `Done` answers `409`
- [ ] `confirmSwap` on an unknown ID answers `404`

## Files likely touched

- `srv/booking-service.cds`, `srv/booking-service.ts`
- `test/booking.test.ts`

## Done when

- [ ] tests cover every acceptance criterion, the `ReadyForSwap` case is reached by emitting
      `TireDelivered` first
- [ ] `npm run check` green, hook passed
- [ ] PR opened with a `curl` example, reviewed by the other pair, merged
