# Plan: from spec to issues

## Goal

A `PLAN.md` in the repo and 3 to 4 GitHub issues, each small enough for one loop, in the format of `issues/_template.md`.

## Context

The agent plans; you judge. Read the plan before creating issues. A good plan orders the work so that every issue leaves the service runnable: entities and endpoints first, the inbound event next, the action with its outbound event last.

Suggested prompt for the agent:

> Read AGENTS.md and specs/<service>.md completely. Write PLAN.md: the entities, endpoints and events from the spec, the order to build them in, and what each step needs in tests. Then split the plan into 3 to 4 issues using the format in issues/_template.md, one file each under issues/10-_.md to issues/40-_.md. Each issue must be doable in about 30 minutes and leave npm run check green. Do not write code yet.

Then create them:

```bash
for f in issues/[1-4]0-*.md; do gh issue create --title "$(head -n1 "$f" | sed 's/^# //')" --body-file "$f"; done
gh issue list
```

## Acceptance criteria

- [ ] `PLAN.md` committed on `main` (through a PR, like everything else)
- [ ] 3 to 4 issues on GitHub, each with acceptance criteria that a test can check
- [ ] the last issue covers the outbound event of your spec

## Done when

- [ ] both of you agree the order makes sense
