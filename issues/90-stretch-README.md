# Stretch issues

For pairs whose spec is done and merged. Open the `90-stretch-<service>.md` for your service, pick one, turn it into an issue with `_template.md`, and run the loop again. If you want something generic instead:

- **Validation**: reject bad input with `400` and a readable message, with tests for one good and two bad inputs.
- **One more event**: emit an extra event from your action (name it, document the payload in your README), with a test that subscribes and asserts the payload.
- **One more endpoint**: an unbound function that returns counts or a filtered list, tested through HTTP.
