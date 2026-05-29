#!/usr/bin/env bash

## =================================================================================================
## Step 2c-b: Patch remote Backend choice context with Receiver's local Allowlist credential.
## Run after accept-3.sh when receiver-credentials is empty.
## Authorized by: Registrar (reads issuer-held allowlist contracts)
## =================================================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATAFILE="${SCRIPT_DIR}/source.sh"
source "$DATAFILE"

INPUTFILE="${SCRIPT_DIR}/response-step-2c.json"
OUTPUTFILE="${SCRIPT_DIR}/response-step-2c.json"

if [[ ! -f "${INPUTFILE}" ]]; then
    echo "Error: ${INPUTFILE} not found. Run accept-3.sh first."
    exit 1
fi

if grep -q "405 Not Allowed" "${INPUTFILE}"; then
    echo "Error: response-step-2c.json contains nginx 405. Re-run accept-3.sh with remote BACKEND_API."
    exit 1
fi

if [[ -z "${ADMIN_TOKEN:-}" ]]; then
    echo "Error: ADMIN_TOKEN is not set in source.sh (Registrar JWT for querying allowlist)."
    exit 1
fi

if [[ -z "${CREDENTIAL_TEMPLATE:-}" ]]; then
    CREDENTIAL_TEMPLATE="#utility-credential-v0:Utility.Credential.V0.Credential:Credential"
fi

OFFSET=$(curl -sS --fail-with-body --request GET \
    --url "${HTTP_JSON_API}/v2/state/ledger-end" \
    --header "Accept: application/json" \
    --header "Authorization: Bearer ${ADMIN_TOKEN}" \
    | jq -r '.offset')

ACS=$(curl -sS --fail-with-body \
    --url "${HTTP_JSON_API}/v2/state/active-contracts" \
    --header "Authorization: Bearer ${ADMIN_TOKEN}" \
    --header "Content-Type: application/json" \
    --request POST \
    --data @- <<EOF
{
    "verbose": false,
    "activeAtOffset": "${OFFSET}",
    "filter": {
        "filtersByParty": {
            "${ADMIN_PARTY_ID}": {
                "cumulative": [{
                    "identifierFilter": {
                        "TemplateFilter": {
                            "value": {
                                "templateId": "${CREDENTIAL_TEMPLATE}",
                                "includeCreatedEventBlob": true
                            }
                        }
                    }
                }]
            }
        }
    }
}
EOF
)

MATCH=$(echo "${ACS}" | jq --arg receiver "${RECEIVER_PARTY_ID}" --arg asset "${ASSET_ID}" --arg issuer "${ADMIN_PARTY_ID}" '
    [.[] | .contractEntry.JsActiveContract.createdEvent
     | select(
         .createArgument.issuer == $issuer
         and .createArgument.holder == $issuer
         and (.createArgument.claims | any(
             .subject == $receiver and .property == "IsHoldOf" and .value == $asset
         ))
         and (.createdEventBlob | length > 0)
     )][0]
')

if [[ -z "${MATCH}" || "${MATCH}" == "null" ]]; then
    echo "Error: No Allowlist credential found for receiver ${RECEIVER_PARTY_ID} / ${ASSET_ID}."
    echo "Ensure allowlist/step-1 ran successfully and ADMIN_TOKEN can read Registrar ACS."
    echo "${ACS}" | jq .
    exit 1
fi

CREDENTIAL_CID=$(echo "${MATCH}" | jq -r '.contractId')
CREDENTIAL_TEMPLATE_ID=$(echo "${MATCH}" | jq -r '.templateId')
CREDENTIAL_BLOB=$(echo "${MATCH}" | jq -r '.createdEventBlob')
SYNCHRONIZER_ID=$(echo "${ACS}" | jq -r --arg cid "${CREDENTIAL_CID}" '
    .[] | select(.contractEntry.JsActiveContract.createdEvent.contractId == $cid)
    | .contractEntry.JsActiveContract.synchronizerId
')

echo "Found Allowlist credential:"
echo "  contractId: ${CREDENTIAL_CID}"
echo "  templateId: ${CREDENTIAL_TEMPLATE_ID}"

DISCLOSED=$(jq -n \
    --arg templateId "${CREDENTIAL_TEMPLATE_ID}" \
    --arg contractId "${CREDENTIAL_CID}" \
    --arg createdEventBlob "${CREDENTIAL_BLOB}" \
    --arg synchronizerId "${SYNCHRONIZER_ID}" \
    '{
        templateId: $templateId,
        contractId: $contractId,
        createdEventBlob: $createdEventBlob,
        synchronizerId: $synchronizerId
    }')

PATCHED=$(jq \
    --arg cid "${CREDENTIAL_CID}" \
    --argjson disclosed "${DISCLOSED}" \
    '
    .choiceContextData.values["utility.digitalasset.com/receiver-credentials"] = {
        tag: "AV_List",
        value: [{ tag: "AV_ContractId", value: $cid }]
    }
    | .disclosedContracts += [$disclosed]
    ' "${INPUTFILE}")

echo "--- Patched choice context (receiver-credentials) ---"
echo "${PATCHED}" | jq '.choiceContextData.values["utility.digitalasset.com/receiver-credentials"]'

echo "${PATCHED}" > "${OUTPUTFILE}"
echo "Updated ${OUTPUTFILE}"
