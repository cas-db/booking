# Cross-review checklist

You are reviewing the other pair's PR. Fifteen minutes, on GitHub, comments on the lines. The goal is a real review, not a rubber stamp; the goal is also not to rewrite their service.

## Read the PR description

- [ ] Does it say which issue it closes and how to try it (a `curl`)?
- [ ] Does the diff match the description? Nothing extra sneaked in?

## AGENTS.md conventions

- [ ] Bound actions for state changes, `409` for wrong state, `404` for unknown id
- [ ] No helper method named like an action, no action named `dispatch`
- [ ] `UPDATE.entity(...)`, `req.subject`, `req.data` used as the conventions say
- [ ] No new dependencies

## Tests

- [ ] Is there a test per acceptance criterion of the issue, or did the tests only get the happy path?
- [ ] Do the tests go through HTTP and events, or do they test private functions?
- [ ] Would the tests fail if the feature broke? Pick one and think it through.

## The contract

- [ ] Event names and payload fields exactly as in `specs/README.md`; no renamed field, no extra required field
- [ ] Status values exactly as in the spec

## Wrap up

- [ ] Leave at least one comment that is a question, not an instruction
- [ ] Approve, or request changes with a clear list. Then tell the other pair in person.
