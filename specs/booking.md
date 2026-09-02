# Spec: booking service

Start and end of the chain. A customer books a tire swap; the chain manufactures and delivers the tire; the booking becomes `ReadyForSwap`; the customer comes in and the swap is confirmed.

Port `4004`, OData path `/booking`.

## Entities

**Customers**

| Field | Type        | Notes    |
| ----- | ----------- | -------- |
| ID    | UUID        | key      |
| name  | String(100) | required |
| email | String(200) |          |

Seed two customers from a CSV so the demo can create bookings right away.

**Bookings**

| Field    | Type                     | Notes                                       |
| -------- | ------------------------ | ------------------------------------------- |
| ID       | UUID                     | key                                         |
| customer | Association to Customers | optional                                    |
| tireSpec | String(50)               | required, e.g. `205/55 R16 winter`          |
| garageId | String(20)               | required, e.g. `GAR-01`                     |
| status   | String(20) enum          | `Created` (default), `ReadyForSwap`, `Done` |

## Endpoints

| Method | Path                                                 | Behaviour                                                                                        |
| ------ | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| GET    | `/booking/Customers`                                 | list                                                                                             |
| GET    | `/booking/Bookings`, `/booking/Bookings(<ID>)`       | list, read one                                                                                   |
| POST   | `/booking/Bookings`                                  | creates a booking in status `Created`, then emits `BookingCreated`                               |
| POST   | `/booking/Bookings(<ID>)/BookingService.confirmSwap` | bound action. Allowed only in `ReadyForSwap`, sets `Done`, returns the booking. Otherwise `409`. |

## Events

| Direction | Event            | Payload                             | When                                                                                |
| --------- | ---------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| out       | `BookingCreated` | `{ bookingId, tireSpec, garageId }` | after a booking is created                                                          |
| in        | `TireDelivered`  | `{ bookingId, garageId }`           | sets the booking to `ReadyForSwap`. Unknown bookingId: log a warning, do not crash. |

## Acceptance criteria

- [ ] `POST /booking/Bookings` with `tireSpec` and `garageId` returns `201` with `status: "Created"` and a generated `ID`
- [ ] the same POST emits `BookingCreated` with exactly `{ bookingId, tireSpec, garageId }`
- [ ] `GET /booking/Bookings` lists bookings; `GET /booking/Customers` lists the seeded customers
- [ ] an inbound `TireDelivered` for a known booking sets it to `ReadyForSwap`
- [ ] `confirmSwap` on a `ReadyForSwap` booking returns it with `status: "Done"`
- [ ] `confirmSwap` on a `Created` booking answers `409`
- [ ] all of the above covered by tests, `npm run check` green

## Out of scope

Authentication, cancellation, dates and time slots, real customers. Stretch ideas live in `issues/90-*` in your repo.
