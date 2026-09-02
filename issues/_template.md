# <verb + object, e.g. "Add finish action to ProductionOrders">

## Goal

One or two sentences: what works when this is done, from the outside (an HTTP call, an event).

## Context

Which section of `specs/<service>.md` this comes from. Which entity, endpoint or event. Anything the implementer must know that is not in the spec.

## Acceptance criteria

- [ ] testable statement (a request returns X, an event with payload Y is emitted, status changes from A to B)
- [ ] testable statement
- [ ] wrong-state and not-found cases answer 409 / 404

## Files likely touched

- `db/schema.cds`
- `srv/<name>-service.cds`, `srv/<name>-service.ts`
- `test/<name>.test.ts`

## Done when

- [ ] tests cover every acceptance criterion
- [ ] `npm run check` green, hook passed
- [ ] PR opened with a `curl` example, reviewed by the other pair, merged
