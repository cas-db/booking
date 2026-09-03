# cap-workshop-template

Starting point for the hands-on: a SAP CAP 10 hello world in TypeScript with every quality gate already wired. You clone it, pick your service spec, and spend the afternoon on the loop (plan, issues, branch, implement, commit through the gates, PR, review, merge), not on setup.

Template: <https://github.com/MVansteenhuyse/cap-workshop-template>

## Start

```bash
git clone https://github.com/MVansteenhuyse/cap-workshop-template.git <your-service-name>
cd <your-service-name>
npm install            # also activates the pre-commit hook
npm test               # all tests green
npm run watch          # http://localhost:4004/booking/Customers
```

## Demo the whole chain

With `npm run watch` running in one terminal:

```bash
npm run demo           # needs jq
```

`scripts/chain-demo.sh` books a tire swap, shows the `BookingCreated` event in the message box, proves that confirming too early answers `409`, fakes the garage by appending `TireDelivered` to `~/.cds-msg-box`, confirms the swap, and finally replays `TireDelivered` to show that a `Done` booking is not reopened. `BASE`, `MSG_BOX`, `TIRE_SPEC` and `GARAGE_ID` are overridable through the environment.

Then, in a second terminal in the same folder:

```bash
copilot                # the coding agent; it reads AGENTS.md by itself
```

Open your spec from `specs/` (one per service: booking, manufacturing, supplier, garage) and start with `issues/README.md`. It walks you through the warm-up issue, the planning issue and the loop.

Push your repo to your own GitHub account first (`gh repo create <your-service-name> --private --source . --push`), because the loop needs GitHub issues and pull requests.

## What is in here

|                                                  |                                                                                                                 |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                      | conventions for the agent (and for you). This file is on the wire before your first message.                    |
| `db/`, `srv/`, `test/`                           | the `Customers` and `Bookings` entities, `BookingService` at `/booking` and its tests.                          |
| `specs/`                                         | the four service specs and the shared event contract                                                            |
| `app/`                                           | the Svelte 5 + Vite frontend, see `UI-PLAN.md`                                                                  |
| `issues/`                                        | the loop guide, the issue template, the warm-up issue, the planning issue, stretch issues, the review checklist |
| `.githooks/pre-commit`                           | runs `npm run check` (oxlint, prettier, tsc, tests). Red means no commit.                                       |
| `.oxlintrc.json`, `.prettierrc`, `tsconfig.json` | lint, format, typecheck config                                                                                  |
| `test/.env`                                      | `CDS_TYPESCRIPT=tsx` and `CDS_ENV=test` for the test run                                                        |
| `copilot-mcp-config.json`                        | CAP docs MCP server for the agent, see below                                                                    |

## Commands

|                  |                                                                            |
| ---------------- | -------------------------------------------------------------------------- |
| `npm run watch`  | run with auto-reload, `PORT=4005 npm run watch` to change the port         |
| `npm run ui`     | the Svelte UI on <http://localhost:5173>, proxies `/booking` to 4004       |
| `npm run build`  | build the UI into `app/dist`, which `cds serve` hosts                      |
| `npm run check`  | all gates, same as the hook                                                |
| `npm run e2e`    | Playwright end to end tests (needs `npx playwright install chromium` once) |
| `npm run e2e:ui` | the same tests in the Playwright inspector                                 |
| `npm test`       | tests only                                                                 |
| `npm run format` | let prettier fix formatting                                                |

## CAP docs inside the agent (optional)

Copy `copilot-mcp-config.json` to `~/.copilot/mcp-config.json` (create the folder if needed; merge if the file exists) and restart `copilot`. The agent can then look up CAP APIs with the `cap-docs` tools instead of guessing.

## Events

Services talk through CAP `file-based-messaging`: every service on one machine appends to and reads from `~/.cds-msg-box`. During development you test events in your tests (`messaging.emit(...)` in the test, see `AGENTS.md`). The whole chain only comes together in the finale on the organizer's laptop. A second `cds watch` on the same machine and user would share the file, so run one service at a time.

## The UI

The frontend lives in `app/` (Svelte 5 with runes, Vite, Tailwind). It talks to the OData service
over `/booking`, which the Vite dev server proxies to `http://localhost:4004`.

Two ways to run it:

```bash
# development, two processes, hot reload
npm run watch          # terminal 1, the CAP service on 4004
npm run ui             # terminal 2, the UI on http://localhost:5173

# demo, one process, one port
npm run build          # writes app/dist
npm start              # UI and OData on http://localhost:4004
```

`cds` serves the build output because `cds.folders.app` points at `app/dist`, so the built app
calls `/booking` on its own origin and needs no proxy. `app/dist` is git-ignored.

The plan and the issue breakdown for the UI are in `UI-PLAN.md`.

### End to end tests

```bash
npx playwright install chromium   # once, plus `sudo npx playwright install-deps chromium` on Linux
npm run e2e
```

Playwright starts the CAP service and the UI itself (`webServer` in `playwright.config.ts`) and
reuses them when they already run. The database is sqlite in-memory, so every run starts from the
seeded state and each spec creates the data it needs. `e2e/emit.ts` appends events to
`~/.cds-msg-box` exactly like another service of the chain would, which is how a spec reaches
`ReadyForSwap`. The `single-process` Playwright project runs `e2e/served.spec.ts` against the
built app on 4004, so the one command demo stays covered.
