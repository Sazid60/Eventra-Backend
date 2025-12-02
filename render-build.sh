#!/usr/bin/env bash
#exit on error 
# set -o errexit

# npm install 
# npm run build

# npx prisma generate 
# npx prisma migrate deploy

set -e

# install everything including dev deps
npm ci --include=dev

# generate prisma client (optional; can be postinstall)
npx prisma generate --schema=./prisma/schema

# build
npm run build

# copy templates into dist
npm run postbuild || true

# remove dev dependencies for production
npm prune --production

npx prisma migrate deploy