# PLAN: booking UI

A fancy but small single page app on top of the existing booking service. No backend change is
needed for the happy path, the OData v4 service at `/booking` already exposes everything the UI
uses. Plan only, nothing implemented yet.

## Goal

A workshop demo screen that makes the tire swap chain visible: create a booking, watch it move
from `Created` to `ReadyForSwap` when the chain delivers the tire, confirm the swap, cancel a
booking. Fully covered by Playwright tests that run against the real CAP server.

## Stack proposal (needs approval, this adds dependencies)

| Concern    | Choice                                        | Why                                                                        |
| ---------- | --------------------------------------------- | -------------------------------------------------------------------------- |
| Framework  | Svelte 5 (runes) + TypeScript                 | Compiles away, tiny runtime, `$state` / `$derived` keep the polling and optimistic updates short |
| Build      | Vite 7                                        | Instant dev server, proxy to `localhost:4004`, static build into `app/`    |
| Styling    | Tailwind CSS 4 + a few hand rolled components | "Fancy" without pulling a whole component library                          |
| Data       | plain `fetch` in a small `src/api/` module    | The service is four endpoints, a data layer library would be overkill      |
| E2E tests  | Playwright + `@playwright/test`               | Explicitly requested, drives the real server plus the real UI              |
| Unit tests | the existing `node:test` runner               | No second test runner in the repo                                          |

Plain Svelte + Vite as a client rendered SPA, not SvelteKit. SvelteKit would bring its own server
and adapter story, and this app has one data source that already runs on 4004, so a second server
buys nothing. Routing is `svelte-routing`-sized, two routes, so a ~40 line hash router in
`src/lib/router.svelte.ts` keeps the dependency list shorter. Styling with Tailwind 4 through
`@tailwindcss/vite`, plus `svelte-check` in the typecheck gate for the `.svelte` files.

Everything stays local: the Vite dev server proxies `/booking` to `http://localhost:4004`, and for
production `cds serve` hosts the built assets from `app/` so there is still exactly one process.

## Layout

```
app/                        the UI (own package.json or a workspace, to be decided in issue 100)
  index.html
  vite.config.ts            dev proxy /booking -> localhost:4004
  src/main.ts               mounts App.svelte
  src/App.svelte            shell, route switch, toast region
  src/api/booking.ts        typed client: listBookings, getBooking, createBooking,
                            listCustomers, confirmSwap, cancel
  src/api/types.ts          Booking, Customer, BookingStatus
  src/lib/bookings.svelte.ts  $state store: list, polling loop, optimistic action helpers
  src/lib/router.svelte.ts    minimal hash router, two routes
  src/lib/status.ts         status -> allowed actions, tireSpec/garageId validators (unit tested)
  src/components/           StatusBadge.svelte, BookingCard.svelte, BookingForm.svelte,
                            Toast.svelte, ChainTimeline.svelte
  src/pages/BookingsPage.svelte
  src/pages/BookingDetailPage.svelte
e2e/                        Playwright specs
  playwright.config.ts      webServer: cds + vite, baseURL, trace on failure
  fixtures.ts               resetting helpers, seeded customer lookup
  *.spec.ts
```

## Screens

**1. Bookings overview (`/`)**

- Header with the service name and a live "connected" dot (a failing poll turns it red).
- Chain legend: `Created -> ReadyForSwap -> Done`, `Cancelled` as a side branch.
- Filter chips per status plus a free text filter on `tireSpec` and `garageId`.
- Card grid, one card per booking: short ID, customer name, tire spec, garage, colour coded
  status badge, and the actions that are legal in the current state (`Confirm swap` only in
  `ReadyForSwap`, `Cancel` only in `Created` or `ReadyForSwap`).
- Poll `GET /booking/Bookings` every 3 seconds so an inbound `TireDelivered` from another service
  shows up without a reload. Polling is the honest choice here, the service has no push channel.

**2. New booking (dialog on the overview)**

- Customer dropdown fed by `GET /booking/Customers`.
- `tireSpec` field with the same regex the backend enforces
  (`^\d{3}/\d{2} R\d{2} (winter|summer|allseason)$`) plus a preset picker, `garageId` field with
  the `GAR-\d{2}` pattern. Client side validation mirrors the server, the server stays the
  authority: a `400` is rendered inline from the OData error message.
- On success the new card appears and a toast confirms.

**3. Booking detail (`/bookings/:id`)**

- Full record, a vertical timeline of the chain (booked, tire delivered, swapped or cancelled)
  derived from the current status, and the same two actions.
- A `409` from a forbidden transition is rendered as a readable error banner, not a stack trace.

**Cross cutting**

- Optimistic UI on actions with rollback when the request fails.
- Empty state, loading skeletons, and an error state when the backend is down.
- Keyboard reachable, visible focus, `aria-live` on the toast region. Enough a11y that the
  Playwright tests can select by role and name instead of by CSS class.

## Backend touch points

The UI is read/write over the existing endpoints only:

