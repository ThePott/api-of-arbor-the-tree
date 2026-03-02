#!/bin/bash
set -e

# Install Typst
curl -L https://github.com/typst/typst/releases/download/v0.14.2/typst-x86_64-unknown-linux-musl.tar.xz | tar -xJ
mv typst-x86_64-unknown-linux-musl/typst /usr/local/bin/
sudo rm -rf typst-x86_64-unknown-linux-musl

# Install Noto Serif KR fonts
mkdir -p /usr/share/fonts/noto/NotoSerifKr
curl -L https://github.com/notofonts/noto-cjk/releases/download/Serif2.003/08_NotoSerifCJKkr.zip -o NotoSerifKr.zip 
unzip NotoSerifKr.zip -d /usr/share/fonts/NotoSansKR
fc-cache -fv
sudo rm NotoSerifKr.zip

# Build
npm run build
