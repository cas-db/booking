#!/usr/bin/env bash
# Walks one booking through the whole chain and prints the state after every step.
# The middle of the chain (manufacturing, supplier, garage) is faked by appending
# TireDelivered to the shared message box, exactly like the garage service would.
#
# Usage: npm run watch in one terminal, then ./scripts/chain-demo.sh in another.
set -euo pipefail

BASE="${BASE:-http://localhost:4004/booking}"
MSG_BOX="${MSG_BOX:-$HOME/.cds-msg-box}"
TIRE_SPEC="${TIRE_SPEC:-205/55 R16 winter}"
GARAGE_ID="${GARAGE_ID:-GAR-01}"

command -v jq >/dev/null || {
  echo "this script needs jq" >&2
  exit 1
}

step() { printf '\n=== %s ===\n' "$1"; }
booking() { curl -sf "$BASE/Bookings($1)" | jq -c '{ID, tireSpec, garageId, status}'; }

# CAP rewrites the message box while it consumes it, so take its lock file first,
# otherwise an appended line can be dropped by the running watcher.
lock_box() {
  local tries=25
  while ((tries--)); do
    if (
      set -o noclobber
      : >"$MSG_BOX.lock"
    ) 2>/dev/null; then
      return 0
    fi
    sleep 0.2
  done
  return 1
}

tire_delivered() {
  local payload
  payload=$(jq -nc --arg id "$1" --arg g "$GARAGE_ID" \
    '{data: {bookingId: $id, garageId: $g}, headers: {}}')

  lock_box || {
    echo "could not lock $MSG_BOX" >&2
    exit 1
  }
  printf '\nTireDelivered %s' "$payload" >>"$MSG_BOX"
  rm -f "$MSG_BOX.lock"
}

# The message box is polled, so give the service a moment to catch up.
wait_for_status() {
  local id=$1 want=$2 tries=${3:-20}
  while ((tries--)); do
    [[ $(curl -sf "$BASE/Bookings($id)" | jq -r .status) == "$want" ]] && return 0
    sleep 0.5
  done
  return 1
}

step "1. the customer books a tire swap"
ID=$(curl -sf -X POST "$BASE/Bookings" \
  -H 'Content-Type: application/json' \
  -d "$(jq -nc --arg t "$TIRE_SPEC" --arg g "$GARAGE_ID" '{tireSpec: $t, garageId: $g}')" |
  jq -r .ID)
booking "$ID"
echo "BookingCreated is now in the message box, manufacturing would pick it up here:"
grep -F "$ID" "$MSG_BOX" | tail -1

step "2. confirming the swap too early is refused"
curl -s -o /dev/null -w 'HTTP %{http_code}, 409 expected\n' \
  -X POST "$BASE/Bookings($ID)/BookingService.confirmSwap" \
  -H 'Content-Type: application/json' -d '{}'

step "3. the garage reports the delivered tire"
tire_delivered "$ID"
wait_for_status "$ID" ReadyForSwap || {
  echo "the booking never reached ReadyForSwap" >&2
  exit 1
}
booking "$ID"

step "4. the customer comes in and the swap is confirmed"
curl -sf -X POST "$BASE/Bookings($ID)/BookingService.confirmSwap" \
  -H 'Content-Type: application/json' -d '{}' | jq -c '{ID, status}'

step "5. a replayed TireDelivered does not reopen the booking"
tire_delivered "$ID"
sleep 3
booking "$ID"
wait_for_status "$ID" Done 1 || {
  echo "the replayed event reopened the booking" >&2
  exit 1
}

printf '\ndone, booking %s reached Done\n' "$ID"
