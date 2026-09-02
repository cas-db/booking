# Warm-up: rename Greetings to the first entity of the spec

Ten minutes, one full loop. Identical for every pair.

## Goal

The placeholder `Greetings` entity is gone. The first entity of your spec exists with one real field, and one test proves it.

## Context

`db/schema.cds`, `srv/hello-service.cds`, `srv/hello-service.ts`, `test/hello.test.ts`. Your spec is `specs/<service>.md`; take its first entity (for example `Bookings`, `ProductionOrders`, `Shipments`, `Deliveries`) and only its first non-key field. The rest of the entity comes later through the plan.

Suggested prompt for the agent:

> Read AGENTS.md and specs/<service>.md. Rename the placeholder entity Greetings to <Entity> with the key and the field <field> from the spec, rename HelloService to <Service> with path /<path>, update the seed CSV and the tests accordingly, and add one test that creates a row and reads it back. Run npm run check and fix everything until it is green.

## Acceptance criteria

- [ ] `GET /<path>/<Entity>` returns the seeded rows
- [ ] `POST /<path>/<Entity>` with the new field returns 201 and the row can be read back
- [ ] no file mentions `Greetings` or `HelloService` any more

## Done when

- [ ] `npm run check` green, hook passed
- [ ] PR opened, reviewed by the other pair, merged
