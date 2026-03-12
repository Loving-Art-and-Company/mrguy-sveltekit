#!/usr/bin/env bash

set -euo pipefail

echo "Checking Vercel CLI..."
if ! command -v vercel >/dev/null 2>&1; then
  echo "FAIL: vercel CLI is not installed."
  echo "Install it with: npm i -g vercel"
  exit 1
fi

echo "Checking Vercel auth..."
if ! vercel whoami >/dev/null 2>&1; then
  echo "FAIL: Vercel CLI is not authenticated."
  echo "Run: vercel login"
  exit 1
fi

echo "Checking DNS for vercel.com..."
if ! nslookup vercel.com >/dev/null 2>&1; then
  echo "FAIL: DNS lookup for vercel.com failed."
  echo "Fix local DNS/network before deploying."
  exit 1
fi

echo "Checking HTTPS reachability to vercel.com..."
if ! curl -I https://vercel.com >/dev/null 2>&1; then
  echo "FAIL: HTTPS request to vercel.com failed."
  echo "DNS may be intermittent, or outbound network access may be blocked."
  exit 1
fi

echo "Preflight OK: Vercel CLI, auth, DNS, and HTTPS are working."
