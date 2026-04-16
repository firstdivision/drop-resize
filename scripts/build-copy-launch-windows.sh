#!/usr/bin/env bash
set -euo pipefail

APP_EXE_NAME="drop-resize.exe"
WIN_TARGET_DIR="/mnt/c/Temp/drop-resize-test"

VERSION="$(node -p "JSON.parse(require('fs').readFileSync('package.json','utf8')).version")"
BUILD_DIR="release/${VERSION}/win-unpacked"
WIN_BUILD_DIR="${WIN_TARGET_DIR}/win-unpacked"

if [[ ! -d /mnt/c ]]; then
  echo "This command is intended to run from WSL with /mnt/c mounted."
  exit 1
fi

if ! command -v wine >/dev/null 2>&1 && ! command -v wine64 >/dev/null 2>&1; then
  echo "Missing prerequisite: wine (required by electron-builder for Windows packaging on Linux/WSL)."
  echo "Install it once, then re-run this command:"
  echo "  sudo apt update && sudo apt install -y wine64"
  exit 1
fi

echo "Building Windows unpacked app..."
npm run build -- --win --x64 --dir

if [[ ! -f "${BUILD_DIR}/${APP_EXE_NAME}" ]]; then
  echo "Expected executable not found: ${BUILD_DIR}/${APP_EXE_NAME}"
  exit 1
fi

echo "Copying build output to C drive..."
mkdir -p "${WIN_TARGET_DIR}"
rm -rf "${WIN_BUILD_DIR}"
cp -r "${BUILD_DIR}" "${WIN_BUILD_DIR}"

WIN_EXE_PATH="$(wslpath -m "${WIN_BUILD_DIR}/${APP_EXE_NAME}")"

echo "Launching Windows app: ${WIN_EXE_PATH}"
powershell.exe -NoProfile -Command "Start-Process -FilePath '${WIN_EXE_PATH}'"
