# The loop

This folder carries you through the afternoon. Every file here is an issue you can create on GitHub as is.

The loop, ten lines:

1. Read your spec in `specs/<service>.md` and `AGENTS.md`.
2. Do `00-warm-up.md` first: one tiny change, all the way to a merged PR. Everyone finishes a full loop before building anything real.
3. Do `01-plan-from-spec.md`: the agent writes `PLAN.md` and splits it into 3 to 4 issues using `_template.md`.
4. Per issue: `git switch -c feat/<issue-number>-<slug>` from `main`.
5. Let the agent research first (read the spec section, the model, the tests), then implement. Ask for tests with every change.
6. `npm run check`. Fix until green.
7. Commit (the hook runs the gates again), push, open a PR that says `Closes #<issue>`.
8. The other pair reviews the PR with `99-review-checklist.md`. Address the feedback.
9. Merge. Delete the branch. Back to 4.
10. Out of issues? Pick a `90-stretch-*.md`.

Create an issue from a file:

```bash
gh issue create --title "Warm-up: rename Greetings to <Entity>" --body-file issues/00-warm-up.md
gh issue list
```

Open a PR from the branch:

```bash
git push -u origin HEAD
gh pr create --fill --body "Closes #<issue-number>"
```

Driver and navigator swap after every merged PR.
