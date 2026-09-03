# Add Customers and Bookings with the BookingService at /booking

## Goal

The placeholder hello world is gone. `GET /booking/Customers` lists two seeded customers and
`POST /booking/Bookings` creates a booking in status `Created` that can be read back at
`GET /booking/Bookings(<ID>)`.

## Context

`specs/booking.md`, sections "Entities" and the first three rows of "Endpoints". Replaces the
namespace `workshop`, the entity `Greetings` and `HelloService` with the `booking` namespace,
`Customers`, `Bookings` and `BookingService` at `@path: '/booking'`.

Both entities use the `cuid` aspect. `Bookings.status` is `String(20) enum { Created;
ReadyForSwap; Done; } default 'Created'`, `tireSpec` is `String(50) not null`, `garageId` is
`String(20) not null`, `customer` is an optional association to `Customers`. Seed only the
customers, from `db/data/booking-Customers.csv` with separator `;`. No events and no action in this
issue, they follow in #20 to #40.

## Acceptance criteria

- [ ] `GET /booking/Customers` returns the two seeded customers
- [ ] `POST /booking/Bookings` with `{ tireSpec, garageId }` returns `201` with a generated `ID` and
      `status: 'Created'`
- [ ] `GET /booking/Bookings(<ID>)` returns the booking that was just created
- [ ] `GET /booking/Bookings` lists the created booking
- [ ] no file in the repo mentions `Greetings`, `HelloService` or the `workshop` namespace any more

## Files likely touched

- `db/schema.cds`
- `db/data/booking-Customers.csv` (new), `db/data/workshop-Greetings.csv` (deleted)
- `srv/booking-service.cds`, `srv/booking-service.ts` (renamed from `hello-service.*`)
- `test/booking.test.ts` (renamed from `hello.test.ts`)

## Done when

- [ ] tests cover every acceptance criterion
- [ ] `npm run check` green, hook passed
- [ ] PR opened with a `curl` example, reviewed by the other pair, merged
