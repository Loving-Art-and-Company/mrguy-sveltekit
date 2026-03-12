#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-https://mrguydetail.com}"
PLAYWRIGHT_SKIP_WEBSERVER="${PLAYWRIGHT_SKIP_WEBSERVER:-1}"
HEADED="${HEADED:-0}"
BOOKING_LIMIT="${BOOKING_LIMIT:-}"

export BASE_URL
export PLAYWRIGHT_SKIP_WEBSERVER

PW_ARGS=()
if [[ "${HEADED}" == "1" ]]; then
  PW_ARGS+=(--headed)
fi

echo "Production E2E"
echo "  BASE_URL=${BASE_URL}"
echo "  PLAYWRIGHT_SKIP_WEBSERVER=${PLAYWRIGHT_SKIP_WEBSERVER}"
if [[ -n "${BOOKING_LIMIT}" ]]; then
  export BOOKING_LIMIT
  echo "  BOOKING_LIMIT=${BOOKING_LIMIT}"
fi
if [[ "${HEADED}" == "1" ]]; then
  echo "  Browser mode=headed"
else
  echo "  Browser mode=headless"
fi

echo
echo "Step 1/2: Booking flow"
npx playwright test e2e/booking.spec.ts "${PW_ARGS[@]}"

echo
echo "Step 2/2: Reschedule flow"
if [[ -z "${RESCHEDULE_TEST_EMAIL:-}" ]]; then
  echo "  RESCHEDULE_TEST_EMAIL not set. The booking-backed reschedule tests will skip."
fi
if [[ -z "${RESCHEDULE_MISSING_EMAIL_PHONE:-}" ]]; then
  echo "  RESCHEDULE_MISSING_EMAIL_PHONE not set. The missing-email support-path test will skip."
fi
if [[ -z "${RESCHEDULE_MULTI_EMAIL_PHONE:-}" ]]; then
  echo "  RESCHEDULE_MULTI_EMAIL_PHONE not set. The multi-email support-path test will skip."
fi
npx playwright test e2e/reschedule.spec.ts "${PW_ARGS[@]}"

echo
echo "Production E2E complete."
