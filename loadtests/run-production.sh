#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

HOST="${LOADTEST_HOST:-https://ai-arena-vietnam.uet.edu.vn}"
STAMP="$(date +%Y%m%d-%H%M%S)"
RESULT_DIR="loadtests/results/run-${STAMP}"
mkdir -p "$RESULT_DIR"

SCENARIO="${1:-burst}"

case "$SCENARIO" in
  burst)
    USERS=50
    RATE=10
    TIME=5m
    ;;
  sustained)
    USERS=80
    RATE=5
    TIME=10m
    ;;
  ramp)
    export LOADTEST_SHAPE=ramp
    USERS=100
    RATE=10
    TIME=12m
    ;;
  auth-ramp)
    export LOADTEST_SHAPE=auth-ramp
    export LOADTEST_SCENARIO=auth
    export LOADTEST_POOL_SIZE="${LOADTEST_POOL_SIZE:-500}"
    USERS=500
    RATE=20
    TIME=18m
    ;;
  scoreboard-burst)
    export LOADTEST_SCENARIO=scoreboard
    USERS=60
    RATE=60
    TIME=90s
    ;;
  scoreboard-2k)
    export LOADTEST_SCENARIO=scoreboard
    USERS=80
    RATE=80
    TIME=2m
    ;;
  *)
    echo "Usage: $0 [burst|sustained|ramp|auth-ramp|scoreboard-burst|scoreboard-2k]"
    exit 1
    ;;
esac

echo "Running Locust scenario=$SCENARIO host=$HOST users=$USERS rate=$RATE time=$TIME filter=${LOADTEST_SCENARIO:-mixed}"
locust -f loadtests/locustfile.py \
  --host "$HOST" \
  --headless \
  -u "$USERS" \
  -r "$RATE" \
  -t "$TIME" \
  --csv "$RESULT_DIR/stats" \
  --html "$RESULT_DIR/report.html" \
  2>&1 | tee "$RESULT_DIR/run.log"

echo "Results: $RESULT_DIR"
