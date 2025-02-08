#!/bin/bash

# Set the optional test path
TEST_PATH=$1

# Set the optional test seed
TEST_SEED=$2

echo "Running tests in path: $TEST_PATH with seed $TEST_SEED"

# Container names
REDIS_CONTAINER="test-redis"
TEST_CONTAINER="test-runner"

# Image names
REDIS_IMAGE="redis:alpine"
TEST_IMAGE="blot-tests"

# Paths (adjust as needed)
TESTS_DIR=$(dirname "$0") # Directory containing this script
APP_DIR=$(realpath "$TESTS_DIR/../app")
CONFIG_DIR=$(realpath "$TESTS_DIR/../config")
NOTES_DIR=$(realpath "$TESTS_DIR/../notes")
TODO_FILE=$(realpath "$TESTS_DIR/../todo.txt")
GIT_DIR=$(realpath "$TESTS_DIR/../.git")
TEST_ENV_FILE="$TESTS_DIR/test.env"

# Stop and remove any existing containers
docker rm -f $REDIS_CONTAINER $TEST_CONTAINER 2>/dev/null || true

# Check if test.env exists
if [ ! -f "$TEST_ENV_FILE" ]; then
  echo "Error: $TEST_ENV_FILE does not exist in the tests directory."
  exit 1
fi

# Start Redis container
docker run -d \
  --name $REDIS_CONTAINER \
  --rm \
  $REDIS_IMAGE \
  sh -c "rm -f /data/dump.rdb && redis-server"

# Build the test image
docker build \
  --target dev \
  -t $TEST_IMAGE \
  $(realpath "$TESTS_DIR/..")

# Run the test container
docker run --rm \
  --name $TEST_CONTAINER \
  --link $REDIS_CONTAINER:redis \
  --env-file "$TEST_ENV_FILE" \
  -e TEST_PATH="$TEST_PATH" \
  -e TEST_SEED="$TEST_SEED" \
  -e BLOT_REDIS_HOST="redis" \
  -e BLOT_HOST="localhost" \
  -v "$APP_DIR:/usr/src/app/app" \
  -v "$TESTS_DIR:/usr/src/app/tests" \
  -v "$CONFIG_DIR:/usr/src/app/config" \
  -v "$NOTES_DIR:/usr/src/app/notes" \
  -v "$TODO_FILE:/usr/src/app/todo.txt" \
  -v "$GIT_DIR:/usr/src/app/.git" \
  $TEST_IMAGE \
  sh -c "rm -rf /usr/src/app/data && mkdir /usr/src/app/data && node -v && npm -v && nyc --include $TEST_PATH node tests $TEST_PATH $TEST_SEED"

# Stop Redis container
docker stop $REDIS_CONTAINER