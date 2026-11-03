#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
node qne_v2.js "$@"
