# PLAN: booking service

Derived from `specs/booking.md` and `AGENTS.md`. The booking service is the start and the end of
the chain: a customer books a tire swap, the chain manufactures and delivers the tire, the booking
becomes `ReadyForSwap`, the customer comes in and the swap is confirmed.

OData path `/booking`, port `4004`, sqlite in-memory, events over CAP messaging.

## Domain model

Namespace `booking` in `db/schema.cds`, both entities use the `cuid` aspect.

**Customers**

| Field | Type        | Notes    |
| ----- | ----------- | -------- |
| ID    | UUID        | key      |
| name  | String(100) | required |
| email | String(200) |          |

Seeded from `db/data/booking-Customers.csv` with two rows so the demo can create bookings right
away.

**Bookings**

| Field    | Type                     | Notes                                       |
| -------- | ------------------------ | ------------------------------------------- |
| ID       | UUID                     | key                                         |
| customer | Association to Customers | optional                                    |
| tireSpec | String(50)               | required, e.g. `205/55 R16 winter`          |
| garageId | String(20)               | required, e.g. `GAR-01`                     |
| status   | String(20) enum          | `Created` (default), `ReadyForSwap`, `Done` |

Status changes only through the inbound event and the bound action, never through PATCH.

## Endpoints

| Method | Path                                                 | Behaviour                                                                                       |
| ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/booking/Customers`                                 | list the seeded customers                                                                       |
| GET    | `/booking/Bookings`, `/booking/Bookings(<ID>)`       | list, read one                                                                                  |
| POST   | `/booking/Bookings`                                  | creates a booking in status `Created`, then emits `BookingCreated`                              |
| POST   | `/booking/Bookings(<ID>)/BookingService.confirmSwap` | bound action, allowed only in `ReadyForSwap`, sets `Done`, returns the booking, otherwise `409` |

## Events

Low-level messaging only, no `event` declarations in CDS. Names and payload fields are the contract
with the other services and are copied from the spec verbatim.

| Direction | Event            | Payload                             | When                                                                                    |
| --------- | ---------------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| out       | `BookingCreated` | `{ bookingId, tireSpec, garageId }` | after a booking is created, emitted from an `after('CREATE')` handler                   |
| in        | `TireDelivered`  | `{ bookingId, garageId }`           | sets the booking to `ReadyForSwap`, unknown bookingId logs a warning and does not crash |

`messaging.on('TireDelivered', ...)` is registered inside `init()`, before the server listens.

## Build order

Every step leaves the service runnable and `npm run check` green.

1. **Issue 10, domain model and read/write endpoints.** Replace the placeholder `Greetings` entity
   and `HelloService` with the `booking` namespace, `Customers` and `Bookings`, `BookingService` at
   `/booking`, and the customer seed CSV. No events, no action yet. This is the foundation
   everything else hangs off.
2. **Issue 20, outbound `BookingCreated`.** The create endpoint from step 1 now also emits. Pure
   addition to an existing, tested handler.
3. **Issue 30, inbound `TireDelivered`.** The first status transition, `Created` to `ReadyForSwap`.
   Needs the entity from step 1 but not the event from step 2, so it could also run in parallel.
4. **Issue 40, `confirmSwap` action.** The end of the chain, `ReadyForSwap` to `Done`, with `409`
   and `404`. Needs step 3 to be able to reach `ReadyForSwap` through the front door in the test.

## What each step needs in tests

All tests go to `test/booking.test.ts`, run the real server in-process with `cds.test('.')` and
assert over HTTP with `node:assert/strict`.

**Step 1**

- `GET /booking/Customers` returns the two seeded rows
- `POST /booking/Bookings` with `tireSpec` and `garageId` returns `201`, a generated `ID` and
  `status: 'Created'`
- `GET /booking/Bookings(<ID>)` reads that booking back
- `GET /booking/Bookings` lists it

**Step 2**

- subscribe with `messaging.on('BookingCreated', ...)` before the POST, then assert the payload is
  exactly `{ bookingId, tireSpec, garageId }` with the id of the created row
- the existing create test from step 1 still passes

**Step 3**

- emit `TireDelivered` in the test with `messaging.emit('TireDelivered', { bookingId, garageId })`,
  then read the booking back and assert `status: 'ReadyForSwap'`
- emit `TireDelivered` for an unknown bookingId and assert the server stays up, a following `GET`
  still answers

**Step 4**

- `confirmSwap` on a `ReadyForSwap` booking returns the booking with `status: 'Done'`
- `confirmSwap` on a freshly created `Created` booking rejects with `409`
- `confirmSwap` on an unknown ID rejects with `404`

## Out of scope

Authentication, cancellation, dates and time slots, real customers. Stretch ideas live in
`issues/90-stretch-booking.md`.
