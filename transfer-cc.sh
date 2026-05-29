#!/usr/bin/env bash

## Transfer CC to a party via Validator Admin API (transfer-preapproval)

VALIDATOR_URL="http://validator.localhost/v0/admin/external-party/transfer-preapproval/transfer"
RECEIVER_PARTY_ID="7da3a2b639137d37d8f86dd4b2625873::12208020d3dcfdefb7ee787d68ee9a37a37dfc55863d6ea66170fca453022925631a"
AMOUNT="100.0"

echo "Transferring ${AMOUNT} CC to ${RECEIVER_PARTY_ID}..."
echo "Endpoint: ${VALIDATOR_URL}"
echo ""

RESULT=$(
    curl -sS --fail-with-body \
    --url "${VALIDATOR_URL}" \
    --header "Content-Type: application/json" \
    --request POST \
    --data @- <<EOF
{
  "party_id": "${RECEIVER_PARTY_ID}",
  "amount": "${AMOUNT}"
}
EOF
)

echo "--- Response ---"
echo "$RESULT" | jq .