| Use                | Call                                                          |
| ------------------ | ------------------------------------------------------------- |
| overview list      | `GET /booking/Bookings?$expand=customer&$orderby=ID`           |
| customers dropdown | `GET /booking/Customers`                                       |
| create             | `POST /booking/Bookings`                                       |
| detail             | `GET /booking/Bookings(<ID>)?$expand=customer`                 |
| confirm            | `POST /booking/Bookings(<ID>)/BookingService.confirmSwap` `{}` |
| cancel             | `POST /booking/Bookings(<ID>)/BookingService.cancel` `{}`      |

Two small backend questions to settle before issue 100:

- `db/schema.cds` has no `createdAt`. Adding the `managed` aspect to `Bookings` would give the
  overview a sensible sort order and the timeline real timestamps. Small, additive, own issue.
- Serving the built UI from `cds serve` needs the `app/` folder plus one line of config. Also
  additive.

Neither is required for a first version, both are proposed as separate issues so the current
service stays untouched until they are approved.

## Playwright tests

`playwright.config.ts` starts both processes with `webServer`, one CAP server on 4004 and the Vite
preview on 5173, `reuseExistingServer` locally, `trace: 'on-first-retry'`, chromium in CI plus
firefox and webkit locally. Because the CAP database is sqlite in-memory, every `npm run e2e` run
starts from the seeded CSV state, so tests create the data they need and never depend on each
other.

The tricky part is `ReadyForSwap`: the UI cannot produce it, only an inbound `TireDelivered` event
can. Two options, the plan picks the first:

1. A tiny test-only emitter script (`e2e/emit.ts`) that connects to the same `file-based-messaging`
   channel and emits `TireDelivered`, called from the spec. Realistic, exercises the real event
   path, no production code changes.
2. A `[development]`-only debug endpoint on the service. Simpler in the test but it adds code that
   only exists for tests.

Specs to write:

| Spec                    | Covers                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| `overview.spec.ts`      | list renders, seeded customers appear in the dropdown, status filter chips narrow the grid |
| `create-booking.spec.ts`| happy path creates a card in `Created`; invalid tireSpec and garageId show inline errors; the server `400` is surfaced |
| `confirm-swap.spec.ts`  | emit `TireDelivered`, the card flips to `ReadyForSwap` through polling, confirm turns it `Done`, the confirm button then disappears |
| `cancel.spec.ts`        | cancel from `Created` works; a cancelled booking offers no further actions                 |
| `errors.spec.ts`        | a `409` (confirm on a `Created` booking, forced through the API) renders the error banner; backend down renders the error state |
| `a11y.spec.ts`          | keyboard path create -> confirm without a mouse, axe scan on both pages clean              |

Plus a handful of `node:test` unit tests for the pure bits (status-to-allowed-actions mapping,
the tireSpec validator) so the fast gate keeps catching logic errors.

Wiring: `npm run e2e` (and `e2e:ui` for the inspector). `npm run check` keeps lint, format,
typecheck and the fast unit tests; Playwright runs as its own step because it needs browsers and
takes longer. The pre-commit hook stays as it is.

## Build order (one issue each)

Every step ends with a runnable UI and a green gate.

| #   | Issue                          | Content                                                                                          |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| 100 | UI scaffold and dev proxy      | `app/` with Vite, Svelte 5, TS, Tailwind, `svelte-check` in the gate, one page that lists bookings from the real service, npm scripts, docs in the README |
| 110 | Playwright harness             | config with the two `webServer` entries, `e2e/emit.ts`, first smoke spec, `npm run e2e`          |
| 120 | Bookings overview              | card grid, status badges, filter chips, polling, loading/empty/error states + `overview.spec.ts` |
| 130 | Create booking dialog          | form, customer dropdown, client validation mirroring the backend regexes, server error rendering + `create-booking.spec.ts` |
| 140 | Confirm swap and cancel        | state-aware action buttons, optimistic update with rollback, toasts, 409 banner + `confirm-swap.spec.ts`, `cancel.spec.ts`, `errors.spec.ts` |
| 150 | Booking detail page and timeline | route, `$expand=customer`, chain timeline, deep link from a card                                |
| 160 | Polish and a11y                | focus management, `aria-live`, dark mode, axe scan + `a11y.spec.ts`                              |
| 170 | Serve the UI from cds (opt)    | build into `app/`, `cds serve` hosts it, one command demo                                        |
| 180 | `managed` on Bookings (opt)    | `createdAt` / `modifiedAt`, real timestamps in the timeline, sort order                          |

Issues 100 and 110 come first and in that order. 120 to 160 build on them and can be split across
the pair. 170 and 180 are optional and touch the backend, so they only happen if approved.

## Out of scope

Authentication and user roles, editing a booking after creation, real time push (websockets or
SSE), mobile app, deployment to BTP or anywhere else, internationalisation.

## Risks

- **New dependencies.** `AGENTS.md` forbids adding them without asking. Svelte 5, Vite, Tailwind,
  `svelte-check` and Playwright all need a yes before issue 100.
- **In-memory database.** Every restart wipes the bookings, so demos and tests must create their
  own data. That is a feature for test isolation and a surprise during a live demo.
- **Polling instead of push.** A 3 second interval is fine for a workshop, it is not a pattern to
  copy into production.
- **Playwright browser download** is a few hundred megabytes on the first run, worth doing before
  the workshop rather than during it.
