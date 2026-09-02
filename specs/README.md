# Service specs

One spec per service. Each pair builds exactly one of them, starting from the workshop template repo. The four services only talk through events; nobody calls anybody's HTTP API except humans and the demo script.

```
customer books a tire swap (no winter tire in stock yet)
   |
   |  BookingCreated
   v
manufacturing  --TireManufactured-->  supplier  --TireShipped-->  garage
                                                                     |
                                                                     |  TireDelivered
                                                                     v
                                                                  booking: ReadyForSwap  ->  customer comes in  ->  confirmSwap  ->  Done
```

| Service       | Port | Consumes           | Emits              | Spec                                 |
| ------------- | ---- | ------------------ | ------------------ | ------------------------------------ |
| booking       | 4004 | `TireDelivered`    | `BookingCreated`   | [booking.md](booking.md)             |
| manufacturing | 4005 | `BookingCreated`   | `TireManufactured` | [manufacturing.md](manufacturing.md) |
| supplier      | 4006 | `TireManufactured` | `TireShipped`      | [supplier.md](supplier.md)           |
| garage        | 4007 | `TireShipped`      | `TireDelivered`    | [garage.md](garage.md)               |

## The event contract (shared by all four, do not change)

Events travel through CAP `file-based-messaging`: every service on one machine appends to and reads from `~/.cds-msg-box`. The event name is the topic. The payload is `msg.data`.

| Event              | Payload                                         | Emitted by    | Consumed by   |
| ------------------ | ----------------------------------------------- | ------------- | ------------- |
| `BookingCreated`   | `{ bookingId, tireSpec, garageId }`             | booking       | manufacturing |
| `TireManufactured` | `{ bookingId, tireSpec, garageId, orderId }`    | manufacturing | supplier      |
| `TireShipped`      | `{ bookingId, tireSpec, garageId, shipmentId }` | supplier      | garage        |
| `TireDelivered`    | `{ bookingId, garageId }`                       | garage        | booking       |

All ids are UUID strings. `tireSpec` is a free text like `205/55 R16 winter`, `garageId` is a short code like `GAR-01`.

Emit and consume with the low-level messaging API, nothing else:

```ts
const messaging = await cds.connect.to('messaging')
await messaging.emit('TireManufactured', { bookingId, tireSpec, garageId, orderId })
messaging.on('BookingCreated', async (msg) => {
  const { bookingId } = msg.data as { bookingId: string }
})
```

## Rules for every service

- Node 22, SAP CAP 10, TypeScript, sqlite in-memory. Pure local, no BTP.
- Keys are UUIDs (`cuid` aspect). Status is a `String(20) enum` with a default.
- State changes happen through **bound actions**, not through PATCH. An action in the wrong state answers `409`. An unknown id answers `404`.
- Every endpoint and every event handler has a test (`npm test`). `npm run check` must be green before every commit; the pre-commit hook enforces it.
- The spec is the contract. If it is unclear, ask the organizers, do not guess a different event name.
