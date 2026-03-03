#!/bin/bash
set -e

# Install Typst
curl -L https://github.com/typst/typst/releases/download/v0.14.2/typst-x86_64-unknown-linux-musl.tar.xz | tar -xJ
mv typst-x86_64-unknown-linux-musl/typst /usr/local/bin/
rm -rf typst-x86_64-unknown-linux-musl

# Build
npm run build
