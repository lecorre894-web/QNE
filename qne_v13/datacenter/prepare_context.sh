#!/usr/bin/env sh
set -eu
BASE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$BASE/../.." && pwd)
DEST="$BASE/build"
# Do not send the entire original QNE Git repo or sparse vr_*.bin files to Docker.
mkdir -p "$DEST/qne_v12/lib" "$DEST/qne_v13/lib"
cp "$ROOT/qne_v12/compute_thread.js" "$ROOT/qne_v12/worker.js" "$ROOT/qne_v12/client.js" "$DEST/qne_v12/"
cp "$ROOT/qne_v12/lib/common.js" "$ROOT/qne_v12/lib/tasks.js" "$ROOT/qne_v12/lib/store.js" "$DEST/qne_v12/lib/"
cp "$ROOT/qne_v13/coordinator.js" "$ROOT/qne_v13/worker.js" "$DEST/qne_v13/"
cp "$ROOT/qne_v13/lib/cooperative_store.js" "$DEST/qne_v13/lib/"
cp "$BASE/Dockerfile" "$DEST/Dockerfile"
cat > "$DEST/.dockerignore" <<'IGNORE'
.git
**/*.json
**/*.key
**/*.pem
**/*.log
node_modules
IGNORE
printf 'Contexte Docker restreint cree: %s\n' "$DEST"
