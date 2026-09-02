# Spec: supplier service

Ships manufactured tires to the garage that needs them.

Port `4006`, OData path `/supplier`.

## Entities

**Shipments**

| Field     | Type            | Notes                          |
| --------- | --------------- | ------------------------------ |
| ID        | UUID            | key                            |
| bookingId | UUID            | required, from the event       |
| tireSpec  | String(50)      | required                       |
| garageId  | String(20)      | required, the destination      |
| status    | String(20) enum | `Pending` (default), `Shipped` |

## Endpoints

| Method | Path                                               | Behaviour                                                                                                            |
| ------ | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| GET    | `/supplier/Shipments`, `/supplier/Shipments(<ID>)` | list, read one                                                                                                       |
| POST   | `/supplier/Shipments(<ID>)/SupplierService.ship`   | bound action. Allowed only in `Pending`, sets `Shipped`, emits `TireShipped`, returns the shipment. Otherwise `409`. |

The action is called `ship`, not `dispatch`: `dispatch` is a method name CAP reserves on every service.

## Events

| Direction | Event              | Payload                                         | When                                   |
| --------- | ------------------ | ----------------------------------------------- | -------------------------------------- |
| in        | `TireManufactured` | `{ bookingId, tireSpec, garageId, orderId }`    | creates a Shipment in status `Pending` |
| out       | `TireShipped`      | `{ bookingId, tireSpec, garageId, shipmentId }` | when `ship` succeeds                   |

## Acceptance criteria

- [ ] an inbound `TireManufactured` creates exactly one `Shipment` with status `Pending` carrying `bookingId`, `tireSpec`, `garageId`
- [ ] `GET /supplier/Shipments` lists shipments, `$filter=bookingId eq <id>` works
- [ ] `ship` on a `Pending` shipment returns it with `status: "Shipped"` and emits `TireShipped` with exactly `{ bookingId, tireSpec, garageId, shipmentId }`
- [ ] `ship` on a `Shipped` shipment answers `409`; unknown ID answers `404`
- [ ] all of the above covered by tests, `npm run check` green

## Out of scope

Carriers, tracking numbers, addresses, batching several tires. Stretch ideas live in `issues/90-*` in your repo.
