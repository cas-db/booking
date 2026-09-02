# AGENTS.md

Instructions for AI coding agents (and humans) working in this repository. Read fully before changing anything. Everything in this file goes on the wire before your first message, so keep it short and true.

## What this is

One microservice of a small event-driven system built in a workshop. SAP CAP 10, TypeScript, Node 22, sqlite in-memory, events over CAP `file-based-messaging`. Pure local, no SAP BTP, no external services. The spec that defines the service is the file in `specs/` that the team picked. The repo starts as a hello world (`Greetings` entity, `HelloService`); everything placeholder is meant to be replaced.

## Commands

| What                      | Command                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| Run locally (auto-reload) | `npm run watch` (or `cds watch`), OData at `http://localhost:4004/<path>` (`PORT` env changes the port) |
| All quality gates         | `npm run check`                                                                                         |
| Lint                      | `npm run lint` (oxlint)                                                                                 |
| Format                    | `npm run format` (prettier, fixes) / `npm run format:check`                                             |
| Typecheck                 | `npm run typecheck` (tsc, no emit)                                                                      |
| Tests                     | `npm test` (node:test + cds.test, TypeScript via tsx)                                                   |

The pre-commit hook in `.githooks/` runs lint, format check, typecheck and tests. A red gate blocks the commit. Never bypass it with `--no-verify`; fix the cause.

## Layout

```
db/schema.cds            domain model (one namespace per service)
db/data/*.csv            seed data, file name is <namespace>-<Entity>.csv, separator ;
srv/<name>-service.cds   service definition (projections, actions), @path sets the URL
srv/<name>-service.ts    handlers: one class per service, default export, extends cds.ApplicationService
test/*.test.ts           one file per service, HTTP level via cds.test
test/.env                CDS_TYPESCRIPT=tsx and CDS_ENV=test for the test run, do not remove
specs/                   the service specs of the workshop (read yours, ignore the others)
issues/                  the workshop loop: warm-up, planning issue, stretch issues, review checklist
```

## Conventions

- **Keys**: every entity uses the `cuid` aspect (UUID key `ID`). Add `managed` when audit fields are useful.
- **Status fields**: `String(20) enum { ... } default '<initial>'`. Status transitions happen only in action handlers, never through a plain PATCH.
- **Actions**: model state changes as bound actions (`entity X ... actions { action foo() returns X; }`). Validate the current state first and `req.reject(409, ...)` when the transition is not allowed, `req.reject(404, ...)` when the row is missing.
- **Handlers**: `this.on('<action>', Entity, async (req) => ...)`, `this.after('CREATE', Entity, async (_keys, req) => ...)`. In CAP 10 the first argument of an after-CREATE handler contains only the keys; use `req.data` for the full row. Return the updated row from actions (`SELECT.one.from(req.subject)`).
- **Method names**: never give a service class a method with the same name as an action (`finish`, ...) or a `cds.Service` method (`dispatch`, `send`, `emit`, `run`, ...). CAP 10 registers same-named class methods as the action handler automatically and passes different arguments. Also never name an action `dispatch`. Use verbs like `finishOrder`, `receiveDelivery` for helpers.
- **Queries**: `const { SELECT, UPDATE, INSERT } = cds.ql`. Use `UPDATE.entity(Entity, key)` (plain `UPDATE(...)` does not typecheck with the current cds-types) and `req.subject` for the row an action is bound to.
- **Events**: low-level messaging only, no `event` declarations in CDS. `const messaging = await cds.connect.to('messaging')`, then `messaging.emit('<EventName>', payload)` and `messaging.on('<EventName>', async (msg) => ...)` with `msg.data` as the payload. Register `messaging.on` inside `init()`, before the server starts listening. Event names and payload fields are the contract with the other services; copy them exactly from the spec, never rename.
- **Emit after the fact**: emit from `after` handlers (the row exists) and let the outbox deliver on commit.
- **Config** lives in `package.json` under `cds`. Profiles: default is `file-based-messaging`, `[test]` is `local-messaging` so tests never touch `~/.cds-msg-box`.
- **Dependencies**: do not add any without asking. Everything needed is installed.
- **TypeScript**: `strict` is on. No `any` except when narrowing `msg.data`, and then cast to a named shape.
- **Formatting**: prettier decides (no semicolons, single quotes, width 100). Run `npm run format` before committing.
- **No em-dashes** in code comments, docs or commit messages.

## Testing

- Tests run the real server in-process: `const test = cds.test('.')` at the top of the file, then `const { GET, POST } = test`.
- Assert with `node:assert/strict`. Test through HTTP (`GET('/<path>/<Entity>')`, `POST('/<path>/<Entity>(<id>)/<Service>.<action>', {})`).
- To test inbound events, emit them yourself: `const messaging = await cds.connect.to('messaging'); await messaging.emit('<EventName>', {...})`, then read the row back.
- To test outbound events, subscribe in the test with `messaging.on('<EventName>', ...)` before triggering.
- Every issue adds or changes at least one test. A feature without a test is not done.

## Workflow (the loop)

1. Read the spec and this file. Write `PLAN.md`, then split it into small GitHub issues (one loop each, format in `issues/_template.md`).
2. Per issue: branch `feat/<issue-number>-<slug>` from `main`, implement, `npm run check`, commit with a plain message (`feat: ... (#12)`), push, open a PR that references the issue, get it reviewed by the other pair, merge.
3. Small commits, one concern each. Never commit `node_modules`, `gen/` or `@cds-models/`.

## Definition of done

`npm run check` green, the hook passed, the spec's acceptance criteria are covered by tests, and the PR describes what changed and how to try it (`curl` example).
