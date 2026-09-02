# Spec: manufacturing service

Turns bookings into production orders. When production is finished, the tire goes to the supplier.

Port `4005`, OData path `/manufacturing`.

## Entities

**ProductionOrders**

| Field     | Type            | Notes                              |
| --------- | --------------- | ---------------------------------- |
| ID        | UUID            | key                                |
| bookingId | UUID            | required, from the event           |
| tireSpec  | String(50)      | required                           |
| garageId  | String(20)      | required, passed through unchanged |
| status    | String(20) enum | `Open` (default), `Finished`       |

## Endpoints

| Method | Path                                                                       | Behaviour                                                                                                            |
| ------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/manufacturing/ProductionOrders`, `/manufacturing/ProductionOrders(<ID>)` | list, read one                                                                                                       |
| POST   | `/manufacturing/ProductionOrders(<ID>)/ManufacturingService.finish`        | bound action. Allowed only in `Open`, sets `Finished`, emits `TireManufactured`, returns the order. Otherwise `409`. |

There is no POST to create an order by hand: orders come from events only.

## Events

| Direction | Event              | Payload                                      | When                                       |
| --------- | ------------------ | -------------------------------------------- | ------------------------------------------ |
| in        | `BookingCreated`   | `{ bookingId, tireSpec, garageId }`          | creates a ProductionOrder in status `Open` |
| out       | `TireManufactured` | `{ bookingId, tireSpec, garageId, orderId }` | when `finish` succeeds                     |

## Acceptance criteria

- [ ] an inbound `BookingCreated` creates exactly one `ProductionOrder` with status `Open` carrying `bookingId`, `tireSpec`, `garageId`
- [ ] `GET /manufacturing/ProductionOrders` lists orders, `$filter=bookingId eq <id>` works
- [ ] `finish` on an `Open` order returns it with `status: "Finished"` and emits `TireManufactured` with exactly `{ bookingId, tireSpec, garageId, orderId }`
- [ ] `finish` on a `Finished` order answers `409`; unknown ID answers `404`
- [ ] all of the above covered by tests, `npm run check` green

## Out of scope

Capacity, machines, durations, materials. Stretch ideas live in `issues/90-*` in your repo.
