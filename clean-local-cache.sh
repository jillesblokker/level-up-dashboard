#!/bin/sh
# Clean local Next.js and node_modules cache for a fresh build
echo "Cleaning .next, node_modules/.cache, and lockfiles..."
rm -rf .next node_modules/.cache
rm -f pnpm-lock.yaml yarn.lock package-lock.json
pnpm install
pnpm build 