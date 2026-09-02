# Spec: garage service

Receives tires, keeps stock, and closes the chain by telling the booking service that the tire is here.

Port `4007`, OData path `/garage`.

## Entities

**Deliveries**

| Field     | Type            | Notes                             |
| --------- | --------------- | --------------------------------- |
| ID        | UUID            | key                               |
| bookingId | UUID            | required, from the event          |
| tireSpec  | String(50)      | required                          |
| garageId  | String(20)      | required                          |
| status    | String(20) enum | `InTransit` (default), `Received` |

**Stock**

| Field    | Type       | Notes     |
| -------- | ---------- | --------- |
| ID       | UUID       | key       |
| garageId | String(20) | required  |
| tireSpec | String(50) | required  |
| quantity | Integer    | default 0 |

Seed two stock rows from a CSV (summer tires) so the list is not empty on start.

## Endpoints

| Method | Path                                             | Behaviour                                                                                                                                                                                                        |
| ------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/garage/Deliveries`, `/garage/Deliveries(<ID>)` | list, read one                                                                                                                                                                                                   |
| GET    | `/garage/Stock`                                  | list, read only                                                                                                                                                                                                  |
| POST   | `/garage/Deliveries(<ID>)/GarageService.receive` | bound action. Allowed only in `InTransit`. Adds one tire to `Stock` for that `garageId` + `tireSpec` (create the row if missing), sets `Received`, emits `TireDelivered`, returns the delivery. Otherwise `409`. |

## Events

| Direction | Event           | Payload                                         | When                                     |
| --------- | --------------- | ----------------------------------------------- | ---------------------------------------- |
| in        | `TireShipped`   | `{ bookingId, tireSpec, garageId, shipmentId }` | creates a Delivery in status `InTransit` |
| out       | `TireDelivered` | `{ bookingId, garageId }`                       | when `receive` succeeds                  |

## Acceptance criteria

- [ ] `GET /garage/Stock` lists the seeded rows; `Stock` is read only over HTTP
- [ ] an inbound `TireShipped` creates exactly one `Delivery` with status `InTransit`
- [ ] `receive` on an `InTransit` delivery returns it with `status: "Received"`, increments (or creates) the matching `Stock` row by 1, and emits `TireDelivered` with exactly `{ bookingId, garageId }`
- [ ] `receive` on a `Received` delivery answers `409`; unknown ID answers `404`
- [ ] all of the above covered by tests, `npm run check` green

## Out of scope

Reserving stock for a booking, consuming stock at the swap, multiple garages beyond the id string. Stretch ideas live in `issues/90-*` in your repo.
