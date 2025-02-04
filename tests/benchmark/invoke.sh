#!/bin/bash

# Threshold in seconds (modify as needed), default to 1 hour
THRESHOLD={$1:-3600}

echo "Running benchmark with threshold $THRESHOLD seconds"

# Start time
START_TIME=$(date +%s.%N)

# Run the tests in the specified path using docker-compose
docker-compose -p blot-benchmark -f tests/benchmark/docker-compose.yml up --build --abort-on-container-exit --remove-orphans

# End time
END_TIME=$(date +%s.%N)

# Calculate elapsed time
ELAPSED_TIME=$(echo "$END_TIME - $START_TIME" | bc)

# Output elapsed time
echo "Elapsed time: $ELAPSED_TIME seconds"

# Check if the elapsed time exceeds the threshold
if (( $(echo "$ELAPSED_TIME > $THRESHOLD" | bc -l) )); then
  echo "Benchmark failed: Elapsed time exceeds threshold of $THRESHOLD seconds"
  exit 1
else
  echo "Benchmark passed: Elapsed time is within threshold"
  exit 0
fi