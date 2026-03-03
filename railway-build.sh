#!/bin/bash
set -e

# Install Typst
curl -L https://github.com/typst/typst/releases/download/v0.14.2/typst-x86_64-unknown-linux-musl.tar.xz | tar -xJ
mkdir -p ./bin
mv typst-x86_64-unknown-linux-musl/typst ./bin
rm -rf typst-x86_64-unknown-linux-musl

# Build
npm run build

# Copy typst template files to dist
cp -r src/features/assignment/pdf/typst-template dist/src/features/assignment/pdf/
